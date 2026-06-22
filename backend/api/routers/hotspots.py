from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from api.dependencies import get_supabase_service, get_admin_user
from api.models.hotspot import HotspotResponse, HotspotListResponse
from api.services.hotspot_detector import detect_hotspots, detect_hotspots_dry_run

router = APIRouter()


@router.get("", response_model=HotspotListResponse)
async def list_hotspots(
    min_risk: str | None = Query(None, description="Filter by minimum risk level"),
    supabase: Client = Depends(get_supabase_service),
):
    query = supabase.table("hotspots").select("*").order("point_count", desc=True)

    if min_risk:
        risk_order = {"low": 0, "moderate": 1, "high": 2, "critical": 3}
        min_order = risk_order.get(min_risk, 0)
        all_levels = [k for k, v in risk_order.items() if v >= min_order]
        query = query.in_("risk_level", all_levels)

    result = query.execute()
    return {"items": result.data or []}


@router.get("/{hotspot_id}", response_model=HotspotResponse)
async def get_hotspot(
    hotspot_id: str,
    supabase: Client = Depends(get_supabase_service),
):
    result = (
        supabase.table("hotspots").select("*").eq("id", hotspot_id).single().execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hotspot not found"
        )
    return result.data


@router.post("/refresh")
async def refresh_hotspots(
    dry_run: bool = Query(False, description="Simulate without persisting"),
    admin: dict = Depends(get_admin_user),
    supabase: Client = Depends(get_supabase_service),
):
    if dry_run:
        clusters = detect_hotspots_dry_run(supabase)
        return {
            "dry_run": True,
            "hotspots_detected": len(clusters),
            "clusters": clusters,
        }

    count = detect_hotspots(supabase)
    return {"message": "Hotspot detection complete", "hotspots_detected": count}
