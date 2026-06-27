from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ClassifyRequest(BaseModel):
    title: str = Field(default="", max_length=200, description="Incident title")
    description: str = Field(
        ..., min_length=5, max_length=5000, description="Full incident description"
    )


class ClassifyResponse(BaseModel):
    label: str = Field(description="Raw label from Gemini")
    mapped_type: str = Field(description="Label mapped to system incident_type enum")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    reasoning: str = Field(description="One-sentence explanation from Gemini")


class ClassifyBatchRequest(BaseModel):
    items: list[ClassifyRequest] = Field(..., min_length=1, max_length=50)


class ClassifyBatchResponse(BaseModel):
    results: list[ClassifyResponse]


class ClassificationRecord(BaseModel):
    id: str
    incident_id: str
    raw_description: str
    gemini_label: str
    gemini_confidence: float
    gemini_response_raw: dict[str, Any] | None = None
    mapped_type: str | None = None
    reasoning: str | None = None
    reviewed: bool = False
    created_at: datetime
