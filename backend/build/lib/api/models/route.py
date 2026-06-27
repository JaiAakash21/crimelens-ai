from pydantic import BaseModel, Field


class SafeRouteRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lng: float = Field(..., ge=-180, le=180)
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lng: float = Field(..., ge=-180, le=180)
    prefer_safety_over_speed: bool = True


class AlternativeRoute(BaseModel):
    safety_score: float
    distance_meters: float
    estimated_time_secs: int


class SafeRouteResponse(BaseModel):
    route_geometry: dict
    safety_score: float
    distance_meters: float
    estimated_time_secs: int
    alternative_routes: list[AlternativeRoute] = []
