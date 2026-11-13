from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.brand import (
    BrandSummaryRequest,
    BrandSummaryResponse,
    BrandSaveRequest,
    BrandResponse,
    BrandDNA,
)

router = APIRouter(prefix="/api/brand", tags=["Brand DNA Extraction"])

_MOCK_SAVED_BRANDS = {}


@router.post("/generate-summary", response_model=BrandSummaryResponse)
async def generate_brand_summary(payload: BrandSummaryRequest, user: UserProfile = Depends(get_current_user)):
    """
    Synthesizes brand overview, target audience, and suggested persona based on crawled website content.
    """
    domain = payload.website_url.replace("https://", "").replace("http://", "").split("/")[0]
    brand_name = payload.brand_name or domain.split(".")[0].capitalize()

    return BrandSummaryResponse(
        brand_name=brand_name,
        tagline=f"Empowering businesses with intelligent {brand_name} solutions.",
        summary=(
            f"{brand_name} is an enterprise-oriented company specializing in automated workflows, "
            f"seamless customer support, and modern software infrastructure. Designed to reduce operational friction "
            f"and improve client deflection."
        ),
        suggested_role="Customer Support Specialist",
        suggested_tone="Professional & Helpful",
        target_audience="Small to medium enterprises, engineering leaders, and operations managers.",
        key_offerings=[
            "24/7 Automated Support",
            "Instant Knowledge Retrieval",
            "Customizable Brand Theming",
            "Embeddable Widget Integration"
        ]
    )


@router.post("/save", response_model=BrandResponse)
async def save_brand(payload: BrandSaveRequest, user: UserProfile = Depends(get_current_user)):
    """Saves or updates extracted Brand DNA in the database."""
    brand_id = f"brand-{len(_MOCK_SAVED_BRANDS) + 1}"
    saved_brand = BrandResponse(
        id=brand_id,
        user_id=user.id,
        **payload.model_dump()
    )
    _MOCK_SAVED_BRANDS[brand_id] = saved_brand
    return saved_brand
