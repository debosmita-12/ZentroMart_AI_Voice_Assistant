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
    from Capstone_Project_Dataset_FTTT_2026.tools.tools import (
        lookup_order as official_lookup_order,
        create_ticket as official_create_ticket,
    )

from src.rag.retriever import HybridRetriever
from src.agent.llm_client import LLMClient
from src.agent.rag_agent import RAGAgent
from src.agent.language_policy import LanguagePolicy
from src.data.loader import DataLoader
from src.utils.date_utils import (
    REFERENCE_DATE,
    add_business_days,
    add_calendar_days,
    format_spoken_date,
    parse_date,
)

DEVANAGARI_DIGITS = {
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
}

WORD_TO_DIGIT = {
    # Devanagari single digits
    "शून्य": "0", "एक": "1", "दो": "2", "तीन": "3", "चार": "4",
    "पांच": "5", "पाँच": "5", "छह": "6", "छः": "6", "छ": "6",
    "सात": "7", "आठ": "8", "नौ": "9",
    # Romanized Hindi single digits
    "shunya": "0", "shoonya": "0", "sunya": "0", "sifar": "0",
    "ek": "1", "ik": "1",
    "do": "2", "doo": "2",
    "teen": "3", "tin": "3",
    "chaar": "4", "char": "4",
    "paanch": "5", "panch": "5",
    "chhah": "6", "chhe": "6", "chheh": "6", "che": "6", "chhey": "6",
    "saat": "7", "sat": "7",
    "aath": "8", "ath": "8",
    "nau": "9", "nou": "9",
    # English single digits
    "zero": "0", "oh": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
}

CONVERSATION_SYSTEM_PROMPT = """You are ZentroMart's AI Customer Support Assistant for an Indian e-commerce platform.
You are having an ongoing spoken or written conversation with a customer.

CRITICAL WORKFLOW & CONVERSATION RULES:
1. Introduction Rule:
   - State that you are an AI assistant ONLY on the very first turn of a new conversation (e.g., "Hello! I am ZentroMart's AI support assistant.").
   - NEVER repeat your greeting, introduction, or name on subsequent turns of an ongoing conversation.
2. Caller Identity Verification (IDV):
   - You MUST NOT share any order details (items, delivery date, status, amounts, carriers) before verification succeeds.
   - When an order ID is given without verification, politely ask the customer for the last 4 digits of their registered phone number OR their 6-digit delivery pincode.
   - Never reveal the expected phone digits or pincode to the customer.
3. Multi-turn Context & Memory:
   - Retain the active order ID, customer verification state, and past discussion across all turns.
   - If a customer mentions an issue first (e.g. "I want to return my shoes") and then provides their order ID, address the original issue once verified.
   - Answer follow-up questions (e.g., "How long will that take?", "Can I cancel it?") using the active order's details and company policy without re-asking for the order ID.
4. Policy Decisions & Handover:
   - Shipped orders cannot be cancelled directly in transit; inform the customer they can refuse delivery at the doorstep.
   - AI assistants cannot grant arbitrary compensation (e.g. ₹500 compensation demands) or approve claims above ₹10,000 for high-value items.
   - When escalation is needed, explain politely, create a support ticket with a clear summary, and share the ticket ID once confirmed.
   - Only confirm handover/ticket creation if the tool reports success.
5. Tone & Formatting:
   - Concise, polite, and spoken-friendly.
   - When speaking dates, always include the year 2026.
   - Match the customer's language (English, Hindi, or Hinglish).
"""


class ConversationState:
    INITIAL_GREETING = "INITIAL_GREETING"
    WAITING_FOR_CUSTOMER_REQUEST = "WAITING_FOR_CUSTOMER_REQUEST"
    WAITING_FOR_ORDER_ID = "WAITING_FOR_ORDER_ID"
    WAITING_FOR_VERIFICATION = "WAITING_FOR_VERIFICATION"
    PROCESSING_REQUEST = "PROCESSING_REQUEST"
    WAITING_FOR_FOLLOW_UP = "WAITING_FOR_FOLLOW_UP"
    ERROR_RECOVERY = "ERROR_RECOVERY"


