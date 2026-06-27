from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


INCIDENT_TYPES = [
    "theft",
    "robbery",
    "harassment",
    "assault",
    "suspicious_activity",
    "vandalism",
    "other",
]

INCIDENT_STATUSES = [
    "reported",
    "verified",
    "investigating",
    "resolved",
    "dismissed",
]


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    incident_type: str = Field(default="other")
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    gps_accuracy: Optional[float] = Field(default=None, ge=0)
    occurred_at: datetime

    @field_validator("incident_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in INCIDENT_TYPES:
            raise ValueError(f"Invalid incident type. Must be one of: {INCIDENT_TYPES}")
        return v


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, min_length=10, max_length=5000)
    incident_type: Optional[str] = None
    status: Optional[str] = None
    occurred_at: Optional[datetime] = None

    @field_validator("incident_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v is not None and v not in INCIDENT_TYPES:
            raise ValueError(f"Invalid incident type. Must be one of: {INCIDENT_TYPES}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v is not None and v not in INCIDENT_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {INCIDENT_STATUSES}")
        return v


class IncidentImage(BaseModel):
    id: str
    incident_id: str
    storage_path: str
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    mime_type: str = "image/jpeg"
    created_at: datetime


class IncidentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    incident_type: str
    status: str
    lat: float
    lng: float
    gps_accuracy: Optional[float] = None
    classification: Optional[str] = None
    confidence: Optional[float] = None
    occurred_at: datetime
    created_at: datetime
    updated_at: datetime
    images: list[IncidentImage] = []


class IncidentListResponse(BaseModel):
    items: list[IncidentResponse]
    total: int
    page: int
    per_page: int
    has_next: bool


class ImageUploadResponse(BaseModel):
    id: str
    storage_path: str
    url: str
