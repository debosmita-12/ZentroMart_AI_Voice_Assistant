"""Comprehensive regression test suite for Priority 2:
Multi-turn Voice Conversation & Order-ID flow.

Verifies:
1. Greeting is generated only once per conversation.
2. Spoken 8-digit order ID (words, spaces, hyphens) is recognized as a customer turn.
3. Conversation ID remains unchanged across consecutive turns.
4. Failed STT does not reset the session.
5. Empty transcription triggers a retry prompt rather than repeating the greeting.
6. Incomplete/invalid ID triggers a clarification question.
7. Leading zeros in an order ID are preserved.
8. Agent invokes the correct lookup_order tool.
9. Caller verification is strictly enforced before disclosing order details.
10. Verification responses are processed as subsequent turns.
11. Follow-up questions preserve the active order context.
12. TTS receives the actual agent response.
13. Repeated event handlers / duplicate turns are handled cleanly.
14. A new conversation receives a fresh introduction.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from src.api.main import app, conv_agent, voice_service
from src.agent.conversational_agent import ConversationalAgent, ConversationState


@pytest.fixture
def client():
    return TestClient(app)


def test_01_greeting_generated_only_once():
    agent = ConversationalAgent()
    cid = "test_greeting_once"
    
    # Turn 1: Customer says hi
    turn1 = agent.process_turn(cid, "Hello there!", 1)
    assert "ai customer support assistant" in turn1["reply"].lower()
    
    # Turn 2: Customer asks a question
    turn2 = agent.process_turn(cid, "I have a question about delivery.", 2)
    # The greeting and self-introduction MUST NOT be repeated
    assert "i am zentromart's ai" not in turn2["reply"].lower()
    assert "hello! i am" not in turn2["reply"].lower()


def test_02_spoken_words_order_id_recognized():
    agent = ConversationalAgent()
    cid = "test_spoken_words_id"
    
    # Customer speaks order ID in words
    res = agent.process_turn(cid, "my order id is eight nine seven eight two eight three seven", 1)
    assert res["order_id"] == "89782837"
    assert res["verification_required"] is True
    assert res["verified"] is False
    assert "verify" in res["reply"].lower() or "suraksha" in res["reply"].lower()


def test_03_conversation_id_persists_across_turns(client):
    cid = "conv_persist_123"
    
    # Turn 1 via API
    r1 = client.post("/api/chat", json={"conversation_id": cid, "message": "Hi", "turn": 1})
    assert r1.status_code == 200
    assert r1.json()["conversation_id"] == cid
    
    # Turn 2 via API
    r2 = client.post("/api/chat", json={"conversation_id": cid, "message": "Order 89782837", "turn": 2})
    assert r2.status_code == 200
    assert r2.json()["conversation_id"] == cid
    assert r2.json()["order_id"] == "89782837"


def test_04_failed_stt_does_not_reset_session():
    cid = "test_stt_fail_session"
    session = conv_agent.get_or_create_session(cid)
    session.order_id = "89782837"
    session.turns.append({"customer": "Order 89782837", "assistant": "Please verify."})
    
    # Mock voice service transcribe failure
    with patch.object(voice_service, "transcribe", return_value={"success": False, "error": "STT timeout"}):
        with patch.object(voice_service, "is_configured", return_value=True):
            with patch("builtins.open", MagicMock()):
                client = TestClient(app)
                res = client.post(
                    "/api/voice/process",
                    data={"conversation_id": cid, "turn": 2, "language": "en-IN"},
                    files={"audio": ("test.wav", b"RIFFdummydata", "audio/wav")}
                )
                assert res.status_code == 200
                data = res.json()
                assert data["success"] is False
                assert data["can_retry"] is True
                
                # Check session state was NOT wiped
                assert conv_agent.get_or_create_session(cid).order_id == "89782837"


def test_05_empty_transcription_triggers_retry_prompt_not_greeting(client):
    cid = "test_empty_transcription"
    
    with patch.object(voice_service, "transcribe", return_value={"success": True, "transcript": ""}):
        with patch.object(voice_service, "synthesize", return_value={"success": True}):
            res = client.post(
                "/api/voice/process",
                data={"conversation_id": cid, "turn": 1, "language": "en-IN"},
                files={"audio": ("test.wav", b"RIFFdummydata", "audio/wav")}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            # Should ask to repeat, NOT dump introductory boilerplate
            assert "didn't catch that" in data["reply"].lower() or "repeat" in data["reply"].lower()
            assert "hello! i am zentromart's ai customer support" not in data["reply"].lower()


def test_06_incomplete_id_triggers_clarification():
    agent = ConversationalAgent()
    cid = "test_incomplete_id"
    
    # Customer provides only 4 digits for order ID
    res = agent.process_turn(cid, "my order is 8978", 1)
    assert res["decision"] == "clarify"
    assert "8 digits" in res["reply"] or "8-digit" in res["reply"]


def test_07_leading_zeros_preserved():
    agent = ConversationalAgent()
    cid = "test_leading_zeros"
    
    # Order ID with leading zero
    res = agent.process_turn(cid, "order zero one two three four five six seven", 1)
    assert res["order_id"] == "01234567"
    assert isinstance(res["order_id"], str)
    assert res["order_id"].startswith("0")


def test_08_and_09_tool_lookup_and_verification_enforcement():
    agent = ConversationalAgent()
    cid = "test_idv_enforcement"
    
    # Turn 1: Customer gives order ID
    turn1 = agent.process_turn(cid, "Can I return order 89782837?", 1)
    assert turn1["verification_required"] is True
    assert turn1["verified"] is False
    assert "lookup_order(order_id=89782837)" in turn1["tool_call"]
    # No sensitive order details disclosed yet
    assert "status" not in turn1
    assert "Kabir" not in turn1["reply"]

    # Turn 2: Customer provides wrong verification value
    turn2 = agent.process_turn(cid, "phone is 9999", 2)
    assert turn2["verified"] is False
    assert "did not match" in turn2["reply"].lower()

    # Turn 3: Customer provides correct verification (phone last 4 digits for order 89782837 is 4533)
    turn3 = agent.process_turn(cid, "sorry phone is 4533", 3)
    assert turn3["verified"] is True
    assert "Kabir" in turn3["reply"] or "verified" in turn3["reply"].lower()


def test_10_and_11_follow_up_preserves_order_context():
    agent = ConversationalAgent()
    cid = "test_followup_context"
    
    # Step 1 & 2: Set up and verify order
    agent.process_turn(cid, "Order 89782837", 1)
    agent.process_turn(cid, "4533", 2)
    
    # Turn 3: Follow-up query ("Can I cancel it?")
    turn3 = agent.process_turn(cid, "Can I cancel it now?", 3)
    assert turn3["verified"] is True
    # Order 89782837 has status 'shipped', so doorstep refusal rule applies
    assert "doorstep" in turn3["reply"].lower() or "shipped" in turn3["reply"].lower()
    # It must NOT ask for the order ID or verification again
    assert "order id" not in turn3["reply"].lower()
    assert "pincode" not in turn3["reply"].lower()


def test_12_tts_receives_actual_agent_response():
    client = TestClient(app)
    cid = "test_tts_response"
    
    mock_synth = MagicMock(return_value={"success": True})
    with patch.object(voice_service, "transcribe", return_value={"success": True, "transcript": "What is the return window for footwear?"}):
        with patch.object(voice_service, "synthesize", mock_synth):
            res = client.post(
                "/api/voice/process",
                data={"conversation_id": cid, "turn": 1, "language": "en-IN"},
                files={"audio": ("query.wav", b"RIFFsampleaudio", "audio/wav")}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            # Verify synthesize was called with the actual reply
            mock_synth.assert_called_once()
            called_text = mock_synth.call_args[0][0]
            assert called_text == data["reply"]


def test_13_repeated_identical_turns_do_not_crash():
    agent = ConversationalAgent()
    cid = "test_duplicate_events"
    
    # Simulate accidental double-submission of same message
    res1 = agent.process_turn(cid, "Order 89782837", 1)
    res2 = agent.process_turn(cid, "Order 89782837", 2)
    assert res1["order_id"] == "89782837"
    assert res2["order_id"] == "89782837"
    assert res2["verification_required"] is True


def test_14_new_conversation_gets_fresh_session():
    agent = ConversationalAgent()
    
    # Conv A
    agent.process_turn("conv_A", "Order 89782837", 1)
    agent.process_turn("conv_A", "4533", 2)
    assert agent.get_or_create_session("conv_A").verified is True
    
    # Conv B (completely fresh)
    turn_b = agent.process_turn("conv_B", "Hello", 1)
    session_b = agent.get_or_create_session("conv_B")
    assert session_b.verified is False
    assert session_b.order_id is None
    assert "ai customer support assistant" in turn_b["reply"].lower()


def test_scenario_a_full_hindi_voice_conversation_flow():
    agent = ConversationalAgent()
    cid = "test_scenario_a"

    # Turn 1: Greeting in Hindi
    r1 = agent.process_turn(cid, "नमस्ते", 1)
    assert r1["state"] == ConversationState.WAITING_FOR_CUSTOMER_REQUEST
    assert "namaste" in r1["reply"].lower() or "नमस्ते" in r1["reply"]

    # Turn 2: Customer provides Hindi Order ID
    r2 = agent.process_turn(cid, "मेरा ऑर्डर 89782837 है", 2)
    assert r2["order_id"] == "89782837"
    assert r2["verification_required"] is True
    assert r2["verified"] is False
    assert "suraksha" in r2["reply"].lower() or "pincode" in r2["reply"].lower()
    # No generic introduction repeated
    assert "main zentromart ka ai customer support assistant hoon" not in r2["reply"].lower()

    # Turn 3: Customer provides Hindi verification (phone suffix)
    r3 = agent.process_turn(cid, "मेरा फोन नंबर 4533 है", 3)
    assert r3["verified"] is True
    assert "Kabir" in r3["reply"]
    assert "safal" in r3["reply"]
    # No generic introduction
    assert "how can i assist you with your order today" not in r3["reply"].lower()


def test_scenario_b_full_english_voice_conversation_flow():
    agent = ConversationalAgent()
    cid = "test_scenario_b"

    # Turn 1: Greeting
    r1 = agent.process_turn(cid, "Hello", 1)
    assert "ai customer support assistant" in r1["reply"].lower()

    # Turn 2: Order ID
    r2 = agent.process_turn(cid, "My order ID is 89782837", 2)
    assert r2["order_id"] == "89782837"
    assert r2["verification_required"] is True
    assert "hello! i am" not in r2["reply"].lower()

    # Turn 3: Verification
    r3 = agent.process_turn(cid, "last 4 digits are 4533", 3)
    assert r3["verified"] is True
    assert "Kabir" in r3["reply"]
    assert "how can i assist you with your order today" not in r3["reply"].lower()


def test_scenario_c_spoken_hindi_number_words():
    agent = ConversationalAgent()
    cid = "test_scenario_c"

    # Order ID in spoken Hindi words
    r1 = agent.process_turn(cid, "mera order number aath nau saat aath do aath teen saat hai", 1)
    assert r1["order_id"] == "89782837"
    assert r1["verification_required"] is True

    # Verification in spoken Hindi words
    r2 = agent.process_turn(cid, "phone number chaar paanch teen teen hai", 2)
    assert r2["verified"] is True
    assert "Kabir" in r2["reply"]


def test_scenario_d_devanagari_script_numbers():
    agent = ConversationalAgent()
    cid = "test_scenario_d"

    # Order ID with Devanagari numerals
    r1 = agent.process_turn(cid, "मेरा ऑर्डर आईडी ८९७८२८३७ है", 1)
    assert r1["order_id"] == "89782837"
    assert r1["verification_required"] is True

    # Verification with Devanagari numerals
    r2 = agent.process_turn(cid, "मेरा फोन ४५३३ है", 2)
    assert r2["verified"] is True
    assert "Kabir" in r2["reply"]


def test_scenario_e_phone_number_suffix_verification():
    agent = ConversationalAgent()
    cid = "test_scenario_e"

    agent.process_turn(cid, "Order 89782837", 1)
    r2 = agent.process_turn(cid, "4533", 2)
    assert r2["verified"] is True
    assert "Kabir" in r2["reply"]


def test_scenario_f_pincode_verification():
    agent = ConversationalAgent()
    cid = "test_scenario_f"

    agent.process_turn(cid, "Order 89782837", 1)
    # Order 89782837 delivery pincode is 781006
    r2 = agent.process_turn(cid, "pincode is 781006", 2)
    assert r2["verified"] is True
    assert "Kabir" in r2["reply"]


def test_scenario_g_failed_verification_retry_in_hindi():
    agent = ConversationalAgent()
    cid = "test_scenario_g"

    agent.process_turn(cid, "मेरा ऑर्डर 89782837 है", 1)
    # Wrong verification
    r2 = agent.process_turn(cid, "मेरा फोन 9999 है", 2)
    assert r2["verified"] is False
    assert r2["state"] == ConversationState.WAITING_FOR_VERIFICATION
    assert "match nahi hui" in r2["reply"]
    # Must NOT produce the generic English intro
    assert "how can i assist you with your order today" not in r2["reply"].lower()


def test_scenario_h_escalation_after_two_failed_attempts():
    agent = ConversationalAgent()
    cid = "test_scenario_h"

    agent.process_turn(cid, "Order 89782837", 1)
    # Attempt 1 fail
    r2 = agent.process_turn(cid, "phone 0000", 2)
    assert r2["decision"] == "clarify"
    assert r2["verified"] is False

    # Attempt 2 fail
    r3 = agent.process_turn(cid, "phone 1111", 3)
    assert r3["decision"] == "escalate"
    assert r3["ticket"] is not None
    assert r3["ticket"]["ticket_id"].startswith("TKT")
    assert r3["state"] == ConversationState.ERROR_RECOVERY
    assert "ticket" in r3["reply"].lower()
    # Must NOT produce the generic intro
    assert "how can i assist you with your order today" not in r3["reply"].lower()


def test_scenario_i_followup_question_on_verified_order_in_hindi():
    agent = ConversationalAgent()
    cid = "test_scenario_i"

    agent.process_turn(cid, "मेरा ऑर्डर 89782837 है", 1)
    agent.process_turn(cid, "4533", 2)

    # Follow-up in Hindi about cancellation
    r3 = agent.process_turn(cid, "क्या मैं इसे कैंसिल कर सकता हूँ?", 3)
    assert r3["verified"] is True
    assert "transit" in r3["reply"].lower() or "doorstep" in r3["reply"].lower() or "shipped" in r3["reply"].lower()
    # Must NOT repeat order ID prompt or greeting
    assert "order id share" not in r3["reply"].lower()
    assert "how can i assist you with your order today" not in r3["reply"].lower()


def test_scenario_j_conversation_id_persistence_across_voice_turns(client):
    cid = "test_scenario_j_persistence"

    with patch.object(voice_service, "transcribe", side_effect=[
        {"success": True, "transcript": "My order is 89782837"},
        {"success": True, "transcript": "My phone is 4533"},
        {"success": True, "transcript": "When was it delivered?"},
    ]):
        with patch.object(voice_service, "synthesize", return_value={"success": True}):
            # Turn 1
            r1 = client.post(
                "/api/voice/process",
                data={"conversation_id": cid, "turn": 1, "language": "en-IN"},
                files={"audio": ("audio1.wav", b"RIFFdata1", "audio/wav")}
            )
            assert r1.status_code == 200
            d1 = r1.json()
            assert d1["conversation_id"] == cid
            assert d1["order_id"] == "89782837"
            assert d1["verified"] is False

            # Turn 2
            r2 = client.post(
                "/api/voice/process",
                data={"conversation_id": cid, "turn": 2, "language": "en-IN"},
                files={"audio": ("audio2.wav", b"RIFFdata2", "audio/wav")}
            )
            assert r2.status_code == 200
            d2 = r2.json()
            assert d2["conversation_id"] == cid
            assert d2["verified"] is True

            # Turn 3
            r3 = client.post(
                "/api/voice/process",
                data={"conversation_id": cid, "turn": 3, "language": "en-IN"},
                files={"audio": ("audio3.wav", b"RIFFdata3", "audio/wav")}
            )
            assert r3.status_code == 200
            d3 = r3.json()
            assert d3["conversation_id"] == cid
            assert d3["verified"] is True
            # Does not repeat intro
            assert "how can i assist you with your order today" not in d3["reply"].lower()


# =====================================================================
# PRIORITY 1 & 3 REGRESSION TESTS:
# Language Consistency Policy + Verification Gating + Leading Zeros
# =====================================================================

def test_language_policy_english_utterance_stays_in_english():
    """Verify that an English utterance during verification responds in English, not Hindi."""
    agent = ConversationalAgent()
    cid = "test_lang_en_verify"

    # Turn 1: Customer asks about order in English
    r1 = agent.process_turn(cid, "Hi, I want to check my order 89782837", 1, language="auto")
    assert r1["language"].startswith("en")
    assert "verify" in r1["reply"].lower() or "verification" in r1["reply"].lower()
    assert "नमस्ते" not in r1["reply"]

    # Turn 2: Customer provides phone number in English with words:
    # "the last four digits of my phone number is four zero two nine"
    r2 = agent.process_turn(
        cid,
        "the last four digits of my phone number is four zero two nine",
        2,
        language="auto"
    )
    # MUST resolve to English and MUST NOT produce Hindi text
    assert r2["language"].startswith("en")
    assert "नमस्ते" not in r2["reply"]
    assert "सत्यापन" not in r2["reply"]
    # 4029 does not match 89782837 (actual suffix is 4533), so verification fails politely in English
    assert r2["verified"] is False
    assert "verification" in r2["reply"].lower() or "could not verify" in r2["reply"].lower() or "digits" in r2["reply"].lower()


def test_language_policy_hindi_utterance_stays_in_hindi():
    """Verify that a Hindi utterance responds in Hindi."""
    agent = ConversationalAgent()
    cid = "test_lang_hi_flow"

    # Turn 1: Customer asks about order in Hindi
    r1 = agent.process_turn(cid, "मेरा ऑर्डर नंबर 89782837 है", 1, language="auto")
    assert r1["language"].startswith("hi")
    assert "suraksha" in r1["reply"].lower() or "aakhri" in r1["reply"].lower() or "digits" in r1["reply"].lower()

    # Turn 2: Customer provides correct suffix in Hindi
    r2 = agent.process_turn(cid, "मेरे फोन के आखिरी अंक 4533 हैं", 2, language="auto")
    assert r2["language"].startswith("hi")
    assert r2["verified"] is True
    assert "kabir mehta" in r2["reply"].lower() or "mehta" in r2["reply"].lower() or "89782837" in r2["reply"]


def test_explicit_language_override_locks_language():
    """Verify that explicit language selection overrides auto-detection."""
    agent = ConversationalAgent()
    cid = "test_lang_explicit_override"

    # Customer speaks Hindi words, but explicit language is locked to en-IN
    r1 = agent.process_turn(cid, "नमस्ते मेरा ऑर्डर 89782837 है", 1, language="en-IN")
    assert r1["language"].startswith("en")
    assert "verify" in r1["reply"].lower()

    # Customer speaks English, but explicit language is locked to hi-IN
    r2 = agent.process_turn(cid, "my phone number is 4533", 2, language="hi-IN")
    assert r2["language"].startswith("hi")
    assert r2["verified"] is True


def test_leading_zero_phone_verification_success():
    """Verify that leading zeros in customer phone suffix (e.g. 0101) are preserved and verified."""
    agent = ConversationalAgent()
    cid = "test_leading_zero_0101"

    # Order 69520867 belongs to Naveen Gowda, phone +91 59596 10101 (last 4: 0101)
    r1 = agent.process_turn(cid, "Order 69520867", 1, language="en")
    assert r1["order_id"] == "69520867"
    assert r1["verification_required"] is True

    # Customer speaks with leading zero in words: "zero one zero one"
    r2 = agent.process_turn(cid, "phone suffix zero one zero one", 2, language="en")
    assert r2["verified"] is True
    assert "naveen gowda" in r2["reply"].lower() or "delivered" in r2["reply"].lower() or "69520867" in r2["reply"]


def test_leading_zero_phone_verification_second_example():
    """Verify another leading zero case: Order 54239550 (Nandini Kulkarni, phone suffix 0986)."""
    agent = ConversationalAgent()
    cid = "test_leading_zero_0986"

    # Order 54239550 belongs to Nandini Kulkarni, phone +91 51658 50986 (last 4: 0986)
    r1 = agent.process_turn(cid, "I want to track order 54239550", 1, language="en")
    assert r1["order_id"] == "54239550"

    # Customer provides digits directly with leading zero "0986"
    r2 = agent.process_turn(cid, "my phone is 0986", 2, language="en")
    assert r2["verified"] is True
    assert "nandini" in r2["reply"].lower() or "54239550" in r2["reply"]


def test_api_chat_auto_language_and_verification(client):
    """Verify /api/chat handles auto language and verification end-to-end."""
    cid = "api_test_auto_lang"

    # Turn 1: English
    r1 = client.post("/api/chat", json={
        "conversation_id": cid,
        "message": "Where is my order 89782837?",
        "turn": 1,
        "language": "auto"
    })
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["language"].startswith("en")
    assert d1["verification_required"] is True

    # Turn 2: English verification with words
    r2 = client.post("/api/chat", json={
        "conversation_id": cid,
        "message": "the last four digits of my phone number is four five three three",
        "turn": 2,
        "language": "auto"
    })
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["language"].startswith("en")
    assert d2["verified"] is True
    assert "89782837" in d2["reply"]


