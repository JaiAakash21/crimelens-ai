import logging
import uuid
from pathlib import Path

from storage3.types import FileOptions
from supabase import Client

from api.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def upload_incident_image(
    supabase: Client,
    incident_id: str,
    contents: bytes,
    filename: str,
    mime_type: str,
) -> dict:
    ext = Path(filename).suffix or ".jpg"
    object_path = f"incidents/{incident_id}/{uuid.uuid4()}{ext}"

    bucket = supabase.storage.from_(settings.storage_bucket)

    try:
        upload_response = bucket.upload(
            path=object_path,
            file=contents,
            file_options=FileOptions({"content-type": mime_type}),
        )
        logger.debug(
            "Storage upload OK: status=%s, path=%s",
            upload_response.status_code,
            object_path,
        )
    except Exception as e:
        logger.exception("Supabase Storage upload failed for path=%s", object_path)
        raise RuntimeError(f"Storage upload failed for {object_path}: {e}") from e

    try:
        public_url = bucket.get_public_url(object_path)
    except Exception as e:
        logger.exception("Failed to get public URL for path=%s", object_path)
        raise RuntimeError(f"Failed to get public URL for {object_path}: {e}") from e

    try:
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
    except Exception as e:
        logger.exception(
            "DB insert failed for incident_image, cleaning up storage path=%s",
            object_path,
        )
        try:
            bucket.remove([object_path])
        except Exception as cleanup_err:
            logger.warning(
                "Cleanup of orphaned storage object %s failed: %s",
                object_path,
                cleanup_err,
            )
        raise RuntimeError(f"Database insert failed for incident image: {e}") from e

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
