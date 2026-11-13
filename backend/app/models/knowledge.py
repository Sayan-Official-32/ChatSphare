from typing import List, Optional, Dict, Any
from pydantic import Field
from app.models.base import BaseSchema


class KnowledgeBaseBase(BaseSchema):
    name: str
    description: Optional[str] = None


class KnowledgeBaseCreate(KnowledgeBaseBase):
    pass


class KnowledgeBaseResponse(KnowledgeBaseBase):
    id: str
    user_id: Optional[str] = None
    document_count: int = 0
    created_at: Optional[str] = None


class DocumentResponse(BaseSchema):
    id: str
    agent_id: Optional[str] = None
    title: str
    source_type: str  # 'web_crawl', 'pdf', 'docx', 'manual_faq'
    source_url: Optional[str] = None
    character_count: int = 0
    word_count: int = 0
    token_count: int = 0
    chunk_count: int = 0
    created_at: Optional[str] = None


class ManualContentAddRequest(BaseSchema):
    agent_id: str
    title: str
    content: str
    source_type: str = "manual_faq"


class WebsiteIngestRequest(BaseSchema):
    agent_id: str
    url: str
    max_pages: int = 5


class SearchQueryRequest(BaseSchema):
    agent_id: str
    query: str
    limit: int = 4
    threshold: float = 0.20


class SearchResultChunk(BaseSchema):
    id: str
    document_id: Optional[str] = None
    chunk_text: str
    similarity: float
    heading_hierarchy: List[str] = Field(default_factory=list)


class SearchQueryResponse(BaseSchema):
    query: str
    agent_id: str
    results: List[SearchResultChunk] = Field(default_factory=list)
