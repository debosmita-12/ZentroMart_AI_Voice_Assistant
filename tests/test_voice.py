"""Unit tests for Gnani voice integration and prevention of alternative fallbacks."""
import os
from unittest.mock import MagicMock, patch
from src.voice.gnani_service import GnaniVoiceService


def test_gnani_service_missing_api_key_honest_failure():
    # Test when API key is missing
    with patch.dict(os.environ, {"GNANI_API_KEY": ""}):
        service = GnaniVoiceService()
        res_stt = service.transcribe("non_existent.wav")
        assert not res_stt["success"]
        assert "GNANI_API_KEY" in res_stt["error"]
        assert res_stt["provider"] == "gnani", "Must only use gnani provider"

        res_tts = service.synthesize("Hello", "outputs/audio/test.wav")
        assert not res_tts["success"]
        assert "GNANI_API_KEY" in res_tts["error"]
        assert res_tts["provider"] == "gnani"


def test_gnani_service_mocked_transcribe():
    service = GnaniVoiceService()
    mock_stt = MagicMock()
    mock_stt.transcribe.return_value = {"transcript": "Where is my order?"}
    mock_tts = MagicMock()
    service._stt_client = mock_stt
    service._tts_client = mock_tts
    service.api_key = "dummy_key"

    with patch("pathlib.Path.exists", return_value=True):
        res = service.transcribe("dummy.wav", language_code="en-IN")
        assert res["success"] is True
        assert res["transcript"] == "Where is my order?"
        assert res["provider"] == "gnani"
