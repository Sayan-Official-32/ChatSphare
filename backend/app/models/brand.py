from typing import Optional, Dict, Any, List
from pydantic import Field, HttpUrl
from app.models.base import BaseSchema


class BrandDNA(BaseSchema):
    brand_name: str
    website_url: Optional[str] = None
    canonical_domain: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: str = "#6366f1"
    secondary_color: str = "#4f46e5"
    font_family: str = "Inter"
    brand_description: Optional[str] = None
    industry: Optional[str] = None
    brand_guidelines: Dict[str, Any] = Field(default_factory=dict)


class BrandSummaryRequest(BaseSchema):
    website_url: str
    raw_text: Optional[str] = None
    brand_name: Optional[str] = None


class BrandSummaryResponse(BaseSchema):
    brand_name: str
    tagline: Optional[str] = None
    summary: str
    suggested_role: str
    suggested_tone: str
    target_audience: Optional[str] = None
    key_offerings: List[str] = Field(default_factory=list)


class BrandSaveRequest(BrandDNA):
    pass


class BrandResponse(BrandDNA):
    id: str
    user_id: Optional[str] = None