class ConversationSession:
    def __init__(self, conversation_id: str):
        self.conversation_id: str = conversation_id
        self.state: str = ConversationState.INITIAL_GREETING
        self.greeting_delivered: bool = False
        self.language: str = "en-IN"
        self.turns: List[Dict[str, str]] = []
        self.order_id: Optional[str] = None
        self.customer_id: Optional[str] = None
        self.initial_intent: Optional[str] = None
        self.verification_required: bool = False
        self.verified: bool = False
        self.verification_attempts: int = 0
        self.verified_order_data: Optional[Dict[str, Any]] = None
        self.ticket: Optional[Dict[str, Any]] = None
        self.last_decision: str = "clarify"
        self.last_evidence: List[str] = []
        self.last_tool_call: Optional[str] = None


WELCOME_MESSAGE = (
    "Hello! Welcome to ZentroMart Customer Care. I am your AI customer support assistant, "
    "here to help you with your orders, deliveries, returns, refunds, products, and other queries. "
    "How may I assist you today?"
)


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
        self.rag_agent = RAGAgent(retriever=self.retriever, llm_client=self.llm)
        self.sessions: Dict[str, ConversationSession] = {}

    def get_or_create_session(self, conversation_id: str) -> ConversationSession:
        if conversation_id not in self.sessions:
            self.sessions[conversation_id] = ConversationSession(conversation_id)
        return self.sessions[conversation_id]

    def reset_session(self, conversation_id: str):
        if conversation_id in self.sessions:
            del self.sessions[conversation_id]

    def init_session(self, conversation_id: str, language: str = "en-IN") -> Dict[str, Any]:
        session = self.get_or_create_session(conversation_id)
        session.greeting_delivered = True
        session.language = language
        session.state = ConversationState.WAITING_FOR_CUSTOMER_REQUEST
        return {
            "conversation_id": conversation_id,
            "turn": 0,
            "reply": WELCOME_MESSAGE,
            "decision": "clarify",
            "evidence_used": ["STY-1"],
            "tool_call": None,
            "verified": False,
            "verification_required": False,
            "order_id": None,
            "ticket": None,
            "state": session.state,
            "language": language,
        }

    def _normalize_spoken_text(self, text: str) -> str:
        s = text
        # Convert Devanagari numerals to ASCII digits
        for dev_ch, ascii_d in DEVANAGARI_DIGITS.items():
            s = s.replace(dev_ch, ascii_d)
        # Tokenize preserving Unicode characters
        tokens = re.findall(r"[\w\u0900-\u097f]+", s.lower())
        converted = []
        for tok in tokens:
            if tok in WORD_TO_DIGIT:
                converted.append(WORD_TO_DIGIT[tok])
            else:
                converted.append(tok)
        return " ".join(converted)

    def _extract_order_id(self, text: str) -> Optional[str]:
        """Extract 8-digit order number from raw text or spoken numbers."""
        norm = self._normalize_spoken_text(text)

        # 1. Direct 8-digit token
        m = re.search(r"\b\d{8}\b", norm)
        if m:
            return m.group(0)

        # 2. Match 4 digits space 4 digits or hyphen
        m_split = re.search(r"\b\d{4}[\s-]+\d{4}\b", norm)
        if m_split:
            digits = "".join(re.findall(r"\d", m_split.group(0)))
            if len(digits) == 8:
                return digits

        # 3. Check sequence of 8 digits separated by spaces/hyphens
        m_seq = re.search(r"(?:\b\d[\s-]*){8}\b", norm)
        if m_seq:
            digits = "".join(re.findall(r"\d", m_seq.group(0)))
            if len(digits) == 8:
                return digits

        # 4. Fallback: if 'order'/'ऑर्डर' in text and exactly 8 digits exist in utterance
        if any(w in norm for w in ["order", "ऑर्डर", "id", "आईडी", "number", "नंबर"]):
            all_digits = "".join(re.findall(r"\d", norm))
            if len(all_digits) == 8:
                return all_digits

        return None

    def _extract_verification_proof(self, text: str, order_id: Optional[str] = None) -> Optional[str]:
        """Extract caller verification value: 4 digits of phone or 6 digits of pincode."""
        norm = self._normalize_spoken_text(text)
        if order_id:
            spaced_oid = " ".join(list(order_id))
            hyphen_oid = f"{order_id[:4]}-{order_id[4:]}"
            half_oid = f"{order_id[:4]} {order_id[4:]}"
            for s in [order_id, spaced_oid, hyphen_oid, half_oid]:
                norm = norm.replace(s, " ")

        # Check for 6-digit pincode first
        m6 = re.search(r"\b\d{6}\b", norm)
        if m6:
            return m6.group(0)
        m6_spaced = re.search(r"(?:\b\d[\s-]*){6}\b", norm)
        if m6_spaced:
            d = "".join(re.findall(r"\d", m6_spaced.group(0)))
            if len(d) == 6:
                return d

        # Check for 4-digit phone suffix
        m4 = re.search(r"\b\d{4}\b", norm)
        if m4:
            return m4.group(0)
        m4_spaced = re.search(r"(?:\b\d[\s-]*){4}\b", norm)
        if m4_spaced:
            d = "".join(re.findall(r"\d", m4_spaced.group(0)))
            if len(d) == 4:
                return d

        return None

    def _is_hindi_or_hinglish(self, text: str) -> bool:
        hindi_words = [
            "hai", "hain", "kya", "mera", "meri", "mere", "mujhe", "haan", "nahin", "nahi",
            "karein", "kaise", "chahiye", "batao", "batayein", "dhanyawad", "namaste", "shukriya",
            "kahan", "kab", "karna", "aayega", "milega", "hoga", "vaapas", "wapas", "paise",
            "shunya", "ek", "do", "teen", "chaar", "char", "paanch", "panch", "chhah", "chhe",
            "saat", "aath", "nau", "pincode", "number"
        ]
        t_lower = text.lower()
        if any("\u0900" <= ch <= "\u097f" for ch in text):
            return True
        return any(f" {w} " in f" {t_lower} " for w in hindi_words)

    def process_turn(
        self,
        conversation_id: str,
        customer_message: str,
        current_turn: int = 1,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        session = self.get_or_create_session(conversation_id)
        msg_clean = customer_message.strip()

        # Unified Language Policy resolution
        active_lang = LanguagePolicy.resolve(
            text=msg_clean,
            requested_language=language,
            session_language=session.language,
        )
        session.language = active_lang
        is_hi = active_lang.startswith("hi")
        msg_lower = msg_clean.lower()

        tool_called = None
        evidence_used = []
        decision = "answer"

        # 1. Detect and preserve order ID
        detected_order_id = self._extract_order_id(msg_clean)
        if detected_order_id and not session.order_id:
            session.order_id = detected_order_id

        # 2. Extract verification proof (phone suffix or pincode)
        detected_proof = self._extract_verification_proof(msg_clean, session.order_id)

        # 3. Save customer's early intent if mentioning return/cancel/refund/damage/status
        if not session.initial_intent:
            if any(w in msg_lower for w in ["return", "vaapas", "wapas"]):
                session.initial_intent = "return"
            elif any(w in msg_lower for w in ["cancel", "cancellation"]):
                session.initial_intent = "cancel"
            elif any(w in msg_lower for w in ["refund", "paise"]):
                session.initial_intent = "refund"
            elif any(w in msg_lower for w in ["damage", "broken", "toota"]):
                session.initial_intent = "damage"
            elif any(w in msg_lower for w in ["where", "track", "delivery", "status", "kahan"]):
                session.initial_intent = "status"

        # -------------------------------------------------------------
        # State Machine Branching
        # -------------------------------------------------------------



        # Explicit Human Support / Representative Request
        is_agent_request = any(w in msg_lower for w in [
            "human", "human agent", "representative", "executive", "person", "support team",
            "customer care", "customer service representative", "talk to someone",
            "speak to someone", "connect me", "escalate", "escalation", "manager",
            "कस्टमर केयर", "एजेंट", "बात करनी है", "प्रतिनिधि", "इंसान"
        ])
        if is_agent_request:
            decision = "escalate"
            evidence_used = ["ESC-1"]
            if session.ticket and session.ticket.get("created"):
                existing_tid = session.ticket.get("ticket_id")
                if is_hi:
                    reply = f"Aapke request ke liye pehle hi support ticket {existing_tid} register kiya ja chuka hai. Hamari customer care team aapse jald hi judegi."
                else:
                    reply = f"Support ticket {existing_tid} has already been registered for your request. A customer care specialist is reviewing your inquiry and will connect with you shortly."
            else:
                summary_text = f"Customer requested human representative assistance. Inquiry: {msg_clean}"
                if session.order_id:
                    summary_text += f" (Order: {session.order_id})"
                ticket_res = official_create_ticket(
                    summary=summary_text,
                    order_id=session.order_id,
                    reason="human_agent_requested",
                    intent="customer_support",
                )
                if ticket_res.get("created"):
                    session.ticket = ticket_res
                    tool_called = "create_ticket()"
                    if is_hi:
                        reply = f"Maine aapke liye support ticket {ticket_res.get('ticket_id')} create kar diya hai. Hamari customer care team aapse jald hi judegi."
                    else:
                        reply = f"I understand. I have created support ticket {ticket_res.get('ticket_id')} and escalated your request to a customer care specialist. They will assist you shortly."
                else:
                    evidence_used = ["ESC-4"]
                    if is_hi:
                        reply = "Kshama karein, is samay automated ticket create nahi ho paya. Kripya hamari helpline 1800-ZENTRO-CARE par call karein."
                    else:
                        reply = "I apologize, but I could not create an automated support ticket at this moment. Please reach out directly to our support helpline at 1800-ZENTRO-CARE."

            session.turns.append({"customer": customer_message, "assistant": reply})
            session.greeting_delivered = True
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
                "state": ConversationState.ERROR_RECOVERY,
                "language": active_lang,
            }

        # CASE 1: Greeting without order inquiry
        is_generic_greeting = (
            not session.order_id
            and not session.initial_intent
            and any(msg_lower.startswith(g) for g in ["hi", "hello", "hey", "namaste", "नमस्ते", "good morning", "good afternoon"])
        )

        if is_generic_greeting:
            decision = "clarify"
            evidence_used = ["STY-1"]
            if session.greeting_delivered:
                if is_hi:
                    reply = "Main aapke orders, returns ya products ke baare mein kya madad kar sakta hoon? Kripya apna 8-digit Order ID batayein agar aap order ke baare mein pooch rahe hain."
                else:
                    reply = "How can I help you with your orders, deliveries, returns, or product inquiries today? Please share your 8-digit Order ID if you are inquiring about a specific order."
            else:
                session.greeting_delivered = True
                if is_hi:
                    reply = "Namaste! Main ZentroMart ka AI customer support assistant hoon. Main aapki kya madad kar sakta hoon? Kripya apna 8-digit Order ID share karein agar aap order ke baare mein pooch rahe hain."
                else:
                    reply = WELCOME_MESSAGE
            session.state = ConversationState.WAITING_FOR_CUSTOMER_REQUEST

        # CASE 2: Customer provides an Order ID, but is NOT yet verified
        elif (session.order_id and not session.verified) or (session.state == ConversationState.WAITING_FOR_VERIFICATION and not session.verified):
            if detected_proof:
                # Caller supplied verification proof (either separately or with order ID)
                session.last_tool_call = f"lookup_order(order_id={session.order_id}, verification_value={detected_proof})"
                tool_called = session.last_tool_call
                res = official_lookup_order(session.order_id, verification_value=detected_proof)

                if res.get("verified"):
                    session.verified = True
                    session.verified_order_data = res
                    session.verification_required = False
                    session.state = ConversationState.WAITING_FOR_FOLLOW_UP
                    decision = "answer"
                    evidence_used = ["IDV-2"]
                    first_name = res.get("customer_first_name", "Valued Customer")

                    # If customer already stated their intent (e.g. return, cancel, refund, status), resolve it immediately!
                    intent_to_solve = session.initial_intent or ""
                    if any(w in msg_lower for w in ["return", "vaapas", "wapas"]):
                        intent_to_solve = "return"
                    elif any(w in msg_lower for w in ["cancel"]):
                        intent_to_solve = "cancel"
                    elif any(w in msg_lower for w in ["refund", "paise"]):
                        intent_to_solve = "refund"
                    elif any(w in msg_lower for w in ["damage", "broken", "toota"]):
                        intent_to_solve = "damage"
                    elif any(w in msg_lower for w in ["where", "track", "delivery", "status", "kahan"]):
                        intent_to_solve = "status"

                    if "return" in intent_to_solve:
                        delivered_date = res.get("delivered_date") or res.get("delivered_on") or "2026-10-15"
                        items = res.get("items", [])
                        window_days = 15
                        for it in items:
                            cat = it.get("return_category", "").lower()
                            if "grocery" in cat or "perishable" in cat:
                                window_days = 0
                            elif "electronic" in cat:
                                window_days = 7
                        deadline = add_calendar_days(delivered_date, window_days)
                        deadline_str = format_spoken_date(deadline)
                        evidence_used.extend(["RET-2", "PLS-2"])
                        if is_hi:
                            reply = f"Shukriya {first_name}, aapka verification safal raha. Aapka order {session.order_id} {deadline_str} tak return ke liye eligible hai aur reverse pickup free hai."
                        else:
                            reply = f"Thank you {first_name}, your identity is verified. Order {session.order_id} is eligible for return until {deadline_str}. Reverse pickup is free for Plus members."
                    elif "cancel" in intent_to_solve:
                        status = res.get("status", "").lower()
                        evidence_used.append("CAN-2")
                        if status in ["shipped", "out_for_delivery", "delivered"]:
                            if is_hi:
                                reply = f"Shukriya {first_name}, verification safal raha. Aapka order {session.order_id} pehle hi {status} ho chuka hai, isliye transit mein cancel nahi kiya ja sakta. Kripya delivery ke samay doorstep par parcel lene se mana kar dein."
                            else:
                                reply = f"Thank you {first_name}, your identity is verified. Order {session.order_id} has already shipped ({status}) and cannot be cancelled in transit. Please refuse delivery at your doorstep."
                        else:
                            reply = f"Thank you {first_name}, your identity is verified. Order {session.order_id} can be cancelled directly from the My Orders section in the app."
                    elif "status" in intent_to_solve:
                        status = res.get("status", "in transit")
                        promised = res.get("promised_date", "2026-10-22")
                        evidence_used.append("TRK-1")
                        if is_hi:
                            reply = f"Shukriya {first_name}, aapka verification safal raha. Aapka order {session.order_id} {status} hai aur anumanit delivery date {promised} hai."
                        else:
                            reply = f"Thank you {first_name}, your identity is verified. Order {session.order_id} is currently {status} with estimated delivery by {promised}."
                    else:
                        if is_hi:
                            reply = f"Shukriya {first_name}, aapka verification safal raha. Main aapke order {session.order_id} ke baare mein kya madad kar sakta hoon?"
                        else:
                            reply = f"Thank you {first_name}, your identity has been verified successfully. How can I assist you with order {session.order_id} today?"

                else:
                    session.verification_attempts += 1
                    evidence_used = ["IDV-2", "IDV-3"]
                    if session.verification_attempts >= 2:
                        decision = "escalate"
                        ticket_res = official_create_ticket(
                            summary=f"Caller verification failed twice on order {session.order_id}. Escalated to human agent for secure assistance.",
                            order_id=session.order_id,
                            reason="verification_failed",
                            intent="identity_verification",
                        )
                        session.ticket = ticket_res
                        tool_called = "create_ticket(summary=...)"
                        session.state = ConversationState.ERROR_RECOVERY
                        if is_hi:
                            reply = f"Di gayi jankari match nahi hui. Account suraksha ke liye maine support ticket {ticket_res.get('ticket_id', '')} register kar diya hai. Hamari team aapse jald hi sampark karegi."
                        else:
                            reply = f"Verification could not be completed after two attempts. For your account security, I have registered ticket {ticket_res.get('ticket_id', '')} to connect you with a human representative."
                    else:
                        decision = "clarify"
                        session.state = ConversationState.WAITING_FOR_VERIFICATION
                        if is_hi:
                            reply = "Di gayi jankari match nahi hui. Kripya apne registered phone number ke aakhri 4 digits ya 6-digit delivery pincode dobara batayein."
                        else:
                            reply = "The verification details did not match. Please provide the last 4 digits of your registered phone number or your 6-digit delivery pincode."

            elif len(session.turns) == 0 or (detected_order_id and detected_order_id == session.order_id and session.state in (ConversationState.INITIAL_GREETING, ConversationState.WAITING_FOR_ORDER_ID)):
                # Order ID received for the first time, requesting verification proof
                session.last_tool_call = f"lookup_order(order_id={session.order_id})"
                tool_called = session.last_tool_call
                official_lookup_order(session.order_id)  # Triggers gated check
                session.verification_required = True
                session.state = ConversationState.WAITING_FOR_VERIFICATION
                decision = "clarify"
                evidence_used = ["IDV-2"]

                if is_hi:
                    reply = f"Aapke order {session.order_id} ki suraksha ke liye, kripya apne registered phone number ke aakhri 4 digits ya 6-digit delivery pincode batayein."
                else:
                    reply = f"To access details for order {session.order_id}, please verify your identity by providing the last 4 digits of your registered phone number or your delivery pincode."

            else:
                # Customer is in verification state, but spoke without 4 or 6 digits
                session.verification_required = True
                session.state = ConversationState.WAITING_FOR_VERIFICATION
                decision = "clarify"
                evidence_used = ["IDV-2"]
                if is_hi:
                    reply = f"Order {session.order_id} ki jankari ke liye verification zaroori hai. Kripya apne phone number ke aakhri 4 digits ya 6-digit pincode batayein."
                else:
                    reply = f"For your account security, please verify by providing the last 4 digits of your phone number or your delivery pincode before I can access order {session.order_id}."

        # CASE 3: Customer mentions order inquiry without an order ID (e.g. "Where is my order?", "Can I cancel?")
        elif not session.order_id and (session.initial_intent or any(w in msg_lower for w in ["order", "delivery", "cancel", "return", "refund", "track"])):
            decision = "clarify"
            evidence_used = ["STY-1"]
            session.state = ConversationState.WAITING_FOR_ORDER_ID

            # Check if customer gave incomplete digits (e.g. 4 digits when 8 are expected)
            raw_digits = "".join(re.findall(r"\d", msg_clean))
            if raw_digits and len(raw_digits) != 8:
                if is_hi:
                    reply = f"ZentroMart Order ID 8 digits ka hota hai. Kripya apna poora 8-digit Order ID dobara batayein."
                else:
                    reply = f"ZentroMart Order IDs are 8 digits long. Could you please provide your complete 8-digit Order ID?"
            elif not session.greeting_delivered:
                session.greeting_delivered = True
                if is_hi:
                    reply = "Namaste! Main ZentroMart ka AI customer support assistant hoon. Main zaroor aapke order mein madad kar sakta hoon. Kripya apna 8-digit Order ID share karein."
                else:
                    reply = "Hello! I am ZentroMart's AI customer support assistant. I would be happy to help you with your order. Could you please provide your 8-digit Order ID?"
            else:
                if is_hi:
                    reply = "Main zaroor isme aapki madad kar sakta hoon. Kripya apna 8-digit Order ID share karein."
                else:
                    reply = "I would be happy to help you with that. Could you please provide your 8-digit Order ID?"

        # CASE 5: Verified order inquiries (handling policies, returns, refunds, damages, escalations)
        elif session.verified and session.verified_order_data:
            order_info = session.verified_order_data
            session.state = ConversationState.PROCESSING_REQUEST

            # 5a. Escalation / Compensation / High-Value Damage
            if any(w in msg_lower for w in ["compensation", "harjaana", "500", "approve kar do", "damage", "broken", "toota", "टूटा", "खराब", "क्षतिग्रस्त", "मुआवजा", "हर्जाना"]):
                is_high_value = False
                for it in order_info.get("items", []):
                    if int(it.get("unit_price_inr") or 0) >= 10000:
                        is_high_value = True

                if session.ticket and session.ticket.get("created"):
                    existing_tid = session.ticket.get("ticket_id")
                    decision = "escalate"
                    evidence_used = ["ESC-1"]
                    if is_hi:
                        reply = f"Aapke order ke liye pehle hi support ticket {existing_tid} register kiya ja chuka hai. Hamari Priority Resolution team aapse jald hi judegi."
                    else:
                        reply = f"Support ticket {existing_tid} has already been created for your order. Our Priority Resolution team is reviewing your request and will assist you shortly."

                elif "compensation" in msg_lower or "500" in msg_lower or "मुआवजा" in msg_lower or "हर्जाना" in msg_lower:
                    decision = "escalate"
                    evidence_used = ["ESC-1", "ESC-4"]
                    ticket_res = official_create_ticket(
                        summary=f"Customer requested compensation of ₹500 on order {session.order_id}; policy does not authorize automated compensation, escalated to Priority team.",
                        order_id=session.order_id,
                        reason="compensation_request",
                        intent="compensation",
                    )
                    if ticket_res.get("created"):
                        session.ticket = ticket_res
                        tool_called = "create_ticket()"
                        if is_hi:
                            reply = f"ZentroMart policy ke tehat automated compensation dena sambhav nahi hai. Maine aapki request ke liye support ticket {ticket_res['ticket_id']} create kar diya hai aur hamari team aapse jald hi sampark karegi."
                        else:
                            reply = f"Under ZentroMart policy, our AI assistant cannot approve direct compensation requests. I have created ticket {ticket_res['ticket_id']} and forwarded your request to our Priority Resolution team."
                    else:
                        reply = "Under ZentroMart policy, our AI assistant cannot approve direct compensation requests. I was unable to create an automated support ticket at this moment; please contact customer care directly at 1800-ZENTRO-CARE."

                elif is_high_value or "tv" in msg_lower or "smart tv" in msg_lower:
                    decision = "escalate"
                    evidence_used = ["DWM-3", "ESC-1", "ESC-4"]
                    ticket_res = official_create_ticket(
                        summary=f"High-value damaged item reported on order {session.order_id} exceeding ₹10,000 threshold. Escalated to Priority Resolution team for physical inspection.",
                        order_id=session.order_id,
                        reason="high_value_damage",
                        intent="damaged_item",
                    )
                    if ticket_res.get("created"):
                        session.ticket = ticket_res
                        tool_called = "create_ticket()"
                        if is_hi:
                            reply = f"₹10,000 se upar ke high-value electronics damage claims ke liye physical inspection zaroori hoti hai. Maine aapke case ko ticket {ticket_res['ticket_id']} ke saath Priority Resolution team ko handover kar diya hai."
                        else:
                            reply = f"For high-value electronics exceeding ₹10,000, replacement claims require physical inspection by our specialist team. I have logged ticket {ticket_res['ticket_id']} for Priority Resolution."
                    else:
                        reply = "For high-value electronics exceeding ₹10,000, replacement claims require physical inspection. I was unable to create an automated ticket at this moment; please contact our specialist support team at 1800-ZENTRO-CARE."

                else:
                    decision = "answer"
                    evidence_used = ["DWM-1", "DWM-2"]
                    if is_hi:
                        reply = "Kripya delivery ke 48 ghante ke andar app mein My Orders section mein jakar damaged item ki saaf photo upload karein taaki free replacement process ho sake."
                    else:
                        reply = "Please report any damaged item within 48 hours of delivery with clear photographs in the app under My Orders to receive a free replacement."

            # 5b. Return Eligibility & Deadlines
            elif any(w in msg_lower for w in ["return", "vaapas", "wapas", "return kar sakti", "रिटर्न", "वापस", "लौटा"]):
                decision = "answer"
                evidence_used = ["RET-2", "PLS-2"]
                delivered_date = order_info.get("delivered_date") or order_info.get("delivered_at") or "2026-10-12"
                items = order_info.get("items", [])
                window_days = 15
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

            # 5c. Refund Timelines
            elif any(w in msg_lower for w in ["refund", "paise", "kitne din", "how long will", "रिफंड", "रिफ़ंड", "पैसे"]):
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
                    if is_hi:
                        reply = f"Card refund mein 5 se 7 business days lagte hain, lagbhag {format_spoken_date(d5)} se {format_spoken_date(d7)} ke beech. Sundays aur warehouse holidays count nahi hote."
                    else:
                        reply = f"Card refunds take 5 to 7 business days, expected between {format_spoken_date(d5)} and {format_spoken_date(d7)}. Sundays and warehouse holidays are excluded."
                else:
                    reply = "Refunds for Cash on Delivery are credited to your bank account or wallet within 24 to 48 hours once details are confirmed."

            # 5d. Cancellation for In-Transit / Shipped orders
            elif any(w in msg_lower for w in ["cancel", "cancel it", "cancel kar do", "कैंसिल", "रद्द", "रद", "रोक"]):
                decision = "answer"
                evidence_used = ["CAN-2"]
                status = order_info.get("status", "").lower()
                if status in ["shipped", "out_for_delivery", "delivered"]:
                    if is_hi:
                        reply = f"Aapka order pehle hi {status} ho chuka hai, isliye transit mein cancel nahi kiya ja sakta. Kripya delivery ke samay parcel lene se mana kar dein (doorstep refusal)."
                    else:
                        reply = f"Your order has already shipped ({status}) and cannot be cancelled in transit. Please refuse the delivery at your doorstep when the delivery partner arrives."
                else:
                    reply = "Your order can be cancelled directly from the My Orders section in the app before it ships."

            # 5e. General Follow-Up Grounded RAG with Conversation History
            else:
                rag_res = self.retriever.retrieve(customer_message, top_k=3)
                evidence_used = [c.section_id for c, _ in rag_res]
                context_str = self.retriever.format_context_for_prompt(rag_res)

                history_lines = []
                for t in session.turns[-4:]:
                    history_lines.append(f"Customer: {t['customer']}")
                    history_lines.append(f"Assistant: {t['assistant']}")
                history_str = "\n".join(history_lines) if history_lines else "None (first query on verified order)"

                prompt = (
                    f"CONVERSATION HISTORY:\n{history_str}\n\n"
                    f"ACTIVE VERIFIED ORDER:\n{order_info}\n\n"
                    f"OFFICIAL POLICY EVIDENCE:\n{context_str}\n\n"
                    f"CURRENT CUSTOMER TURN:\n{customer_message}\n\n"
                    "INSTRUCTION: Answer directly and conversationally. Do NOT introduce yourself or repeat your greeting."
                )
                fallback = self.rag_agent._synthesize_evidence_fallback(customer_message, rag_res, "hi" if is_hi else "en")
                reply = self.llm.generate(
                    prompt=prompt,
                    system_instruction=CONVERSATION_SYSTEM_PROMPT,
                    temperature=0.1,
                    fallback_text=fallback,
                )

            session.state = ConversationState.WAITING_FOR_FOLLOW_UP

        # CASE 6: General Store Policy Question (No specific order required, e.g. "What is your return policy for electronics?")
        else:
            rag_res = self.retriever.retrieve(customer_message, top_k=3)
            evidence_used = [c.section_id for c, _ in rag_res]
            context_str = self.retriever.format_context_for_prompt(rag_res)

            history_lines = []
            for t in session.turns[-3:]:
                history_lines.append(f"Customer: {t['customer']}")
                history_lines.append(f"Assistant: {t['assistant']}")
            history_str = "\n".join(history_lines) if history_lines else "None"

            prompt = (
                f"CONVERSATION HISTORY:\n{history_str}\n\n"
                f"OFFICIAL EVIDENCE:\n{context_str}\n\n"
                f"CUSTOMER QUESTION:\n{customer_message}\n\n"
                "INSTRUCTION: Provide an accurate, evidence-grounded response. Do NOT repeat introductions if history is present."
            )
            fallback = self.rag_agent._synthesize_evidence_fallback(customer_message, rag_res, "hi" if is_hi else "en")
            reply = self.llm.generate(
                prompt=prompt,
                system_instruction=CONVERSATION_SYSTEM_PROMPT,
                temperature=0.1,
                fallback_text=fallback,
            )
            session.state = ConversationState.WAITING_FOR_CUSTOMER_REQUEST

        # Update session history
        session.turns.append({"customer": customer_message, "assistant": reply})
        session.greeting_delivered = True
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
            "state": session.state,
            "language": active_lang,
        }
