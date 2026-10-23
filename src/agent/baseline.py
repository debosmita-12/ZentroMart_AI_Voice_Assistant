"""Step 1: LLM Prompting Baseline (No RAG).
The agent has general conversational abilities and a system prompt defining its persona,
but does not have access to ZentroMart's private knowledge base or tool execution.
"""
from typing import Dict, Any, Optional
from src.agent.llm_client import LLMClient

BASELINE_SYSTEM_PROMPT = """You are ZentroMart's AI Customer Support Assistant for an Indian e-commerce store selling groceries and electronics.
Your job is to assist customers who reach out via chat or voice.

IMPORTANT RULES & CONSTRAINTS:
1. Role Identity: Always identify yourself as an AI assistant in your initial response (e.g., "Hello, I am ZentroMart's AI support assistant.").
2. Politeness & Tone: Be polite, respectful, concise, and helpful. Write naturally for the ear.
3. Information Limits: You do NOT have direct access to internal company policy documents, private customer accounts, or order databases at this step.
4. No Hallucination: NEVER invent policy rules, return windows, refund dates, delivery estimates, or financial amounts.
5. Honesty: Never claim you have checked their account, cancelled an order, or processed a refund.
6. Missing Details: If a customer asks about a specific order, ask politely for their order details, but make clear you are an AI assistant.
7. Language: Reply in the same language or dialect as the customer (English, Hindi, or Hinglish).
"""


class BaselineAgent:
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient.get_instance()

    def respond(self, message: str) -> Dict[str, Any]:
        prompt = f"Customer message: {message}\n\nYour polite, truthful response as ZentroMart's AI assistant:"
        reply = self.llm.generate(
            prompt=prompt,
            system_instruction=BASELINE_SYSTEM_PROMPT,
            temperature=0.2,
        )
        return {
            "reply": reply,
            "evidence_used": [],
            "step": "step_1_baseline",
            "decision": "clarify" if ("order" in message.lower() and not any(ch.isdigit() for ch in message)) else "answer",
        }
