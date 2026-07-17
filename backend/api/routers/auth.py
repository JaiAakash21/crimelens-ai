from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx
import logging

from api.config import get_settings
from api.database import get_supabase_anon
from api.dependencies import get_current_user, get_supabase_service
from supabase import Client

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


@router.post("/login")
async def login(body: LoginRequest):
    sb = get_supabase_anon()
    try:
        result = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception as exc:
        logger.exception("Supabase login failed")
        raise HTTPException(status_code=401, detail=str(exc))

    return {
        "access_token": result.session.access_token,
        "user": {"id": result.user.id, "email": result.user.email},
    }


@router.post("/signup")
async def signup(body: RegisterRequest):
    sb = get_supabase_anon()
    try:
        result = sb.auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
                "options": {"data": {"full_name": body.full_name}},
            }
        )
    except Exception as exc:
        logger.exception("Supabase signup failed")
        raise HTTPException(status_code=400, detail=str(exc))

    if result.user is None:
        raise HTTPException(status_code=400, detail="Signup failed")

    return {
        "message": "Account created. Please check your email to confirm your account.",
        "user": {"id": result.user.id, "email": result.user.email},
    }


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
