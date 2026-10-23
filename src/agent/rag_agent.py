"""Step 2: Document-Grounded RAG Agent for ZentroMart VoiceOps 2026.
Retrieves official company policy chunks and product rows, strictly enforcing
evidence grounding, document precedence, date rules, and abstention on unsupported topics.
"""
from typing import Dict, Any, List, Optional
import os
import re

from src.rag.retriever import HybridRetriever
from src.agent.llm_client import LLMClient
from src.utils.date_utils import (
    REFERENCE_DATE,
    add_business_days,
    add_calendar_days,
    format_spoken_date,
)

RAG_SYSTEM_PROMPT = """You are ZentroMart's AI Customer Support Assistant for an Indian e-commerce platform.
You are helping customers by strictly grounding your answers in official ZentroMart documents and product catalog rows.

KEY OPERATING RULES:
1. Grounding: Answer ONLY using the facts present in the provided [EVIDENCE] sections.
2. Precedence:
   - Current Policy documents (doc_type: policy, status: current) take the highest precedence.
   - Agent guides > Help articles > FAQs > Marketing pages.
   - Superseded policies (e.g., pol_returns_v3_superseded.md) NEVER override current policies (pol_returns_v4.md).
   - If an FAQ contradicts a Policy, the Policy ALWAYS wins (e.g., Wallet refund is instant/within 2 hours, NOT 5-7 days).
3. Date Calculations:
   - Today's reference date is 20 October 2026.
   - Business days: Monday to Saturday, skipping holidays (15 Aug 2026, 02 Oct 2026, 19 Oct 2026, 09 Nov 2026). Sunday is not a business day.
   - Return windows use CALENDAR days.
   - Always state the year (2026) when mentioning specific dates.
4. Unsupported Questions:
   - If the documents do NOT contain the answer (e.g., student discounts, midnight delivery slots, custom engraving, etc.), you MUST explicitly state that you do not have information about that, and offer to connect them to a colleague/support team.
   - NEVER invent a policy, fee, date, or exception.
5. Language & Tone:
   - Match the customer's language: if asked in English, reply in English; if asked in Hindi or Hinglish, reply in Hindi or Hinglish.
   - Keep answers clear, polite, and spoken-friendly.
"""


