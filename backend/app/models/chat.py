from typing import List, Optional, Dict, Any
from pydantic import Field
from app.models.base import BaseSchema


class CitationItem(BaseSchema):
    source_title: str
    source_url: Optional[str] = None
    chunk_id: Optional[str] = None
    similarity: float = 0.0


class ChatMessage(BaseSchema):
    id: Optional[str] = None
    role: str  # 'user', 'assistant', 'system'
    message: str
    token_count: int = 0
    response_time: int = 0  # ms
    citations: List[CitationItem] = Field(default_factory=list)
    created_at: Optional[str] = None


class ChatRequest(BaseSchema):
    agent_id: str
    message: str
    conversation_id: Optional[str] = None
    visitor_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseSchema):
    conversation_id: str
    message: str
    role: str = "assistant"
    response_time_ms: int = 0
    token_count: int = 0
    citations: List[CitationItem] = Field(default_factory=list)
    grounded: bool = True


class FeedbackRequest(BaseSchema):
    message_id: str
    conversation_id: str
    rating: int = Field(..., ge=-1, le=5, description="-1 (downvote), 1 (upvote), or 1-5 scale")
    comment: Optional[str] = None


class ConversationSummary(BaseSchema):
    id: str
    agent_id: str
    visitor_id: str
    status: str = "active"
    message_count: int = 0
    last_message: Optional[str] = None
    created_at: Optional[str] = None


class ConversationDetail(ConversationSummary):
    messages: List[ChatMessage] = Field(default_factory=list)
