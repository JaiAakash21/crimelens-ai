from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "CrimeLens AI"
    app_version: str = "1.0.0"
    debug: bool = False

    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    supabase_jwt_secret: str | None = None

    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"

    osrm_base_url: str = "https://router.project-osrm.org"

    storage_bucket: str = "incident-images"
    max_image_size_mb: int = 5
    allowed_image_types: list[str] = ["image/jpeg", "image/png", "image/webp"]

    cors_origins: list[str] = ["http://localhost:3000"]

    hotspot_min_samples: int = 3
    hotspot_eps_meters: float = 300.0
    hotspot_incident_days: int = 90

    risk_score_ttl_minutes: int = 60
    risk_grid_resolution: int = 9

    enable_rate_limiting: bool = True
    rate_limit_requests: int = 10
    rate_limit_window_seconds: int = 60

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
