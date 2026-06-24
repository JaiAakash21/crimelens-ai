import logging

from supabase import create_client, Client

from api.config import get_settings

logger = logging.getLogger(__name__)
_settings = get_settings()

_supabase_anon: Client | None = None
_supabase_service: Client | None = None


def _create_safe_client(url: str, key: str) -> Client | None:
    try:
        return create_client(supabase_url=url, supabase_key=key)
    except Exception as e:
        logger.warning("Failed to create Supabase client: %s", e)
        return None


def get_supabase_anon() -> Client | None:
    global _supabase_anon
    if _supabase_anon is None:
        _supabase_anon = _create_safe_client(
            url=_settings.supabase_url,
            key=_settings.supabase_anon_key,
        )
    return _supabase_anon


def get_supabase_service() -> Client | None:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = _create_safe_client(
            url=_settings.supabase_url,
            key=_settings.supabase_service_key,
        )
    return _supabase_service


