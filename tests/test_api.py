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


def test_cors_vercel_production_origin():
    """Verify that Vercel production and preview origins receive valid CORS headers."""
    # Test production Vercel origin
    res = client.options(
        "/api/health",
        headers={
            "Origin": "https://zentromart-ai-voice-assistant.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://zentromart-ai-voice-assistant.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_cors_vercel_preview_origin():
    """Verify that any Vercel preview branch deployment origin is accepted."""
    res = client.options(
        "/api/chat",
        headers={
            "Origin": "https://zentromart-preview-branch-debosmita.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://zentromart-preview-branch-debosmita.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_cors_local_dev_origin():
    """Verify that local development frontend (port 5173) is accepted."""
    res = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_cors_arbitrary_origin_rejected():
    """Verify that arbitrary third-party origins are not allowed by CORS."""
    res = client.options(
        "/api/health",
        headers={
            "Origin": "https://unauthorized-attacker.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.headers.get("access-control-allow-origin") != "https://unauthorized-attacker.example.com"

