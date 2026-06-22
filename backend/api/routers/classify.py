import logging

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.dependencies import get_current_user, get_supabase_service
from api.models.classification import (
    ClassifyBatchRequest,
    ClassifyBatchResponse,
    ClassifyRequest,
    ClassifyResponse,
)
from api.services.classifier import get_classifier

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=ClassifyResponse)
async def classify_incident(
    body: ClassifyRequest,
    current_user: dict = Depends(get_current_user),
):
    classifier = get_classifier()
    result = classifier.classify(title=body.title, description=body.description)
    return ClassifyResponse(
        label=result["label"],
        mapped_type=result["mapped_type"],
        confidence=result["confidence"],
        reasoning=result["reasoning"],
    )


@router.post("/batch", response_model=ClassifyBatchResponse)
async def classify_batch(
    body: ClassifyBatchRequest,
    current_user: dict = Depends(get_current_user),
):
    classifier = get_classifier()
    raw_items = [{"title": r.title, "description": r.description} for r in body.items]
    results = classifier.classify_batch(raw_items)
    return ClassifyBatchResponse(
        results=[
            ClassifyResponse(
                label=r["label"],
                mapped_type=r["mapped_type"],
                confidence=r["confidence"],
                reasoning=r["reasoning"],
            )
            for r in results
        ]
    )


@router.post("/incident/{incident_id}", response_model=ClassifyResponse)
async def reclassify_incident(
    incident_id: str,
    supabase: Client = Depends(get_supabase_service),
    current_user: dict = Depends(get_current_user),
):
    result = (
        supabase.table("incidents")
        .select("id, title, description")
        .eq("id", incident_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )

    incident = result.data
    classifier = get_classifier()
    classification = classifier.classify(
        title=incident.get("title") or "",
        description=incident.get("description") or "",
    )

    supabase.table("incidents").update(
        {
            "classification": classification["mapped_type"],
            "confidence": classification["confidence"],
        }
    ).eq("id", incident_id).execute()

    supabase.table("classifications").insert(
        {
            "incident_id": incident_id,
            "raw_description": (incident.get("description") or "")[:2000],
            "gemini_label": classification["label"],
            "gemini_confidence": classification["confidence"],
            "gemini_response_raw": {"raw": classification["raw_response"]},
            "mapped_type": classification["mapped_type"],
            "reasoning": classification["reasoning"],
        }
    ).execute()

    return ClassifyResponse(
        label=classification["label"],
        mapped_type=classification["mapped_type"],
        confidence=classification["confidence"],
        reasoning=classification["reasoning"],
    )
