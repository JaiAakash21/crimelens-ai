from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from supabase import Client

from api.dependencies import get_current_user, get_supabase_service
from api.models.dashboard import DashboardStats, TrendResponse, CategoryResponse

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    total = supabase.table("incidents").select("*", count="exact").limit(1).execute()
    total_count = total.count if hasattr(total, "count") else 0

    today = (
        supabase.table("incidents")
        .select("*", count="exact")
        .gte("created_at", today_start.isoformat())
        .limit(1)
        .execute()
    )
    today_count = today.count if hasattr(today, "count") else 0

    week = (
        supabase.table("incidents")
        .select("*", count="exact")
        .gte("created_at", week_start.isoformat())
        .limit(1)
        .execute()
    )
    week_count = week.count if hasattr(week, "count") else 0

    month = (
        supabase.table("incidents")
        .select("*", count="exact")
        .gte("created_at", month_start.isoformat())
        .limit(1)
        .execute()
    )
    month_count = month.count if hasattr(month, "count") else 0

    hotspots = supabase.table("hotspots").select("*", count="exact").execute()
    hotspot_count = (
        hotspots.count if hasattr(hotspots, "count") else len(hotspots.data or [])
    )

    risk = (
        supabase.table("risk_scores")
        .select("score")
        .gt("expires_at", "now()")
        .execute()
    )
    risk_scores_list = [r["score"] for r in (risk.data or [])]
    avg_score = (
        sum(risk_scores_list) / len(risk_scores_list) if risk_scores_list else 50.0
    )

    all_types = supabase.table("incidents").select("incident_type").execute()
    type_counts = {}
    for t in all_types.data or []:
        inc_type = t.get("incident_type", "other")
        type_counts[inc_type] = type_counts.get(inc_type, 0) + 1
    most_common = max(type_counts, key=type_counts.get) if type_counts else None

    high_risk = (
        supabase.table("risk_scores")
        .select("lat, lng, score, level")
        .gte("score", 50)
        .gt("expires_at", "now()")
        .order("score", desc=True)
        .limit(5)
        .execute()
    )

    return {
        "total_incidents": total_count,
        "active_hotspots": hotspot_count,
        "avg_safety_score": round(avg_score, 1),
        "incidents_today": today_count,
        "incidents_this_week": week_count,
        "incidents_this_month": month_count,
        "most_common_type": most_common,
        "high_risk_areas": high_risk.data or [],
    }


@router.get("/trends", response_model=TrendResponse)
async def get_trends(
    days: int = Query(default=30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    result = (
        supabase.table("incidents")
        .select("occurred_at")
        .gte("occurred_at", cutoff)
        .execute()
    )

    daily = {}
    hourly = {h: 0 for h in range(24)}

    for inc in result.data or []:
        dt = datetime.fromisoformat(inc["occurred_at"])
        day_key = dt.strftime("%Y-%m-%d")
        daily[day_key] = daily.get(day_key, 0) + 1
        hourly[dt.hour] = hourly.get(dt.hour, 0) + 1

    daily_sorted = sorted(daily.items(), key=lambda x: x[0])
    hourly_sorted = sorted(hourly.items(), key=lambda x: x[0])

    return {
        "daily": [{"date": k, "count": v} for k, v in daily_sorted],
        "hourly_heatmap": [{"hour": k, "count": v} for k, v in hourly_sorted],
    }


@router.get("/categories", response_model=CategoryResponse)
async def get_categories(
    days: int = Query(default=30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    result = (
        supabase.table("incidents")
        .select("incident_type")
        .gte("created_at", cutoff)
        .execute()
    )

    counts = {}
    for inc in result.data or []:
        t = inc["incident_type"]
        counts[t] = counts.get(t, 0) + 1

    total = sum(counts.values()) or 1
    categories = [
        {"type": t, "count": c, "percentage": round(c / total * 100, 1)}
        for t, c in sorted(counts.items(), key=lambda x: x[1], reverse=True)
    ]

    return {"categories": categories}
