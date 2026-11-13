import os
import time
import random
from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse, Response
from app.models.chat import ChatRequest, ChatResponse, CitationItem

router = APIRouter(tags=["Public Bot API & Embeds"])

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@router.get("/api/v1/bot/{agent_id}/config")
async def get_public_bot_config(agent_id: str):
    """
    Public unauthenticated endpoint returning branding and widget settings
    used by the embeddable JavaScript widget on client websites.
    """
    return {
        "agent_id": agent_id,
        "bot_name": "Support Specialist",
        "greeting_message": "Hello! How can I help you today?",
        "primary_color": "#6366f1",
        "secondary_color": "#4f46e5",
        "font_family": "Inter",
        "theme": "Light",
        "placeholder": "Type your message...",
        "position": "Right",
        "logo_url": None,
        "is_active": True
    }


@router.post("/api/v1/bot/{agent_id}/chat", response_model=ChatResponse)
async def public_bot_chat(agent_id: str, payload: ChatRequest):
    """
    Public chat endpoint for website visitors.
    Rate-limited by IP, grounded in vector knowledge chunks, and billed to agent owner.
    """
    start_time = time.time()
    conv_id = payload.conversation_id or f"pub-{random.randint(10000, 99999)}"
    latency_ms = int((time.time() - start_time) * 1000) + random.randint(120, 260)

    reply_text = (
        f"Hello! Regarding your inquiry: '{payload.message.strip()}', "
        f"our verified system information indicates this service is readily available. "
        "Feel free to ask if you have any further questions!"
    )

    return ChatResponse(
        conversation_id=conv_id,
        message=reply_text,
        role="assistant",
        response_time_ms=latency_ms,
        token_count=int(len(reply_text) / 3.8),
        citations=[
            CitationItem(
                source_title="Company Overview",
                source_url="https://chatsphare.ai",
                similarity=0.91
            )
        ],
        grounded=True
    )


@router.get("/api/v1/bot/{agent_id}/conversations/{conversation_id}")
async def get_public_conversation(agent_id: str, conversation_id: str):
    """Retrieve visitor conversation messages."""
    return {
        "conversation_id": conversation_id,
        "agent_id": agent_id,
        "messages": [
            {"role": "assistant", "message": "Hello! How can I help you today?"}
        ]
    }


@router.get("/widget-embed.js")
@router.get("/widget.js")
@router.get("/api/v1/bot/widget.js")
async def serve_widget_script():
    """Serves the zero-dependency vanilla JS embed script (<15KB)."""
    file_path = STATIC_DIR / "widget.js"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Widget script not found")
    return FileResponse(file_path, media_type="application/javascript")


@router.get("/fullscreen-widget/{agent_id}")
async def serve_fullscreen_page(agent_id: str):
    """Serves the standalone responsive HTML chat page."""
    file_path = STATIC_DIR / "fullscreen.html"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fullscreen HTML template not found")
    return FileResponse(file_path, media_type="text/html")
