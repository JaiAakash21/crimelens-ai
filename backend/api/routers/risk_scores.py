from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from api.dependencies import get_supabase_service
from api.models.risk_score import RiskScoreResponse, RiskScorePoint

router = APIRouter()


@router.get("", response_model=RiskScoreResponse)
async def get_risk_scores(
    sw_lat: float = Query(..., description="South-west corner latitude"),
    sw_lng: float = Query(..., description="South-west corner longitude"),
    ne_lat: float = Query(..., description="North-east corner latitude"),
    ne_lng: float = Query(..., description="North-east corner longitude"),
    supabase: Client = Depends(get_supabase_service),
):
    result = (
        supabase.table("risk_scores")
        .select("lat, lng, score, level, factors, grid_cell_id")
        .gte("lat", sw_lat)
        .lte("lat", ne_lat)
        .gte("lng", sw_lng)
        .lte("lng", ne_lng)
        .gt("expires_at", "now()")
        .execute()
    )

    grid = []
    for row in result.data or []:
        grid.append(
            {
                "lat": row["lat"],
                "lng": row["lng"],
                "score": row["score"],
                "level": row["level"],
                "factors": row.get("factors", {}),
                "grid_cell_id": row.get("grid_cell_id"),
            }
        )

    return {"grid": grid}


@router.get("/{lat},{lng}", response_model=RiskScorePoint)
async def get_risk_score_at_point(
    lat: float,
    lng: float,
    supabase: Client = Depends(get_supabase_service),
):
    result = (
        supabase.table("risk_scores")
        .select("*")
        .gte("lat", lat - 0.001)
        .lte("lat", lat + 0.001)
        .gte("lng", lng - 0.001)
        .lte("lng", lng + 0.001)
        .gt("expires_at", "now()")
        .order("score", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No risk score found near this location",
        )

    return result.data[0]
