from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import Field
from app.models.base import BaseSchema


class SubscriptionResponse(BaseSchema):
    plan_tier: str = "free"
    is_active: bool = True
    renewal_date: Optional[str] = None
    monthly_credits_allowance: int = 2000
    features: List[str] = Field(default_factory=list)


class PromoCodeValidateRequest(BaseSchema):
    code: str


class PromoCodeValidateResponse(BaseSchema):
    valid: bool
    code: str
    target_plan_tier: Optional[str] = None
    bonus_credits: int = 0
    message: Optional[str] = None


class PromoCodeApplyRequest(BaseSchema):
    code: str


class PromoCodeApplyResponse(BaseSchema):
    success: bool
    plan_tier: str
    credits_added: int
    new_total_credits: int
    message: str


class CreditBalanceResponse(BaseSchema):
    plan_tier: str = "free"
    monthly_allowance: int = 2000
    monthly_used: int = 0
    topup_credits: int = 0
    remaining_credits: int = 2000
    cycle_start: Optional[str] = None
    cycle_end: Optional[str] = None


class CreditTransactionItem(BaseSchema):
    id: str
    credits_deducted: int
    action_type: str = "chat_query"
    model_used: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[str] = None


class CreditTransactionsResponse(BaseSchema):
    transactions: List[CreditTransactionItem] = Field(default_factory=list)
    total: int = 0


class ApiKeyItem(BaseSchema):
    id: str
    name: str
    masked_key: str
    created_at: Optional[str] = None
    last_used_at: Optional[str] = None


class ApiKeyCreateRequest(BaseSchema):
    name: str = "Default API Key"


class ApiKeyCreateResponse(BaseSchema):
    id: str
    name: str
    api_key: str
    created_at: str
