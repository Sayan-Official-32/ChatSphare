from typing import List, Optional, Dict, Any
from pydantic import Field, HttpUrl
from app.models.base import BaseSchema


class CrawlRequest(BaseSchema):
    url: str = Field(..., description="Target website URL to crawl")
    max_pages: int = Field(default=10, ge=1, le=50, description="Max depth of internal page links to crawl")
    include_subdomains: bool = Field(default=False)


class CrawlPage(BaseSchema):
    url: str
    title: str
    content: str
    word_count: int = 0
    status: str = "success"
    error: Optional[str] = None


class CrawlResponse(BaseSchema):
    website_url: str
    total_pages_crawled: int
    pages: List[CrawlPage] = Field(default_factory=list)
    detected_brand_name: Optional[str] = None
    detected_logo_url: Optional[str] = None
    detected_colors: List[str] = Field(default_factory=list)
    extraction_duration_ms: int = 0
