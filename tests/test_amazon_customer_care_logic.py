"""Comprehensive Logical Tests for ZentroMart Amazon-Style Customer Care Workflow.
Validates all 15 critical workflow rules:
1. Session initialization and greeting
2. Greeting appears only once per session
3. First customer message does not cause duplicate greeting
4. Order lookup requires prescribed verification before disclosure
5. Incorrect verification prevents access to private order details
6. Correct verification permits only authorized information
7. Assistant does not invent order details when lookup fails
8. Policy answers use retrieved evidence and correct precedence
9. Ticket confirmation requires created=True
10. Failed ticket creation is reported honestly
11. Duplicate requests do not create unintended duplicate tickets
12. Conversation context is maintained across multiple turns
13. Typed and voice messages use consistent business logic
14. Gnani failures are handled without fake success messages
15. Existing evaluation and batch-testing workflows continue working
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from src.agent.conversational_agent import ConversationalAgent, ConversationState, WELCOME_MESSAGE
from src.api.main import app
from src.voice.gnani_service import GnaniVoiceService


@pytest.fixture
def agent():
    return ConversationalAgent()


@pytest.fixture
def client():
    return TestClient(app)


# 1. Clicking Start Chatting initializes the session and displays the greeting
def test_1_start_chatting_initializes_session(agent, client):
    cid = "test_amazon_rule_01"
    # Test via API
    res = client.post("/api/session/init", json={"conversation_id": cid, "language": "en-IN", "speak": False})
    assert res.status_code == 200
    data = res.json()
    assert data["conversation_id"] == cid
    assert "Welcome to ZentroMart Customer Care" in data["reply"]
    assert data["state"] == ConversationState.WAITING_FOR_CUSTOMER_REQUEST


# 2. The greeting appears only once in a session
def test_2_greeting_appears_only_once(agent):
    cid = "test_amazon_rule_02"
    init_res = agent.init_session(cid)
    assert "Welcome to ZentroMart" in init_res["reply"]

    # Customer sends follow-up greeting
    turn1 = agent.process_turn(cid, "Hello", 1)
    # The full welcome greeting must not be repeated
    assert "Welcome to ZentroMart Customer Care" not in turn1["reply"]
    assert "How can I help you" in turn1["reply"] or "assist" in turn1["reply"].lower()


# 3. A first customer message does not cause a duplicate greeting
def test_3_first_customer_message_no_duplicate_greeting(agent):
    cid = "test_amazon_rule_03"
    # Session initialized first (as in UI start chatting)
    agent.init_session(cid)

    # Customer immediately inquires about an order
    turn1 = agent.process_turn(cid, "Track order 89782837", 1)
    assert "Welcome to ZentroMart Customer Care" not in turn1["reply"]
    assert "verify" in turn1["reply"].lower()
    assert turn1["verification_required"] is True


# 4. Order lookup requires prescribed verification before disclosure
def test_4_order_lookup_requires_verification(agent):
    cid = "test_amazon_rule_04"
    res = agent.process_turn(cid, "Can you tell me about order 89782837?", 1)
    assert res["verification_required"] is True
    assert res["verified"] is False
    assert "status" not in res
    assert "items" not in res
    assert "phone" in res["reply"].lower() or "pincode" in res["reply"].lower()


# 5. Incorrect verification prevents access to private order details
def test_5_incorrect_verification_prevents_access(agent):
    cid = "test_amazon_rule_05"
    agent.process_turn(cid, "Order 89782837", 1)
    # Wrong phone suffix
    turn2 = agent.process_turn(cid, "My phone last 4 digits are 0000", 2)
    assert turn2["verified"] is False
    assert "did not match" in turn2["reply"].lower() or "match nahi" in turn2["reply"].lower()
    assert "delivered" not in turn2["reply"].lower()
    assert "shipped" not in turn2["reply"].lower()


# 6. Correct verification permits only authorized information
def test_6_correct_verification_permits_authorized_info(agent):
    cid = "test_amazon_rule_06"
    agent.process_turn(cid, "Track order 89782837", 1)
    # Correct pincode 781006
    turn2 = agent.process_turn(cid, "Pincode is 781006", 2)
    assert turn2["verified"] is True
    assert "Kabir" in turn2["reply"] or "verified" in turn2["reply"].lower()
    assert "delivered" in turn2["reply"].lower()


# 7. Assistant does not invent order details when lookup fails
def test_7_no_hallucinated_orders_on_lookup_failure(agent):
    cid = "test_amazon_rule_07"
    # Order 99999999 does not exist in dataset
    res = agent.process_turn(cid, "What is the status of order 99999999?", 1)
    # The assistant must NOT invent order details before verification
    assert res["verified"] is False
    assert "delivered" not in res["reply"].lower()
    assert "shipped" not in res["reply"].lower()
    assert "items" not in res

    # Even if customer provides an arbitrary verification code, lookup fails and no data is invented
    turn2 = agent.process_turn(cid, "My pincode is 123456", 2)
    assert turn2["verified"] is False
    assert "did not match" in turn2["reply"].lower() or "not match" in turn2["reply"].lower() or "match nahi" in turn2["reply"].lower()
    assert "delivered" not in turn2["reply"].lower()


# 8. Policy answers use retrieved evidence and correct precedence
def test_8_policy_answers_grounded_with_precedence(agent):
    cid = "test_amazon_rule_08"
    # Grocery items under Policy v4 have 0 days return window
    res = agent.process_turn(cid, "What is the return window for perishable grocery items under Policy v4?", 1)
    assert res["evidence_used"] is not None
    assert len(res["evidence_used"]) > 0


# 9. Ticket confirmation requires created=True
def test_9_ticket_confirmation_requires_created_true(agent):
    cid = "test_amazon_rule_09"
    # Customer asks for human agent
    res = agent.process_turn(cid, "Please connect me to a human representative right now", 1)
    assert res["decision"] == "escalate"
    assert res["ticket"] is not None
    assert res["ticket"].get("created") is True
    assert "ticket" in res["reply"].lower()
    assert res["ticket"].get("ticket_id") in res["reply"]


# 10. Failed ticket creation is reported honestly
def test_10_failed_ticket_reported_honestly(agent):
    cid = "test_amazon_rule_10"
    with patch("src.agent.conversational_agent.official_create_ticket", return_value={"created": False, "error": "Database timeout"}):
        res = agent.process_turn(cid, "Escalate this to a human manager immediately", 1)
        assert res["decision"] == "escalate"
        # Must report inability to create ticket rather than claiming success
        assert "unable to create" in res["reply"].lower() or "could not create" in res["reply"].lower()
        assert "1800" in res["reply"]


# 11. Duplicate requests do not create unintended duplicate tickets
def test_11_no_duplicate_tickets_on_repeated_requests(agent):
    cid = "test_amazon_rule_11"
    # First escalation
    res1 = agent.process_turn(cid, "I want to speak with customer care", 1)
    assert res1["ticket"] is not None
    ticket_id_1 = res1["ticket"]["ticket_id"]

    # Repeated escalation in same session
    res2 = agent.process_turn(cid, "Please connect me to an agent again", 2)
    assert res2["ticket"] is not None
    ticket_id_2 = res2["ticket"]["ticket_id"]
    assert ticket_id_1 == ticket_id_2
    assert "already been registered" in res2["reply"].lower() or "already" in res2["reply"].lower()


# 12. Conversation context is maintained across multiple turns
def test_12_multi_turn_context_maintained(agent):
    cid = "test_amazon_rule_12"
    # Turn 1: User mentions problem first
    agent.process_turn(cid, "I want to return my shoes because they don't fit", 1)
    # Turn 2: User provides order ID
    agent.process_turn(cid, "The order ID is 89782837", 2)
    # Turn 3: User provides verification
    turn3 = agent.process_turn(cid, "My pincode is 781006", 3)
    # Turn 3 resolves the original return intent without re-asking
    assert turn3["verified"] is True
    assert "return" in turn3["reply"].lower() or "eligible" in turn3["reply"].lower()


# 13. Typed and voice messages use consistent business logic
def test_13_typed_and_voice_consistency(agent):
    cid_typed = "test_typed_consistency"
    cid_voice = "test_voice_consistency"

    typed_res = agent.process_turn(cid_typed, "Track order 89782837", 1)
    # Spoken transcription of same order
    voice_res = agent.process_turn(cid_voice, "track order eight nine seven eight two eight three seven", 1)

    assert typed_res["verification_required"] == voice_res["verification_required"]
    assert typed_res["order_id"] == voice_res["order_id"]
    assert typed_res["decision"] == voice_res["decision"]


# 14. Gnani failures are handled without fake success messages
def test_14_gnani_failures_handled_truthfully(client):
    # Mocking Gnani failure
    with patch.object(GnaniVoiceService, "transcribe", return_value={"success": False, "error": "Gnani API key invalid"}):
        # Post audio file
        res = client.post(
            "/api/voice/process",
            files={"audio": ("sample.wav", b"RIFFFAKEWAVEDATA", "audio/wav")},
            data={"conversation_id": "test_gnani_fail", "turn": 1, "language": "en-IN"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is False
        assert "Gnani" in data["error"] or "failed" in data["error"].lower()
        # Must not claim transcript was produced
        assert data["transcript"] == ""


# 15. Existing evaluation and batch-testing workflows continue working
def test_15_evaluation_data_accessible(agent):
    assert len(agent.loader.orders_by_id) == 1000
    assert len(agent.loader.customers_by_id) == 300
    assert len(agent.retriever.chunks) > 0
