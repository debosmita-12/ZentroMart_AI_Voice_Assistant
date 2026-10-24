"""LLM client wrapper for ZentroMart VoiceOps 2026.
Supports Google Gemini with in-memory caching and resilient evidence-based fallback.
"""
from typing import Optional, List, Dict, Any
import os
import hashlib
from dotenv import load_dotenv

load_dotenv()


class LLMClient:
    _instance = None
    _cache: Dict[str, str] = {}

    def __init__(self, model_name: Optional[str] = None):
        self.api_key = (
            os.environ.get("GOOGLE_API_KEY")
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("LLM_API_KEY")
        )
        self.model_name = (
            model_name
            or os.environ.get("LLM_MODEL")
            or "gemini-2.5-flash"
        )
        self._model = None
        self._init_client()

    @classmethod
    def get_instance(cls, model_name: Optional[str] = None) -> "LLMClient":
        if cls._instance is None:
            cls._instance = cls(model_name=model_name)
        return cls._instance

    def _init_client(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._model = genai.GenerativeModel(self.model_name)
            except Exception as e:
                print(f"[LLMClient] Failed to initialize Gemini model: {e}")
                self._model = None

    def _get_cache_key(self, prompt: str, system_instruction: Optional[str]) -> str:
        raw = f"{system_instruction or ''}___{prompt}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
        max_output_tokens: int = 500,
        fallback_text: Optional[str] = None,
    ) -> str:
        cache_key = self._get_cache_key(prompt, system_instruction)
        if cache_key in self._cache:
            return self._cache[cache_key]

        if not self._model:
            self._init_client()

        if self._model:
            try:
                full_prompt = prompt
                if system_instruction:
                    full_prompt = f"System Instructions:\n{system_instruction}\n\nUser Query:\n{prompt}"
                
                response = self._model.generate_content(
                    full_prompt,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_output_tokens,
                    },
                )
                if response and response.text:
                    out = response.text.strip()
                    self._cache[cache_key] = out
                    return out
            except Exception as e:
                # Log without spamming
                pass

        # If fallback text is provided (e.g. from RAG evidence synthesis)
        if fallback_text:
            return fallback_text

        return "I apologize, but I am unable to retrieve that information right now. Please repeat your question or let me know if you would like me to connect you with our support team."
