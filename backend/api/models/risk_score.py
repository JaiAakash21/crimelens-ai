from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RiskScoreCell(BaseModel):
    lat: float
    lng: float
    score: float
    level: str
    factors: dict = {}
    grid_cell_id: Optional[str] = None


class RiskScoreResponse(BaseModel):
    grid: list[RiskScoreCell]


class RiskScorePoint(BaseModel):
    lat: float
    lng: float
    score: float
    level: str
    factors: dict = {}
    calculated_at: datetime
    expires_at: datetime
