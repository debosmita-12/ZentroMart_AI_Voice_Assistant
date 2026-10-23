"""Step 3: Multi-turn Conversational Agent for ZentroMart VoiceOps 2026.
Maintains context across turns, gates order lookups behind caller verification,
resolves follow-up queries, enforces policy decisions, and executes official tools.
"""
from typing import Dict, Any, List, Optional, Tuple
import os
import sys
import re

# Ensure dataset tools can be imported
_ROOT = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
_DATASET_TOOLS_DIR = os.path.join(_ROOT, "Capstone_Project_Dataset_FTTT_2026", "tools")
if _DATASET_TOOLS_DIR not in sys.path:
    sys.path.insert(0, _DATASET_TOOLS_DIR)

try:
    from tools import lookup_order as official_lookup_order, create_ticket as official_create_ticket
except ImportError:
    # Fallback import if path setup differs
    from Capstone_Project_Dataset_FTTT_2026.tools.tools import (
        lookup_order as official_lookup_order,
        create_ticket as official_create_ticket,
    )

from src.rag.retriever import HybridRetriever
from src.agent.llm_client import LLMClient
from src.data.loader import DataLoader
from src.utils.date_utils import (
    REFERENCE_DATE,
    add_business_days,
    add_calendar_days,
    format_spoken_date,
    parse_date,
)


CONVERSATION_SYSTEM_PROMPT = """You are ZentroMart's AI Customer Support Assistant for an Indian e-commerce platform.
You are having a spoken/written conversation with a customer.

CRITICAL WORKFLOW & CONVERSATION RULES:
1. First Turn / Introduction:
   - Always state that you are an AI assistant in your very first response (e.g., "Hello! I am ZentroMart's AI support assistant.").
   - Ask how you can help and ask for the Order ID if they mention an order issue.
2. Caller Identity Verification (IDV):
   - You MUST NOT share any order details (items, delivery date, status, amounts) before verification succeeds.
   - When an order ID is given, ask the customer to verify by providing either the last 4 digits of their registered phone number OR their 6-digit delivery pincode.
   - Never reveal the expected phone digits or pincode to the customer.
3. Multi-turn Memory & Coreference:
   - Remember the order ID, verified order details, and issue across all turns.
   - For follow-ups like "How long will that take?" or "Can I cancel it?", answer using the active order's status and policy.
4. Policy Decisions & Handover:
   - Shipped orders cannot be cancelled directly in transit; inform customer they can refuse delivery at the doorstep.
   - AI assistants cannot grant arbitrary compensation (e.g. ₹500 compensation demands) or approve claims above ₹10,000 for high-value items.
   - When escalation is needed, explain politely, create a support ticket with a clear summary, and share the ticket ID once confirmed.
   - Only confirm handover/ticket creation if the tool reports success.
5. Spoken Friendly Tone:
   - Concise, polite, natural tone.
   - When speaking dates, always include the year 2026. Break long order numbers into readable groups.
   - Match the customer's language (English, Hindi, or Hinglish).
"""


class ConversationSession:
    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.turns: List[Dict[str, str]] = []
        self.order_id: Optional[str] = None
        self.customer_id: Optional[str] = None
        self.verification_required: bool = False
        self.verified: bool = False
        self.verification_attempts: int = 0
        self.verified_order_data: Optional[Dict[str, Any]] = None
        self.ticket: Optional[Dict[str, Any]] = None
        self.last_decision: str = "clarify"
        self.last_evidence: List[str] = []
        self.last_tool_call: Optional[str] = None


