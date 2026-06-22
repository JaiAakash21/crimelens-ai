import uuid
from pathlib import Path
from typing import BinaryIO

from supabase import Client

from api.config import get_settings

settings = get_settings()


def upload_incident_image(
    supabase: Client,
    incident_id: str,
    file: BinaryIO,
    filename: str,
    mime_type: str,
) -> dict:
    ext = Path(filename).suffix or ".jpg"
    object_path = f"incidents/{incident_id}/{uuid.uuid4()}{ext}"

    supabase.storage.from_(settings.storage_bucket).upload(
        path=object_path,
        file=file,
        file_options={"content-type": mime_type},
    )

    public_url = supabase.storage.from_(settings.storage_bucket).get_public_url(
        object_path
    )

    result = (
        supabase.table("incident_images")
        .insert(
            {
                "incident_id": incident_id,
                "storage_path": object_path,
                "mime_type": mime_type,
            }
        )
        .execute()
    )

    return {
        "id": result.data[0]["id"],
        "storage_path": object_path,
        "url": public_url,
    }


def delete_incident_image(supabase: Client, image_id: str) -> None:
    image = (
        supabase.table("incident_images")
        .select("*")
        .eq("id", image_id)
        .single()
        .execute()
    )
    if not image.data:
        return

    supabase.storage.from_(settings.storage_bucket).remove([image.data["storage_path"]])

    supabase.table("incident_images").delete().eq("id", image_id).execute()


def get_image_url(supabase: Client, storage_path: str) -> str:
    return supabase.storage.from_(settings.storage_bucket).get_public_url(storage_path)
