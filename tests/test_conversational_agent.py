"""Unit tests for multi-turn conversational agent, identity verification, and escalation."""
from src.agent.conversational_agent import ConversationalAgent


def test_first_turn_introduces_ai_assistant():
    agent = ConversationalAgent()
    res = agent.process_turn("test_conv_01", "Hello, I need help with my order.", 1)
    assert res["decision"] == "clarify"
    reply_lower = res["reply"].lower()
    assert "ai" in reply_lower or "artificial intelligence" in reply_lower


def test_caller_verification_gating():
    agent = ConversationalAgent()
    agent.process_turn("test_conv_02", "Hi there", 1)
    
    # Mention order ID
    turn2 = agent.process_turn("test_conv_02", "My order is 8978 2837", 2)
    assert turn2["verification_required"] is True
    assert turn2["verified"] is False
    # No order details should be present
    assert "status" not in turn2
    assert "items" not in turn2

    # Provide correct phone last 4 digits (4533 for order 89782837)
    turn3 = agent.process_turn("test_conv_02", "My phone last 4 digits are 4533", 3)
    assert turn3["verified"] is True
    assert "Kabir" in turn3["reply"] or "verified" in turn3["reply"].lower()


def test_escalation_and_ticket_creation():
    agent = ConversationalAgent()
    agent.process_turn("test_conv_03", "Order 89782837", 1)
    agent.process_turn("test_conv_03", "4533", 2)
    
    # Customer asks for direct compensation
    turn3 = agent.process_turn("test_conv_03", "I want 500 compensation right now.", 3)
    assert turn3["decision"] == "escalate"
    assert turn3["ticket"] is not None
    assert turn3["ticket"].get("created") is True
    assert turn3["ticket"].get("ticket_id", "").startswith("TKT")
