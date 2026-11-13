import secrets
import time
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.models.auth import UserProfile
from app.models.billing import (
    ApiKeyItem,
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
)

router = APIRouter(tags=["User Profile & Developer API Keys"])


class ProfileUpdateRequest(BaseModel):
    display_name: str
    organization_name: str = "ChatSphare Organization"


_MOCK_API_KEYS = {
    "key-1": ApiKeyItem(
        id="key-1",
        name="Production Webhook Key",
        masked_key="cs_live_...9f2a",
        created_at="2026-11-12T20:00:00Z",
        last_used_at="2026-11-13T06:55:00Z"
    )
}


@router.get("/api/user/profile", response_model=UserProfile)
@router.get("/api/profile", response_model=UserProfile)
async def get_profile(user: UserProfile = Depends(get_current_user)):
    """Get authenticated user profile details and subscription status."""
    return user


@router.put("/api/user/profile", response_model=UserProfile)
@router.put("/api/profile", response_model=UserProfile)
async def update_profile(payload: ProfileUpdateRequest, user: UserProfile = Depends(get_current_user)):
    """Update profile preferences or display name."""
    user.display_name = payload.display_name
    return user


@router.delete("/api/user/profile/photo")
async def delete_profile_photo(user: UserProfile = Depends(get_current_user)):
    """Remove user avatar photo."""
    user.photo_url = None
    return {"status": "success", "message": "Avatar photo removed"}


@router.get("/api/user/api-keys", response_model=List[ApiKeyItem])
@router.get("/api/profile/api-keys", response_model=List[ApiKeyItem])
async def list_api_keys(user: UserProfile = Depends(get_current_user)):
    """List developer API keys."""
    return list(_MOCK_API_KEYS.values())


@router.post("/api/user/api-keys", response_model=ApiKeyCreateResponse)
@router.post("/api/profile/api-keys", response_model=ApiKeyCreateResponse)
async def create_api_key(payload: ApiKeyCreateRequest, user: UserProfile = Depends(get_current_user)):
    """Generate a new developer API key."""
    key_id = f"key-{len(_MOCK_API_KEYS) + 1}"
    raw_secret = f"cs_live_{secrets.token_urlsafe(32)}"
    masked = f"cs_live_...{raw_secret[-4:]}"
    
    new_item = ApiKeyItem(
        id=key_id,
        name=payload.name,
        masked_key=masked,
        created_at="2026-11-13T07:10:00Z"
    )
    _MOCK_API_KEYS[key_id] = new_item

    return ApiKeyCreateResponse(
        id=key_id,
        name=payload.name,
        api_key=raw_secret,
        created_at="2026-11-13T07:10:00Z"
    )


@router.delete("/api/user/api-keys/{key_id}")
@router.delete("/api/profile/api-keys/{key_id}")
async def revoke_api_key(key_id: str, user: UserProfile = Depends(get_current_user)):
    """Revoke an active developer API key."""
    if key_id in _MOCK_API_KEYS:
        del _MOCK_API_KEYS[key_id]
    return {"status": "success", "message": f"API key {key_id} revoked"}
