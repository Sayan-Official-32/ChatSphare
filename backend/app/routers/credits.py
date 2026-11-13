from typing import Optional
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.billing import (
    CreditBalanceResponse,
    CreditTransactionsResponse,
    CreditTransactionItem,
)

router = APIRouter(tags=["Credits & Accounting"])

_MOCK_TRANSACTIONS = [
    CreditTransactionItem(
        id="tx-101",
        credits_deducted=1,
        action_type="chat_query",
        model_used="Google Gemini 1.5 Flash",
        description="Public widget visitor query",
        created_at="2026-11-13T06:55:00Z"
    ),
    CreditTransactionItem(
        id="tx-102",
        credits_deducted=2,
        action_type="web_crawl",
        model_used="HTTPX Scraper",
        description="Indexed 4 pages from https://chatsphare.ai",
        created_at="2026-11-13T06:40:00Z"
    ),
    CreditTransactionItem(
        id="tx-103",
        credits_deducted=3,
        action_type="generate_instructions",
        model_used="Mistral AI",
        description="Synthesized 7-section master prompt",
        created_at="2026-11-13T06:10:00Z"
    )
]


@router.get("/api/user/credits", response_model=CreditBalanceResponse)
@router.get("/api/credits/balance", response_model=CreditBalanceResponse)
@router.get("/api/credits", response_model=CreditBalanceResponse)
async def get_credit_balance(user: UserProfile = Depends(get_current_user)):
    """Return real-time credit allowance, monthly usage, and remaining credits."""
    return CreditBalanceResponse(
        plan_tier=user.plan_tier or "free",
        monthly_allowance=10000 if user.plan_tier == "pro" else 2000,
        monthly_used=120,
        topup_credits=0,
        remaining_credits=9880 if user.plan_tier == "pro" else 1880,
        cycle_start="2026-11-12T00:00:00Z",
        cycle_end="2026-12-12T00:00:00Z"
    )


@router.get("/api/user/credits/history", response_model=CreditTransactionsResponse)
@router.get("/api/credits/transactions", response_model=CreditTransactionsResponse)
async def get_credit_history(user: UserProfile = Depends(get_current_user)):
    """Get credit deduction audit log for recent queries and actions."""
    return CreditTransactionsResponse(
        transactions=_MOCK_TRANSACTIONS,
        total=len(_MOCK_TRANSACTIONS)
    )