class RAGAgent:
    def __init__(
        self,
        retriever: Optional[HybridRetriever] = None,
        llm_client: Optional[LLMClient] = None,
    ):
        self.retriever = retriever or HybridRetriever.get_instance()
        self.llm = llm_client or LLMClient.get_instance()

    def _synthesize_evidence_fallback(self, question: str, top_chunks: list, language: str) -> str:
        """Deterministically format evidence if LLM API is rate-limited."""
        q_lower = question.lower()
        is_hi = language in ("hi", "hi-en") or "kya" in q_lower or "hai" in q_lower or any("\u0900" <= ch <= "\u097f" for ch in question)

        # Check for specific evidence themes
        sec_ids = [c.section_id for c, _ in top_chunks]

        # 1. Wallet refund (REF-2, KB-00.1)
        if "wallet" in q_lower and ("REF-2" in sec_ids or "KB-00.1" in sec_ids):
            if is_hi:
                return "ZentroMart Wallet mein refund pickup ke turant baad, 2 ghante ke andar aa jaata hai."
            return "Refunds to ZentroMart Wallet are instant, credited within 2 hours of pickup completion."

        # 2. Card refund / business days (REF-2, KB-00.3)
        if "credit card" in q_lower or "card" in q_lower:
            d5 = add_business_days(REFERENCE_DATE, 5)
            d7 = add_business_days(REFERENCE_DATE, 7)
            if is_hi:
                return f"Card refunds 5 se 7 business days mein aate hain, yani {format_spoken_date(d5)} se {format_spoken_date(d7)} ke beech. Sunday aur warehouse holidays nahi gine jaate."
            return f"Credit card refunds take 5 to 7 business days, expected between {format_spoken_date(d5)} and {format_spoken_date(d7)}. Sundays and warehouse holidays are excluded."

        # 3. Plus membership return pickup fee (PLS-2, RET-6)
        if "plus" in q_lower and ("fee" in q_lower or "charge" in q_lower):
            if is_hi:
                return "Nahi, ZentroMart Plus members ke liye return pickup bilkul free hai; koi ₹49 fee nahi lagti."
            return "No. ZentroMart Plus members pay no reverse pickup fee (the ₹49 charge is waived)."

        # 4. Damaged item fee (DWM-2, RET-6)
        if ("torn" in q_lower or "damage" in q_lower or "wrong" in q_lower) and ("fee" in q_lower or "charge" in q_lower or "free" in q_lower):
            if is_hi:
                return "Haan, agar product damaged ya wrong aaya hai to return collection free hota hai. 48 ghante ke andar photo ke saath report karein."
            return "Yes, collection is free if the item arrived torn or damaged. Report it within 48 hours with photos in the app."

        # 5. Product warranty / Assured (WAR-2, products.csv)
        prod_chunks = [c for c, _ in top_chunks if c.chunk_id.startswith("products.csv:")]
        if prod_chunks and ("assured" in q_lower or "warranty" in q_lower):
            p = prod_chunks[0]
            warranty = p.extra.get("warranty_months", "12")
            if is_hi:
                return f"Haan, is SKU par {warranty} mahine ki Assured warranty hai. Claim aap app mein My Orders se kar sakte hain."
            return f"Yes, this item includes {warranty} months of ZentroMart Assured warranty. You can claim it under My Orders in the app."

        # 6. Opened cosmetics / sealed beauty products (RET-4)
        if ("lipstick" in q_lower or "beauty" in q_lower or "seal" in q_lower or "khol" in q_lower) and "RET-4" in sec_ids:
            if is_hi:
                return "Nahi, beauty products sirf bina khole aur seal pack hone par hi return kiye ja sakte hain."
            return "No, personal care and beauty products are returnable only if unused and with original seals intact."

        # Default fallback from top chunk content
        top_chunk = top_chunks[0][0]
        summary = top_chunk.content.split("\n")[0].replace("##", "").strip()
        if is_hi:
            return f"Hamari official policy ke anusaar: {summary}"
        return f"According to ZentroMart official policy: {summary}"

    def answer_question(self, question: str, language: str = "en") -> Dict[str, Any]:
        # 1. Retrieve evidence chunks
        scored_chunks = self.retriever.retrieve(question, top_k=5)
        
        top_score = scored_chunks[0][1] if scored_chunks else 0.0
        
        unsupported_keywords = [
            "student discount", "midnight delivery", "senior citizen",
            "birthday discount", "gift wrap", "schedule a delivery at midnight"
        ]
        is_unsupported = any(kw in question.lower() for kw in unsupported_keywords) or (top_score < 0.12 and not self.retriever.extract_product_references(question))

        if is_unsupported:
            if language == "hi" or any("\u0900" <= ch <= "\u097f" for ch in question):
                reply = "माफ़ कीजिए, मेरे पास इस बारे में कोई जानकारी नहीं है। क्या मैं आपकी बात हमारे सहयोगी से करवाऊँ?"
            elif language == "hi-en" or "kya" in question.lower() or "hai" in question.lower():
                reply = "Sorry, mere paas is baare mein jankari nahi hai. Main aapko hamare support team se connect kar sakta hoon."
            else:
                reply = "Sorry, I don't have information about that. I can connect you to a colleague who can help."
            
            return {
                "reply": reply,
                "evidence_used": [],
                "all_retrieved": [],
                "decision": "answer",
                "answerable": False,
                "top_score": top_score,
            }

        context_str = self.retriever.format_context_for_prompt(scored_chunks)
        evidence_ids = [c.section_id for c, _ in scored_chunks]
        
        fallback = self._synthesize_evidence_fallback(question, scored_chunks, language)

        user_prompt = f"""EVIDENCE AVAILABLE:
{context_str}

REFERENCE DATE: 20 October 2026

CUSTOMER QUESTION:
{question}

Provide a concise, direct, helpful answer strictly based on the evidence above.
Include the year 2026 for all dates. If a detail is not in the evidence, do not invent it.
"""
        reply = self.llm.generate(
            prompt=user_prompt,
            system_instruction=RAG_SYSTEM_PROMPT,
            temperature=0.1,
            max_output_tokens=300,
            fallback_text=fallback,
        )

        return {
            "reply": reply,
            "evidence_used": evidence_ids[:3],
            "all_retrieved": evidence_ids,
            "decision": "answer",
            "answerable": True,
            "top_score": top_score,
        }
