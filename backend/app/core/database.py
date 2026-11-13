import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns a singleton instance of the Supabase Client.
    Uses the SERVICE_ROLE_KEY to bypass Row-Level Security on administrative backend endpoints.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning(
            "⚠️ Supabase URL or Service Role Key is not configured in .env. "
            "Database queries requiring Supabase will fail until configured."
        )
        return None

    try:
        _supabase_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
        )
        logger.info("✅ Supabase client successfully initialized.")
        return _supabase_client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase client: {e}")
        return None


def get_db() -> Client:
    """
    FastAPI dependency injection provider for Supabase database access.
    Raises RuntimeError if the client is uninitialized.
    """
    client = get_supabase_client()
    if client is None:
        raise RuntimeError(
            "Supabase database connection is not available. Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env."
        )
    return client
