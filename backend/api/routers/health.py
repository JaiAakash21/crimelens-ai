import logging
from datetime import datetime, timezone

from fastapi import APIRouter
from supabase import Client

from api.config import get_settings
from api.database import get_supabase_service

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


def _get_supabase() -> Client | None:
    try:
        return get_supabase_service()
    except Exception as e:
        logger.warning("Failed to initialize Supabase client: %s", e)
        return None


def _check_supabase(supabase: Client | None) -> dict:
    if supabase is None:
        return {"status": "unhealthy", "error": "Supabase client not available"}
    try:
        supabase.table("incidents").select("id", count="exact").limit(1).execute()
        return {
            "status": "healthy",
            "latency_ms": 0,
        }
    except Exception as e:
        logger.warning("Supabase health check failed: %s", e)
        return {"status": "unhealthy", "error": str(e)}


@router.get("/health")
async def health_check() -> dict:
    supabase = _get_supabase()
    db_health = _check_supabase(supabase)

    gemini_health = {"status": "unknown"}
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        gemini_health = {"status": "configured"}
    except Exception as e:
        gemini_health = {"status": "unconfigured", "error": str(e)}

    return {
        "status": "healthy" if db_health["status"] == "healthy" else "degraded",
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": db_health,
            "api": {"status": "healthy"},
            "gemini": gemini_health,
        },
    }
