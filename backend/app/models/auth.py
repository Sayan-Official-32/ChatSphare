from typing import Optional, Dict, Any
from pydantic import EmailStr, Field
from app.models.base import BaseSchema


class CaptchaResponse(BaseSchema):
    svg: str = Field(..., description="Vector SVG image markup")
    token: str = Field(..., description="HMAC-signed payload containing the solution")


class VerifyCaptchaRequest(BaseSchema):
    token: str = Field(..., description="Signed token received from /api/auth/captcha")
    solution: str = Field(..., description="User entered solution string")


class SessionExchangeRequest(BaseSchema):
    id_token: str = Field(..., description="Firebase Google/Password ID Token")


class UserProfile(BaseSchema):
    id: str
    email: EmailStr
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    auth_provider: str = "firebase"
    email_verified: bool = False
    plan_tier: str = "free"


class UserMeResponse(BaseSchema):
    authenticated: bool
    user: Optional[UserProfile] = None


class CheckAvailabilityRequest(BaseSchema):
    email: Optional[EmailStr] = None
    username: Optional[str] = None


class CheckAvailabilityResponse(BaseSchema):
    available: bool
    field: str
    message: Optional[str] = None


class LookupEmailRequest(BaseSchema):
    username: str


class LookupEmailResponse(BaseSchema):
    found: bool
    email: Optional[str] = None
