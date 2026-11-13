import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "ChatSphare" in data["service"]


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_captcha_generation():
    response = client.get("/api/auth/captcha")
    assert response.status_code == 200
    data = response.json()
    assert "<svg" in data["svg"]
    assert "token" in data


def test_auth_me_guest():
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert "authenticated" in data


def test_agent_available_models():
    response = client.get("/api/agent/available-models")
    assert response.status_code == 200
    data = response.json()
    assert len(data["models"]) > 0


def test_agent_list():
    response = client.get("/api/agent/list")
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data


def test_crawl_endpoint():
    response = client.post("/api/crawl", json={"url": "https://chatsphare.ai"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_pages_crawled"] > 0
    assert len(data["pages"]) > 0


def test_brand_generate_summary():
    response = client.post("/api/brand/generate-summary", json={"website_url": "https://chatsphare.ai"})
    assert response.status_code == 200
    data = response.json()
    assert "brand_name" in data
    assert "summary" in data


def test_knowledge_bases():
    response = client.get("/api/knowledge/bases")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_playground_chat():
    response = client.post("/api/playground/chat", json={
        "agent_id": "default-agent-1",
        "message": "Hello from automated test!"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "assistant"
    assert len(data["message"]) > 0


def test_public_bot_config():
    response = client.get("/api/v1/bot/default-agent-1/config")
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == "default-agent-1"


def test_widget_embed_static():
    response = client.get("/widget-embed.js")
    assert response.status_code == 200
    assert "ChatSphare" in response.text or "chatsphare" in response.text


def test_fullscreen_widget_static():
    response = client.get("/fullscreen-widget/default-agent-1")
    assert response.status_code == 200
    assert "<!DOCTYPE html>" in response.text or "<html" in response.text


def test_publish_embed_code():
    response = client.post("/api/publish/embed-code", json={"agent_id": "default-agent-1"})
    assert response.status_code == 200
    data = response.json()
    assert "script_tag" in data
    assert "iframe_snippet" in data


def test_tools_available():
    response = client.get("/api/tools/available")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_subscription_current():
    response = client.get("/api/subscription/current")
    assert response.status_code == 200
    data = response.json()
    assert "plan_tier" in data


def test_user_credits():
    response = client.get("/api/user/credits")
    assert response.status_code == 200
    data = response.json()
    assert "remaining_credits" in data


def test_user_profile():
    response = client.get("/api/user/profile")
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
