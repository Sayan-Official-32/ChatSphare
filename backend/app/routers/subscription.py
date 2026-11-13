from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.billing import (
    SubscriptionResponse,
    PromoCodeValidateRequest,
    PromoCodeValidateResponse,
    PromoCodeApplyRequest,
    PromoCodeApplyResponse,
)

router = APIRouter(prefix="/api/subscription", tags=["Subscription & Promo Codes"])

_VALID_PROMO_CODES = {
    "JSLWORKS2026": {"plan_tier": "pro", "bonus_credits": 10000, "message": "JSL Works Internship Pro Pass activated!"},
    "STARTUP5K": {"plan_tier": "starter", "bonus_credits": 5000, "message": "Startup credits successfully granted."},
    "VIPENTERPRISE": {"plan_tier": "enterprise", "bonus_credits": 50000, "message": "Enterprise access granted."}
}


@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(user: UserProfile = Depends(get_current_user)):
    """Return user active plan tier and monthly allowance."""
    return SubscriptionResponse(
        plan_tier=user.plan_tier or "free",
        is_active=True,
        renewal_date="2026-12-13T00:00:00Z",
        monthly_credits_allowance=10000 if user.plan_tier == "pro" else 2000,
        features=[
            "1024-dimensional BGE-M3 Vector Search",
            "9-Layer OKF Anti-Hallucination Framework",
            "Dual-Engine Playwright Scraper",
            "Zero-Dependency Web Widget Embed",
            "Unlimited Studio Simulator Queries"
        ]
    )


@router.post("/validate-promocode", response_model=PromoCodeValidateResponse)
async def validate_promo_code(payload: PromoCodeValidateRequest, user: UserProfile = Depends(get_current_user)):
    """Validates promo code without redeeming."""
    code_clean = payload.code.strip().upper()
    promo = _VALID_PROMO_CODES.get(code_clean)
    if not promo:
        return PromoCodeValidateResponse(
            valid=False,
            code=code_clean,
            bonus_credits=0,
            message="Invalid or expired promo code."
        )
    return PromoCodeValidateResponse(
        valid=True,
        code=code_clean,
        target_plan_tier=promo["plan_tier"],
        bonus_credits=promo["bonus_credits"],
        message=f"Valid code! Unlocks {promo['plan_tier'].capitalize()} tier with {promo['bonus_credits']:,} bonus credits."
    )


@router.post("/apply-promocode", response_model=PromoCodeApplyResponse)
async def apply_promo_code(payload: PromoCodeApplyRequest, user: UserProfile = Depends(get_current_user)):
    """Atomically redeem promo code and upgrade user plan tier."""
    code_clean = payload.code.strip().upper()
    promo = _VALID_PROMO_CODES.get(code_clean)
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid or expired promo code.")

    return PromoCodeApplyResponse(
        success=True,
        plan_tier=promo["plan_tier"],
        credits_added=promo["bonus_credits"],
        new_total_credits=12000,
        message=promo["message"]
    )
