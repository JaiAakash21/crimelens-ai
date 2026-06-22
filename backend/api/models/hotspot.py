from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class HotspotResponse(BaseModel):
    id: str
    cluster_id: int
    center_lat: float
    center_lng: float
    radius_meters: float
    point_count: int
    incident_types: list[str]
    risk_level: str
    geometry_geojson: Optional[dict] = None
    created_at: datetime
    last_updated: datetime


class HotspotListResponse(BaseModel):
    items: list[HotspotResponse]
