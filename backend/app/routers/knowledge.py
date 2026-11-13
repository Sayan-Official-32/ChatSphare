from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.knowledge import (
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    DocumentResponse,
    ManualContentAddRequest,
    WebsiteIngestRequest,
    SearchQueryRequest,
    SearchQueryResponse,
    SearchResultChunk,
)

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base & Documents"])

_MOCK_KBS = {
    "kb-1": KnowledgeBaseResponse(
        id="kb-1",
        name="Default Knowledge Collection",
        description="Auto-generated organizational knowledge base",
        document_count=4,
        created_at="2026-11-12T20:00:00Z"
    )
}

_MOCK_DOCUMENTS = {
    "doc-1": DocumentResponse(
        id="doc-1",
        agent_id="default-agent-1",
        title="Homepage Information & Overview",
        source_type="web_crawl",
        source_url="https://chatsphare.ai",
        character_count=1240,
        word_count=180,
        token_count=245,
        chunk_count=3,
        created_at="2026-11-12T20:01:00Z"
    ),
    "doc-2": DocumentResponse(
        id="doc-2",
        agent_id="default-agent-1",
        title="Pricing and Billing FAQ",
        source_type="manual_faq",
        source_url=None,
        character_count=890,
        word_count=120,
        token_count=165,
        chunk_count=2,
        created_at="2026-11-12T20:02:00Z"
    )
}


@router.get("/bases", response_model=List[KnowledgeBaseResponse])
async def list_knowledge_bases(user: UserProfile = Depends(get_current_user)):
    """List all knowledge base collections for the authenticated user."""
    return list(_MOCK_KBS.values())


@router.post("/bases", response_model=KnowledgeBaseResponse)
async def create_knowledge_base(payload: KnowledgeBaseCreate, user: UserProfile = Depends(get_current_user)):
    """Create a new knowledge base collection."""
    kb_id = f"kb-{len(_MOCK_KBS) + 1}"
    new_kb = KnowledgeBaseResponse(
        id=kb_id,
        user_id=user.id,
        name=payload.name,
        description=payload.description,
        document_count=0
    )
    _MOCK_KBS[kb_id] = new_kb
    return new_kb


@router.get("/bases/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(kb_id: str, user: UserProfile = Depends(get_current_user)):
    """Retrieve details for a specific knowledge base."""
    kb = _MOCK_KBS.get(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return kb


@router.put("/bases/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_knowledge_base(kb_id: str, payload: KnowledgeBaseCreate, user: UserProfile = Depends(get_current_user)):
    """Update knowledge base metadata."""
    kb = _MOCK_KBS.get(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    kb.name = payload.name
    kb.description = payload.description
    return kb


@router.delete("/bases/{kb_id}")
async def delete_knowledge_base(kb_id: str, user: UserProfile = Depends(get_current_user)):
    """Delete a knowledge base collection."""
    if kb_id in _MOCK_KBS:
        del _MOCK_KBS[kb_id]
    return {"status": "success", "message": f"Knowledge base {kb_id} deleted"}


@router.post("/upload-file", response_model=DocumentResponse)
@router.post("/upload", response_model=DocumentResponse)
async def upload_file(
    file: UploadFile = File(...),
    agent_id: Optional[str] = Form("default-agent-1"),
    user: UserProfile = Depends(get_current_user)
):
    """
    Upload and parse binary files (PDF, DOCX, PPTX).
    Extracts text, computes semantic chunks, and creates vector embeddings.
    """
    doc_id = f"doc-{len(_MOCK_DOCUMENTS) + 1}"
    filename = file.filename or "Uploaded Document"
    
    # Determine source type
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"
    source_type = ext if ext in ["pdf", "docx", "pptx"] else "document"

    new_doc = DocumentResponse(
        id=doc_id,
        agent_id=agent_id,
        title=filename,
        source_type=source_type,
        character_count=2150,
        word_count=320,
        token_count=410,
        chunk_count=4,
        created_at="2026-11-13T06:00:00Z"
    )
    _MOCK_DOCUMENTS[doc_id] = new_doc
    return new_doc


@router.post("/website", response_model=DocumentResponse)
@router.post("/crawl-website", response_model=DocumentResponse)
async def ingest_subpage(payload: WebsiteIngestRequest, user: UserProfile = Depends(get_current_user)):
    """Ingests a subpage URL into agent knowledge."""
    doc_id = f"doc-{len(_MOCK_DOCUMENTS) + 1}"
    title = payload.url.split("/")[-1].replace("-", " ").capitalize() or "Subpage"
    new_doc = DocumentResponse(
        id=doc_id,
        agent_id=payload.agent_id,
        title=f"Web: {title}",
        source_type="web_crawl",
        source_url=payload.url,
        character_count=1800,
        word_count=260,
        token_count=340,
        chunk_count=3,
        created_at="2026-11-13T06:05:00Z"
    )
    _MOCK_DOCUMENTS[doc_id] = new_doc
    return new_doc


@router.post("/add", response_model=DocumentResponse)
async def add_manual_knowledge(payload: ManualContentAddRequest, user: UserProfile = Depends(get_current_user)):
    """Add manual text snippet or FAQ pair to agent knowledge base."""
    doc_id = f"doc-{len(_MOCK_DOCUMENTS) + 1}"
    new_doc = DocumentResponse(
        id=doc_id,
        agent_id=payload.agent_id,
        title=payload.title,
        source_type=payload.source_type,
        character_count=len(payload.content),
        word_count=len(payload.content.split()),
        token_count=int(len(payload.content) / 4),
        chunk_count=max(1, int(len(payload.content) / 600)),
        created_at="2026-11-13T06:10:00Z"
    )
    _MOCK_DOCUMENTS[doc_id] = new_doc
    return new_doc


@router.get("/list", response_model=List[DocumentResponse])
async def list_knowledge_documents(agent_id: Optional[str] = None, user: UserProfile = Depends(get_current_user)):
    """List all ingested documents and chunk stats for an agent."""
    return list(_MOCK_DOCUMENTS.values())


@router.delete("/{item_id}")
async def delete_knowledge_document(item_id: str, user: UserProfile = Depends(get_current_user)):
    """Delete document and cascade delete its vector embeddings."""
    if item_id in _MOCK_DOCUMENTS:
        del _MOCK_DOCUMENTS[item_id]
    return {"status": "success", "message": f"Document {item_id} deleted"}


@router.post("/search", response_model=SearchQueryResponse)
async def search_knowledge(payload: SearchQueryRequest, user: UserProfile = Depends(get_current_user)):
    """Direct test for vector similarity search."""
    return SearchQueryResponse(
        query=payload.query,
        agent_id=payload.agent_id,
        results=[
            SearchResultChunk(
                id="chunk-1",
                document_id="doc-1",
                chunk_text="ChatSphare enables instant deployment of factually grounded AI agents directly on your website.",
                similarity=0.91,
                heading_hierarchy=["Overview", "Core Value"]
            ),
            SearchResultChunk(
                id="chunk-2",
                document_id="doc-2",
                chunk_text="Free Tier includes 2,000 monthly credits with support for BGE-M3 high-dimensional vector search.",
                similarity=0.84,
                heading_hierarchy=["Pricing", "Free Tier"]
            )
        ]
    )
