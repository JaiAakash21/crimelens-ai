import logging
from datetime import datetime, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from api.config import get_settings
from api.database import get_supabase_anon, get_supabase_service

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"


def _decode_and_validate_jwt_locally(token: str) -> dict | None:
    settings = get_settings()
    secret = settings.supabase_jwt_secret
    if not secret:
        logger.debug("SUPABASE_JWT_SECRET not configured, skipping local validation")
        return None
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[JWT_ALGORITHM],
            issuer="supabase",
            audience="authenticated",
            options={
                "verify_exp": True,
                "require": ["sub", "exp"],
            },
        )
        logger.debug("Local JWT validation succeeded for user %s", payload.get("sub"))
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT expired")
    except jwt.InvalidTokenError as e:
        logger.warning("Local JWT validation failed: %s", e)
    return None


def _build_user_dict_from_jwt(payload: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": payload["sub"],
        "email": payload.get("email"),
        "role": payload.get("role"),
        "aud": payload.get("aud", "authenticated"),
        "app_metadata": payload.get("app_metadata", {}),
        "user_metadata": payload.get("user_metadata", {}),
        "created_at": now,
        "updated_at": now,
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    supabase: Client | None = Depends(get_supabase_anon),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jwt_token = credentials.credentials

    # Path 1: Local JWT validation (requires SUPABASE_JWT_SECRET in .env)
    payload = _decode_and_validate_jwt_locally(jwt_token)
    if payload is not None:
        return _build_user_dict_from_jwt(payload)

    # Path 2: Fallback — call Supabase Auth API via supabase-py SDK
    if supabase is not None:
        try:
            logger.debug("Attempting supabase.auth.get_user()...")
            user_response = supabase.auth.get_user(jwt_token)
            if user_response and user_response.user:
                logger.debug("get_user() succeeded for user %s", user_response.user.id)
                return user_response.user.model_dump()
        except Exception as e:
            logger.warning("supabase.auth.get_user() failed: %s", e)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. If this persists, set SUPABASE_JWT_SECRET in .env for local JWT validation.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_admin_user(
    current_user: dict = Depends(get_current_user),
    supabase: Client | None = Depends(get_supabase_service),
) -> dict:
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env",
        )
    user_id = current_user["id"]
    result = (
        supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    )
    if not result.data or result.data["role"] not in ("analyst", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Analyst or Admin role required.",
        )
    return current_user
