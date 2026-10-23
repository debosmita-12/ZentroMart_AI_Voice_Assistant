"""Integration tests for FastAPI endpoints."""
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["company"] == "ZentroMart"
    assert data["reference_date"] == "2026-10-20"
    assert data["dataset_counts"]["orders"] == 1000


def test_chat_endpoint_first_turn():
    res = client.post("/api/chat", json={"message": "Hello, I want to check my order", "turn": 1})
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "conversation_id" in data
    assert "ai" in data["reply"].lower() or "artificial intelligence" in data["reply"].lower()


def test_kb_search_endpoint():
    res = client.get("/api/kb/search?q=wallet refund")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    sec_ids = [item["section_id"] for item in data]
    assert "REF-2" in sec_ids
