"""Step 4: Gnani Speech Service for ZentroMart VoiceOps 2026.
Integrates Gnani STT and TTS using the official gnani-vachana Python SDK.
STRICT RULE: Only Gnani API is permitted. No third-party STT/TTS fallbacks are used.
"""
from typing import Dict, Any, Optional, Union
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class GnaniVoiceService:
    _instance = None

    def __init__(self):
        self.api_key = os.environ.get("GNANI_API_KEY")
        self._stt_client = None
        self._tts_client = None
        self._init_clients()

    @classmethod
    def get_instance(cls) -> "GnaniVoiceService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _init_clients(self):
        if self.api_key:
            try:
                from gnani.stt import GnaniSTTClient
                from gnani.tts import GnaniTTSClient
                self._stt_client = GnaniSTTClient()
                self._tts_client = GnaniTTSClient()
            except Exception as e:
                print(f"[GnaniVoiceService] Failed to initialize Gnani SDK clients: {e}")
                self._stt_client = None
                self._tts_client = None

    def is_configured(self) -> bool:
        return bool(self.api_key and self._stt_client and self._tts_client)

    def transcribe(
        self,
        audio_path: Union[str, Path],
        language_code: str = "en-IN",
    ) -> Dict[str, Any]:
        """Transcribe an audio clip using Gnani STT.
        
        STRICT COMPLIANCE: No other STT provider is allowed.
        """
        if not self.is_configured():
            self._init_clients()
            if not self.is_configured():
                return {
                    "success": False,
                    "transcript": "",
                    "error": "GNANI_API_KEY is not set. Please set GNANI_API_KEY to use Gnani STT.",
                    "provider": "gnani",
                }

        path_obj = Path(audio_path)
        if not path_obj.exists():
            return {
                "success": False,
                "transcript": "",
                "error": f"Audio file not found at {audio_path}",
                "provider": "gnani",
            }

        try:
            res = self._stt_client.transcribe(str(path_obj), language_code=language_code)
            transcript = res.get("transcript", "")
            return {
                "success": True,
                "transcript": transcript,
                "raw_response": res,
                "provider": "gnani",
            }
        except Exception as e:
            return {
                "success": False,
                "transcript": "",
                "error": f"Gnani STT error: {str(e)}",
                "provider": "gnani",
            }

    def synthesize(
        self,
        text: str,
        output_file: Union[str, Path],
        voice: str = "Kaveri",
        model: str = "timbre-v2.5",
        language: str = "en-IN",
    ) -> Dict[str, Any]:
        """Synthesize text into speech using Gnani TTS.
        
        STRICT COMPLIANCE: Only Gnani TTS is used. No third-party TTS fallbacks.
        """
        if not self.is_configured():
            self._init_clients()
            if not self.is_configured():
                return {
                    "success": False,
                    "output_file": None,
                    "error": "GNANI_API_KEY is not set. Please set GNANI_API_KEY to use Gnani TTS.",
                    "provider": "gnani",
                }

        if not text or not text.strip():
            return {
                "success": False,
                "output_file": None,
                "error": "Cannot synthesize empty text",
                "provider": "gnani",
            }

        out_path = Path(output_file)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # Clean text for ear (remove markdown brackets or section tags if any)
            import re
            cleaned_text = re.sub(r"\[[A-Z0-9\.\-]+\]", "", text).strip()
            
            audio_bytes = self._tts_client.synthesize(
                cleaned_text,
                voice=voice,
                model=model,
                language=language,
                output_file=str(out_path),
            )

            # Ensure file is written
            if not out_path.exists() and audio_bytes:
                with open(out_path, "wb") as f:
                    f.write(audio_bytes)

            return {
                "success": True,
                "output_file": str(out_path),
                "bytes_written": len(audio_bytes) if audio_bytes else out_path.stat().st_size,
                "provider": "gnani",
            }
        except Exception as e:
            return {
                "success": False,
                "output_file": None,
                "error": f"Gnani TTS error: {str(e)}",
                "provider": "gnani",
            }
