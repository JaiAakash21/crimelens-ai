import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from supabase import Client

from api.config import get_settings
from api.dependencies import get_current_user, get_supabase_service

from api.models.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    IncidentListResponse,
    ImageUploadResponse,
)
from api.services.classifier import get_classifier
from api.services.storage import upload_incident_image
from api.utils.pagination import paginate

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    body: IncidentCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    user_id = current_user["id"]

    incident_data = body.model_dump()
    incident_data["user_id"] = user_id
    incident_data["occurred_at"] = incident_data["occurred_at"].isoformat()

    result = supabase.table("incidents").insert(incident_data).execute()
    incident = result.data[0]

    classifier = get_classifier()
    classification = classifier.classify(
        title=incident.get("title") or "",
        description=incident.get("description") or "",
    )

    if classification["mapped_type"]:
        supabase.table("incidents").update(
            {
                "classification": classification["mapped_type"],
                "confidence": classification["confidence"],
            }
        ).eq("id", incident["id"]).execute()
        incident["classification"] = classification["mapped_type"]
        incident["confidence"] = classification["confidence"]

    supabase.table("classifications").insert(
        {
            "incident_id": incident["id"],
            "raw_description": incident["description"][:2000],
            "gemini_label": classification["label"],
            "gemini_confidence": classification["confidence"],
            "gemini_response_raw": {"raw": classification["raw_response"]},
            "mapped_type": classification["mapped_type"],
        }
    ).execute()

    incident["images"] = []
    return incident


@router.get("", response_model=IncidentListResponse)
async def list_incidents(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    incident_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(
        default=None, description="Search by title or description"
    ),
    user_id: Optional[str] = Query(default=None, description="Filter by user ID"),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    radius: Optional[float] = Query(default=None, description="Radius in meters"),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    query = supabase.table("incidents").select("*", count="exact")

    if incident_type:
        query = query.eq("incident_type", incident_type)
    if status:
        query = query.eq("status", status)
    if search:
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
    if user_id:
        query = query.eq("user_id", user_id)

    query = query.order("created_at", desc=True)
    query = query.range((page - 1) * per_page, page * per_page - 1)

    result = query.execute()

    items = result.data or []
    total = result.count if hasattr(result, "count") else len(items)

    for item in items:
        images_resp = (
            supabase.table("incident_images")
            .select("*")
            .eq("incident_id", item["id"])
            .execute()
        )
        item["images"] = images_resp.data or []

    return {
        "items": items,
        **paginate(page, per_page, total),
    }


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    result = (
        supabase.table("incidents").select("*").eq("id", incident_id).single().execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )

    incident = result.data
    images_resp = (
        supabase.table("incident_images")
        .select("*")
        .eq("incident_id", incident_id)
        .execute()
    )
    incident["images"] = images_resp.data or []
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    body: IncidentUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("incidents")
        .update(updates)
        .eq("id", incident_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found or not owned by user",
        )

    incident = result.data[0]
    images_resp = (
        supabase.table("incident_images")
        .select("*")
        .eq("incident_id", incident_id)
        .execute()
    )
    incident["images"] = images_resp.data or []
    return incident


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(
    incident_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    result = (
        supabase.table("incidents")
        .delete()
        .eq("id", incident_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found or not owned by user",
        )


@router.post(
    "/{incident_id}/images",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    incident_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    incident = (
        supabase.table("incidents")
        .select("id, user_id")
        .eq("id", incident_id)
        .single()
        .execute()
    )
    if not incident.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )
    if incident.data["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your incident"
        )

    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400, detail="Only JPEG, PNG, and WebP images are allowed"
        )

    contents = await file.read()
    MAX_SIZE = settings.max_image_size_mb * 1024 * 1024
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large. Maximum size is {settings.max_image_size_mb}MB",
        )

    try:
        result = upload_incident_image(
            supabase=supabase,
            incident_id=incident_id,
            contents=contents,
            filename=file.filename or "image.jpg",
            mime_type=file.content_type or "image/jpeg",
        )
    except Exception as e:
        logger.exception("Image upload failed for incident %s", incident_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    return result


@router.delete(
    "/{incident_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_image(
    incident_id: str,
    image_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_service),
):
    incident = (
        supabase.table("incidents")
        .select("id, user_id")
        .eq("id", incident_id)
        .single()
        .execute()
    )
    if not incident.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )
    if incident.data["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your incident"
        )

    from api.services.storage import delete_incident_image as delete_image_service

    delete_image_service(supabase, image_id)
    return
