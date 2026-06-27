from supabase import create_client, Client

from api.config import get_settings

_settings = get_settings()

_supabase_anon: Client | None = None
_supabase_service: Client | None = None


def get_supabase_anon() -> Client:
    global _supabase_anon
    if _supabase_anon is None:
        _supabase_anon = create_client(
            supabase_url=_settings.supabase_url,
            supabase_key=_settings.supabase_anon_key,
        )
    return _supabase_anon


def get_supabase_service() -> Client:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = create_client(
            supabase_url=_settings.supabase_url,
            supabase_key=_settings.supabase_service_key,
        )
    return _supabase_service
