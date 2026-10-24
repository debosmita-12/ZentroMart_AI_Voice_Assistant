"""Language policy for ZentroMart VoiceOps 2026.
Enforces explicit language selection and contextual language following across:
- Text input
- Gnani STT
- Conversational agent
- Verification prompts
- Policy answers & follow-up questions
- Gnani TTS
"""
from typing import Optional, Set
import re


class LanguagePolicy:
    SUPPORTED_LANGUAGES = {
        "en-IN": "English (India)",
        "hi-IN": "Hindi (हिंदी)",
        "hi-en": "Hinglish (Mixed)",
        "auto": "Auto Detect",
        "ta-IN": "Tamil (தமிழ்)",
        "te-IN": "Telugu (తెలుగు)",
        "kn-IN": "Kannada (ಕನ್ನಡ)",
        "bn-IN": "Bengali (বাংলা)",
        "gu-IN": "Gujarati (ગુજરાતી)",
        "mr-IN": "Marathi (मराठी)",
        "pa-IN": "Punjabi (ਪੰਜਾਬੀ)",
        "ml-IN": "Malayalam (മലയാളം)",
    }

    DEFAULT_LANGUAGE = "en-IN"

    # Distinct Hindi / Hinglish tokens (strictly life-cycle & grammatical words)
    # NOTE: Technical/business words like 'number', 'phone', 'pincode', 'order', 'id'
    # are purposefully EXCLUDED so they never misclassify pure English queries.
    HINDI_INDICATORS: Set[str] = {
        "hai", "hain", "kya", "mera", "meri", "mere", "mujhe", "haan", "nahin", "nahi",
        "karein", "kaise", "chahiye", "batao", "batayein", "dhanyawad", "namaste", "shukriya",
        "kahan", "kab", "karna", "aayega", "milega", "hoga", "vaapas", "wapas", "paise",
        "shunya", "ek", "do", "teen", "chaar", "char", "paanch", "panch", "chhah", "chhe",
        "saat", "aath", "nau", "kripya", "raha", "rahi", "gaya", "gayi", "bhi", "bahut",
        "aapse", "hamari", "apna", "apne", "apni", "lekin", "aur", "toh", "sirf", "kar",
        "sakta", "sakti", "hoon", "huan", "par", "se", "ko", "ki", "ke", "ka"
    }

    # Distinct English words to help confirm English when transcript is Roman script
    ENGLISH_INDICATORS: Set[str] = {
        "the", "is", "my", "of", "and", "to", "in", "for", "with", "can", "what", "where",
        "when", "how", "why", "who", "which", "please", "thank", "you", "order", "return",
        "cancel", "refund", "delivered", "shipping", "delivery", "item", "product", "last",
        "four", "digits", "phone", "number", "pincode", "code", "hello", "hi", "hey"
    }

    @classmethod
    def detect_language(cls, text: str) -> Optional[str]:
        """Detect language purely from text content."""
        if not text or not text.strip():
            return None

        clean = text.strip()

        # 1. Any Devanagari script characters (\u0900-\u097F) is unambiguously Hindi
        if any("\u0900" <= ch <= "\u097f" for ch in clean):
            return "hi-IN"

        # 2. Tokenize words in Roman script
        words = [w.lower() for w in re.findall(r"[a-zA-Z]+", clean)]
        if not words:
            # E.g. purely digits or punctuation like '4029' or '89782837'
            return None

        word_set = set(words)
        hindi_count = sum(1 for w in words if w in cls.HINDI_INDICATORS)
        english_count = sum(1 for w in words if w in cls.ENGLISH_INDICATORS)

        # Clear Hindi dominance
        if hindi_count > 0 and hindi_count >= english_count:
            return "hi-IN"

        # If English indicators exist or no Hindi indicators found, it's English
        if english_count > 0 or hindi_count == 0:
            return "en-IN"

        return "en-IN"

    @classmethod
    def resolve(
        cls,
        text: str,
        requested_language: Optional[str] = None,
        session_language: Optional[str] = None,
    ) -> str:
        """Resolve active language according to the single unified policy:
        1. If user explicitly selected a non-auto language (e.g. 'en-IN' or 'hi-IN'):
           Respect that manual selection until changed.
        2. If 'auto' or unspecified:
           Use customer's latest clearly identifiable message language.
           If ambiguous (e.g. only digits or no words), fall back to session_language or DEFAULT_LANGUAGE.
        """
        req = (requested_language or "").strip()

        # 1. Manual explicit selection has highest priority
        if req and req != "auto":
            if req.startswith("hi"):
                return "hi-IN"
            elif req.startswith("en"):
                return "en-IN"
            elif req in cls.SUPPORTED_LANGUAGES or req.endswith("-IN"):
                return req
            return cls.DEFAULT_LANGUAGE

        # 2. In 'auto' mode or if unspecified, detect from latest turn
        detected = cls.detect_language(text)
        if detected:
            return detected

        # 3. Ambiguous transcript (e.g. purely digits like '4029' or '89782837')
        if session_language and session_language != "auto":
            return session_language

        return cls.DEFAULT_LANGUAGE
