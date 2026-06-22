from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from supabase_auth import UserResponse

from api.database import get_supabase_anon, get_supabase_service

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_anon),
) -> dict:
    try:
        user_response: UserResponse = supabase.auth.get_user(credentials.credentials)
        return user_response.user.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_admin_user(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
) -> dict:
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
