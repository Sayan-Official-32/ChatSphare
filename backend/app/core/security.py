import time
import logging
from typing import Optional
import jwt
from fastapi import Request, HTTPException, status, Depends
from app.core.config import settings
from app.models.auth import UserProfile

logger = logging.getLogger(__name__)

SESSION_COOKIE_NAME = "bff_session"
JWT_ALGORITHM = "HS256"


def create_session_token(user_id: str, email: str, display_name: Optional[str] = None) -> str:
    """Creates an HMAC-signed JWT session token for the HttpOnly cookie."""
    payload = {
        "sub": user_id,
        "email": email,
        "display_name": display_name,
        "iat": int(time.time()),
        "exp": int(time.time()) + settings.COOKIE_MAX_AGE,
    }
    return jwt.encode(payload, settings.CAPTCHA_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_session_token(token: str) -> Optional[dict]:
    """Decodes and validates a session token."""
    try:
        return jwt.decode(token, settings.CAPTCHA_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logger.debug("Session token has expired.")
        return None
    except Exception as e:
        logger.debug(f"Invalid session token: {e}")
        return None


async def get_optional_user(request: Request) -> Optional[UserProfile]:
    """
    Dependency that returns the current UserProfile if valid credentials are provided,
    otherwise returns None without raising an HTTPException.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)
    
    if not token and "authorization" in request.headers:
        auth_header = request.headers["authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if token:
        payload = decode_session_token(token)
        if payload:
            return UserProfile(
                id=payload.get("sub", "user-default-1"),
                email=payload.get("email", "dev@chatsphare.ai"),
                display_name=payload.get("display_name", "ChatSphare Developer"),
                email_verified=True,
                plan_tier="pro"
            )

    # In local development mode, provide a default active developer profile if enabled
    if settings.ENVIRONMENT == "development":
        dev_header = request.headers.get("x-dev-user-id")
        if dev_header:
            return UserProfile(
                id=dev_header,
                email="dev@chatsphare.ai",
                display_name="Dev User",
                email_verified=True,
                plan_tier="pro"
            )

    return None


async def get_current_user(request: Request, user: Optional[UserProfile] = Depends(get_optional_user)) -> UserProfile:
    """
    Dependency enforcing authentication. Raises 401 if not authenticated.
    """
    if user is not None:
        return user

    # If in local development, allow seamless testing with demo user
    if settings.ENVIRONMENT == "development":
        return UserProfile(
            id="00000000-0000-0000-0000-000000000001",
            email="developer@chatsphare.ai",
            display_name="Local Developer",
            email_verified=True,
            plan_tier="pro"
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please log in or provide a valid session.",
        headers={"WWW-Authenticate": "Bearer"},
    )
