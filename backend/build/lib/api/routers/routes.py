from fastapi import APIRouter, Depends
from supabase import Client

from api.dependencies import get_current_user, get_supabase_service
from api.models.route import SafeRouteRequest, SafeRouteResponse
from api.services.route_planner import get_safe_route

router = APIRouter()


@router.post("/safe", response_model=SafeRouteResponse)
async def get_safe_route_endpoint(
    body: SafeRouteRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    route = get_safe_route(
        supabase=supabase,
        origin_lat=body.origin_lat,
        origin_lng=body.origin_lng,
        dest_lat=body.dest_lat,
        dest_lng=body.dest_lng,
        prefer_safety=body.prefer_safety_over_speed,
    )

    supabase.table("safe_routes").insert(
        {
            "user_id": current_user["id"],
            "origin_lat": body.origin_lat,
            "origin_lng": body.origin_lng,
            "dest_lat": body.dest_lat,
            "dest_lng": body.dest_lng,
            "route_geometry": route["route_geometry"],
            "safety_score": route["safety_score"],
            "distance_meters": route["distance_meters"],
            "estimated_time_secs": route["estimated_time_secs"],
        }
    ).execute()

    return route
