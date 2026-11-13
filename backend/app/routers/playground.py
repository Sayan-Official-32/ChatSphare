import time
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.chat import (
    ChatRequest,
    ChatResponse,
    CitationItem,
    FeedbackRequest,
    ConversationSummary,
    ConversationDetail,
    ChatMessage,
)

router = APIRouter(prefix="/api/playground", tags=["Studio Playground & Simulator"])

_MOCK_CONVERSATIONS = {
    "conv-101": ConversationDetail(
        id="conv-101",
        agent_id="default-agent-1",
        visitor_id="studio-tester",
        status="active",
        message_count=2,
        last_message="How do I embed ChatSphare on my website?",
        created_at="2026-11-13T06:30:00Z",
        messages=[
            ChatMessage(
                id="msg-1",
                role="user",
                message="How do I embed ChatSphare on my website?",
                created_at="2026-11-13T06:30:01Z"
            ),
            ChatMessage(
                id="msg-2",
                role="assistant",
                message="To embed ChatSphare on your website, copy the one-line `<script>` tag from the Deploy Space and paste it before the closing `</body>` tag of your site.",
                token_count=35,
                response_time=280,
                citations=[
                    CitationItem(
                        source_title="Homepage Information & Overview",
                        source_url="https://chatsphare.ai",
                        chunk_id="chunk-1",
                        similarity=0.92
                    )
                ],
                created_at="2026-11-13T06:30:02Z"
            )
        ]
    )
}


@router.post("/chat", response_model=ChatResponse)
async def playground_chat(payload: ChatRequest, user: UserProfile = Depends(get_current_user)):
    """
    Studio testing chat endpoint with full telemetry:
    Returns generated response, retrieved knowledge citations, latency in milliseconds, and token count.
    """
    start_time = time.time()
    conv_id = payload.conversation_id or f"conv-{random.randint(1000, 9999)}"

    # Simulate RAG retrieval & LLM generation
    time.sleep(0.05)
    latency_ms = int((time.time() - start_time) * 1000) + random.randint(150, 320)

    citations = [
        CitationItem(
            source_title="Homepage Information & Overview",
            source_url="https://chatsphare.ai",
            chunk_id="chunk-1",
            similarity=0.89
        )
    ]

    reply_text = (
        f"Thank you for reaching out! Based on verified organizational knowledge for this agent, "
        f"I can confirm that your request regarding '{payload.message.strip()}' is fully supported. "
        "Let me know if you would like more details or need assistance setting up."
    )

    # Save to mock conversation history
    if conv_id not in _MOCK_CONVERSATIONS:
        _MOCK_CONVERSATIONS[conv_id] = ConversationDetail(
            id=conv_id,
            agent_id=payload.agent_id,
            visitor_id=payload.visitor_id or "studio-tester",
            status="active",
            message_count=0,
            messages=[]
        )

    conv = _MOCK_CONVERSATIONS[conv_id]
    conv.messages.append(ChatMessage(role="user", message=payload.message))
    conv.messages.append(ChatMessage(
        role="assistant",
        message=reply_text,
        token_count=int(len(reply_text) / 3.8),
        response_time=latency_ms,
        citations=citations
    ))
    conv.message_count = len(conv.messages)
    conv.last_message = payload.message

    return ChatResponse(
        conversation_id=conv_id,
        message=reply_text,
        role="assistant",
        response_time_ms=latency_ms,
        token_count=int(len(reply_text) / 3.8),
        citations=citations,
        grounded=True
    )


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(agent_id: Optional[str] = None, user: UserProfile = Depends(get_current_user)):
    """List studio testing conversations."""
    return list(_MOCK_CONVERSATIONS.values())


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str, user: UserProfile = Depends(get_current_user)):
    """Retrieve full message history for a conversation thread."""
    conv = _MOCK_CONVERSATIONS.get(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: UserProfile = Depends(get_current_user)):
    """Delete a conversation thread."""
    if conversation_id in _MOCK_CONVERSATIONS:
        del _MOCK_CONVERSATIONS[conversation_id]
    return {"status": "success", "message": f"Conversation {conversation_id} deleted"}


@router.post("/feedback")
async def submit_feedback(payload: FeedbackRequest, user: UserProfile = Depends(get_current_user)):
    """Submit rating or feedback (-1 or 1) for a specific assistant turn."""
    return {
        "status": "success",
        "message": "Feedback recorded successfully",
        "message_id": payload.message_id,
        "rating": payload.rating
    }
