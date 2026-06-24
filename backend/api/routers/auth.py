from fastapi import APIRouter, Depends

from api.dependencies import get_admin_user, get_current_user, get_supabase_service
from supabase import Client

router = APIRouter()


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
