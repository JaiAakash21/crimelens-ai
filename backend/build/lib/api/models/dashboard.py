from typing import Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_incidents: int
    active_hotspots: int
    avg_safety_score: float
    incidents_today: int
    incidents_this_week: int
    incidents_this_month: int
    most_common_type: Optional[str] = None
    high_risk_areas: list[dict] = []


class DailyTrend(BaseModel):
    date: str
    count: int


class HourlyHeatmap(BaseModel):
    hour: int
    count: int


class TrendResponse(BaseModel):
    daily: list[DailyTrend]
    hourly_heatmap: list[HourlyHeatmap]


class CategoryBreakdown(BaseModel):
    type: str
    count: int
    percentage: float


class CategoryResponse(BaseModel):
    categories: list[CategoryBreakdown]