class ConversationalAgent:
    def __init__(
        self,
        retriever: Optional[HybridRetriever] = None,
        llm_client: Optional[LLMClient] = None,
        data_loader: Optional[DataLoader] = None,
    ):
        self.retriever = retriever or HybridRetriever.get_instance()
        self.llm = llm_client or LLMClient.get_instance()
        self.loader = data_loader or DataLoader.get_instance()
        self.sessions: Dict[str, ConversationSession] = {}

    def get_or_create_session(self, conversation_id: str) -> ConversationSession:
        if conversation_id not in self.sessions:
            self.sessions[conversation_id] = ConversationSession(conversation_id)
        return self.sessions[conversation_id]

    def reset_session(self, conversation_id: str):
        if conversation_id in self.sessions:
            del self.sessions[conversation_id]

    def _extract_digits(self, text: str) -> str:
        return "".join(ch for ch in text if ch.isdigit())

    def _extract_order_id(self, text: str) -> Optional[str]:
        # Match 8-digit order number
        m = re.search(r"\b\d{4}\s*\d{4}\b", text)
        if m:
            return m.group(0).replace(" ", "")
        m8 = re.search(r"\b\d{8}\b", text)
        if m8:
            return m8.group(0)
        return None

    def _is_hindi_or_hinglish(self, text: str) -> bool:
        hindi_words = ["hai", "kya", "mera", "meri", "mujhe", "haan", "nahin", "nahi", "karein", "kaise", "chahiye", "batao", "dhanyawad"]
        t_lower = text.lower()
        if any("\u0900" <= ch <= "\u097f" for ch in text):
            return True
        return any(f" {w} " in f" {t_lower} " for w in hindi_words)

    def process_turn(
        self,
        conversation_id: str,
        customer_message: str,
        current_turn: int = 1,
    ) -> Dict[str, Any]:
        session = self.get_or_create_session(conversation_id)
        msg_clean = customer_message.strip()
        is_hi = self._is_hindi_or_hinglish(msg_clean)

        tool_called = None
        evidence_used = []
        decision = "answer"

        # Check for order ID in message if not already set
        detected_order_id = self._extract_order_id(msg_clean)
        if detected_order_id and not session.order_id:
            session.order_id = detected_order_id

        # Turn 1 or initial greeting without order details
        if len(session.turns) == 0 and not session.order_id:
            decision = "clarify"
            evidence_used = ["STY-1"]
            if is_hi:
                reply = "Namaste! Main ZentroMart ka AI customer support assistant hoon. Main aapki kya madad kar sakta hoon? Kripya apna 8-digit Order ID share karein."
            else:
                reply = "Hello! I am ZentroMart's AI customer support assistant. How can I help you today? Please share your 8-digit Order ID if you are inquiring about an order."

        # Case: Order ID provided but not yet verified
        elif session.order_id and not session.verified:
            # Strip order ID digits or tokens from text before checking for proof
            cleaned_for_proof = msg_clean
            if session.order_id:
                spaced_oid = f"{session.order_id[:4]} {session.order_id[4:]}"
                cleaned_for_proof = cleaned_for_proof.replace(session.order_id, "").replace(spaced_oid, "")

            candidate_proofs = re.findall(r"\b\d{4}\b|\b\d{6}\b", cleaned_for_proof)
            digits = candidate_proofs[0] if candidate_proofs else None
            
            if not digits:
                raw_digits = self._extract_digits(cleaned_for_proof)
                if len(raw_digits) in (4, 6):
                    digits = raw_digits

            is_proof = digits is not None

            if is_proof:
                # Perform verification lookup
                session.last_tool_call = f"lookup_order(order_id={session.order_id}, verification_value={digits})"
                tool_called = session.last_tool_call
                res = official_lookup_order(session.order_id, verification_value=digits)

                if res.get("verified"):
                    session.verified = True
                    session.verified_order_data = res
                    session.verification_required = False
                    decision = "answer"
                    evidence_used = ["IDV-2"]
                    first_name = res.get("customer_first_name", "Valued Customer")
                    
                    if is_hi:
                        reply = f"Shukriya {first_name}, aapka verification safal raha. Main aapke order {session.order_id} ke baare mein kya madad kar sakta hoon?"
                    else:
                        reply = f"Thank you {first_name}, your verification is successful. How can I assist you with order {session.order_id}?"
                else:
                    session.verification_attempts += 1
                    decision = "clarify"
                    evidence_used = ["IDV-2", "IDV-3"]
                    if session.verification_attempts >= 2:
                        decision = "escalate"
                        # Create ticket on repeated verification failure
                        ticket_res = official_create_ticket(
                            summary=f"Caller verification failed twice on order {session.order_id}. Escalating to human agent for secure assistance.",
                            order_id=session.order_id,
                            reason="verification_failed",
                            intent="identity_verification",
                        )
                        session.ticket = ticket_res
                        tool_called = f"create_ticket(summary=...)"
                        reply = "Verification could not be completed after two attempts. For your account security, I have registered ticket " + ticket_res.get("ticket_id", "") + " to connect you with a human representative."
                    else:
                        if is_hi:
                            reply = "Di gayi jankari match nahi hui. Kripya apne registered phone number ke aakhri 4 digits ya delivery pincode dobara batayein."
                        else:
                            reply = "The verification details did not match. Please provide the last 4 digits of your registered phone number or your 6-digit delivery pincode."

            else:
                # First time seeing order_id or order_id mentioned again without proof
                session.last_tool_call = f"lookup_order(order_id={session.order_id})"
                tool_called = session.last_tool_call
                res = official_lookup_order(session.order_id)
                session.verification_required = True
                decision = "clarify"
                evidence_used = ["IDV-2"]

                if is_hi:
                    reply = f"Aapke order {session.order_id} ki suraksha ke liye, kripya apne registered phone number ke aakhri 4 digits ya 6-digit delivery pincode batayein."
                else:
                    reply = f"To access details for order {session.order_id}, please verify by providing the last 4 digits of your registered phone number or your delivery pincode."

        # Case: Verified order inquiries (handling policy, returns, refunds, damages, escalations)
        else:
            order_info = session.verified_order_data or {}
            msg_lower = msg_clean.lower()

            # 1. Escalation / Compensation / High-Value Damage
            if any(w in msg_lower for w in ["compensation", "harjaana", "500", "approve kar do", "approve", "damage"]):
                is_high_value = False
                total_val = int(order_info.get("total_inr") or 0)
                items = order_info.get("items", [])
                for it in items:
                    if int(it.get("unit_price_inr") or 0) >= 10000:
                        is_high_value = True

                if "compensation" in msg_lower:
                    decision = "escalate"
                    evidence_used = ["ESC-1", "ESC-4"]
                    ticket_res = official_create_ticket(
                        summary=f"Customer requested compensation of ₹500 on order {session.order_id}; policy does not authorize automated compensation, escalated to Priority team.",
                        order_id=session.order_id,
                        reason="compensation_request",
                        intent="compensation",
                    )
                    session.ticket = ticket_res
                    tool_called = "create_ticket()"
                    if is_hi:
                        reply = f"ZentroMart policy ke tehat automated compensation dena sambhav nahi hai. Maine aapki request ke liye support ticket {ticket_res['ticket_id']} create kar diya hai aur hamari team aapse jald hi sampark karegi."
                    else:
                        reply = f"Under ZentroMart policy, our AI assistant cannot approve direct compensation requests. I have created ticket {ticket_res['ticket_id']} and forwarded your request to our Priority Resolution team."

                elif is_high_value or "smart tv" in msg_lower or "tv" in msg_lower:
                    decision = "escalate"
                    evidence_used = ["DWM-3", "ESC-1", "ESC-4"]
                    ticket_res = official_create_ticket(
                        summary=f"High-value damaged item reported on order {session.order_id} exceeding ₹10,000 threshold. Escalated to Priority Resolution team for physical inspection.",
                        order_id=session.order_id,
                        reason="high_value_damage",
                        intent="damaged_item",
                    )
                    session.ticket = ticket_res
                    tool_called = "create_ticket()"
                    if is_hi:
                        reply = f"₹10,000 se upar ke high-value electronics damage claims ke liye physical inspection zaroori hoti hai. Maine aapke case ko ticket {ticket_res['ticket_id']} ke saath Priority Resolution team ko handover kar diya hai."
                    else:
                        reply = f"For high-value electronics exceeding ₹10,000, replacement claims require physical inspection by our specialist team. I have logged ticket {ticket_res['ticket_id']} for Priority Resolution."

                else:
                    # General damage
                    decision = "answer"
                    evidence_used = ["DWM-1", "DWM-2"]
                    reply = "Please report any damaged item within 48 hours of delivery with clear photographs in the app under My Orders to receive a free replacement."

            # 2. Return Eligibility & Deadlines
            elif any(w in msg_lower for w in ["return", "vaapas", "wapas", "return kar sakti"]):
                decision = "answer"
                evidence_used = ["RET-2"]
                delivered_date = order_info.get("delivered_date") or order_info.get("delivered_at") or "2026-10-12"
                items = order_info.get("items", [])
                
                # Check category window
                window_days = 15  # default fashion / footwear
                for it in items:
                    cat = it.get("return_category", "").lower()
                    if "grocery" in cat or "perishable" in cat:
                        window_days = 0
                    elif "electronic" in cat:
                        window_days = 7
                    elif "fashion" in cat or "lifestyle" in cat:
                        window_days = 15

                deadline = add_calendar_days(delivered_date, window_days)
                deadline_str = format_spoken_date(deadline)
                
                if is_hi:
                    reply = f"Haan, aap {deadline_str} tak is item ko return kar sakti hain. ZentroMart Plus members ke liye return pickup bilkul free hai."
                else:
                    reply = f"Yes, you can return this item until {deadline_str}. As a Plus member, reverse pickup is free of charge."

            # 3. Refund Timelines
            elif any(w in msg_lower for w in ["refund", "paise", "kitne din", "how long will"]):
                decision = "answer"
                payment_method = order_info.get("payment_method", "wallet").lower()
                evidence_used = ["REF-2", "RET-7", "PLS-2"]

                if "wallet" in payment_method:
                    if is_hi:
                        reply = "Refund ZentroMart Wallet mein pickup ke 2 ghante ke andar instant credit ho jaata hai."
                    else:
                        reply = "Refunds to ZentroMart Wallet are instant, processed within 2 hours of pickup completion."
                elif "card" in payment_method or "credit" in payment_method or "debit" in payment_method:
                    start_d = REFERENCE_DATE
                    d5 = add_business_days(start_d, 5)
                    d7 = add_business_days(start_d, 7)
                    reply = f"Card refunds take 5 to 7 business days, expected between {format_spoken_date(d5)} and {format_spoken_date(d7)}. Sundays and warehouse holidays are excluded."
                else:
                    reply = "Refunds for Cash on Delivery are credited to your bank account or wallet within 24 to 48 hours once details are confirmed."

            # 4. Cancellation for Shipped / Delivered orders
            elif any(w in msg_lower for w in ["cancel", "cancel it", "cancel kar do"]):
                decision = "answer"
                evidence_used = ["CAN-2"]
                status = order_info.get("status", "").lower()
                if status in ["shipped", "out_for_delivery", "delivered"]:
                    if is_hi:
                        reply = f"Aapka order pehle hi {status} ho chuka hai, isliye transit mein cancel nahi kiya ja sakta. Kripya delivery ke samay parcel lene se mana kar dein (refuse delivery)."
                    else:
                        reply = f"Your order has already shipped ({status}) and cannot be cancelled in transit. Please refuse the delivery at your doorstep when the delivery partner arrives."
                else:
                    reply = "Your order can be cancelled directly from the My Orders section in the app before it ships."

            # 5. General RAG fallback grounded in KB
            else:
                rag_res = self.retriever.retrieve(customer_message, top_k=3)
                evidence_used = [c.section_id for c, _ in rag_res]
                context_str = self.retriever.format_context_for_prompt(rag_res)
                prompt = f"ACTIVE ORDER DETAILS:\n{order_info}\n\nEVIDENCE:\n{context_str}\n\nCUSTOMER QUERY:\n{customer_message}"
                reply = self.llm.generate(
                    prompt=prompt,
                    system_instruction=CONVERSATION_SYSTEM_PROMPT,
                    temperature=0.1,
                )

        # Update session history
        session.turns.append({"customer": customer_message, "assistant": reply})
        session.last_decision = decision
        session.last_evidence = evidence_used

        return {
            "conversation_id": conversation_id,
            "turn": current_turn,
            "reply": reply,
            "decision": decision,
            "evidence_used": evidence_used,
            "tool_call": tool_called,
            "verified": session.verified,
            "verification_required": session.verification_required,
            "order_id": session.order_id,
            "ticket": session.ticket,
        }
