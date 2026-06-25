import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from api.dependencies import get_admin_user, get_current_user, get_supabase_service
from supabase import Client

logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    email: str = Field(..., examples=["analyst@crimelens.ai"])
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str = ""
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    supabase: Client = Depends(get_supabase_service),
):
    try:
        result = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as e:
        logger.warning("Login failed for %s: %s", body.email, e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not result.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token or "",
        "token_type": "bearer",
        "user": result.user.model_dump() if result.user else {},
    }


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    body: RefreshRequest,
    supabase: Client = Depends(get_supabase_service),
):
    try:
        result = supabase.auth.refresh_session(body.refresh_token)
    except Exception as e:
        logger.warning("Token refresh failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if not result.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh failed",
        )

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token or "",
        "token_type": "bearer",
        "user": result.user.model_dump() if result.user else {},
    }


@router.get("/users")
async def list_users(
    admin: dict = Depends(get_admin_user),
    supabase: Client = Depends(get_supabase_service),
):
    result = (
        supabase.table("profiles")
        .select("id, email, full_name, avatar_url, role, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/me")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    user_id = current_user["id"]
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return result.data or current_user


@router.patch("/me")
async def update_profile(
    full_name: str | None = None,
    avatar_url: str | None = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    user_id = current_user["id"]
    updates = {}
    if full_name is not None:
        updates["full_name"] = full_name
    if avatar_url is not None:
        updates["avatar_url"] = avatar_url

    if updates:
        result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
        return result.data[0]

    return {"message": "No updates provided"}
