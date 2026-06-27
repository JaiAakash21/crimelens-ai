import logging
from datetime import datetime, timedelta

from supabase import Client

from api.config import get_settings
from api.utils.geo import haversine

logger = logging.getLogger(__name__)
settings = get_settings()


TYPE_SEVERITY = {
    "assault": 1.0,
    "robbery": 0.9,
    "harassment": 0.7,
    "theft": 0.5,
    "vandalism": 0.4,
    "suspicious_activity": 0.3,
    "other": 0.2,
}

MAX_INCIDENT_RADIUS = 500.0
MAX_HOTSPOT_RADIUS = 1000.0
RECENCY_DAYS_CUTOFF = 30


def _compute_cell_score(
    cell_lat: float,
    cell_lng: float,
    incidents: list[dict],
    hotspots: list[dict],
    now: datetime,
) -> dict:
    density_weight = 0.0
    recency_weight = 0.0
    severity_weight = 0.0

    for inc in incidents:
        dist = haversine(cell_lat, cell_lng, inc["lat"], inc["lng"])
        if dist > MAX_INCIDENT_RADIUS:
            continue

        proximity = 1.0 - (dist / MAX_INCIDENT_RADIUS)
        density_weight += proximity

        hours_ago = (
            now - datetime.fromisoformat(inc["occurred_at"])
        ).total_seconds() / 3600
        recency = max(0.0, 1.0 - (hours_ago / (RECENCY_DAYS_CUTOFF * 24)))
        recency_weight += recency * proximity

        severity = TYPE_SEVERITY.get(
            inc.get("classification") or inc["incident_type"], 0.2
        )
        severity_weight += severity * proximity

    hotspot_proximity = 0.0
    for hs in hotspots:
        dist = haversine(cell_lat, cell_lng, hs["center_lat"], hs["center_lng"])
        if dist > MAX_HOTSPOT_RADIUS:
            continue
        hotspot_proximity += 1.0 - (dist / MAX_HOTSPOT_RADIUS)

    if hotspot_proximity > 2.0:
        hotspot_proximity = 2.0

    density_norm = min(1.0, density_weight / 10.0)
    recency_norm = min(1.0, recency_weight / 10.0)
    severity_norm = min(1.0, severity_weight / 10.0)
    hotspot_norm = hotspot_proximity / 2.0

    score = (
        density_norm * 0.35
        + recency_norm * 0.25
        + severity_norm * 0.25
        + hotspot_norm * 0.15
    )

    raw_score = score * 100.0
    raw_score = max(0.0, min(100.0, raw_score))

    if raw_score >= 75:
        level = "critical"
    elif raw_score >= 50:
        level = "high"
    elif raw_score >= 25:
        level = "moderate"
    else:
        level = "low"

    return {
        "score": round(raw_score, 1),
        "level": level,
        "factors": {
            "incident_density": round(density_norm, 2),
            "recency_weight": round(recency_norm, 2),
            "severity_weight": round(severity_norm, 2),
            "proximity_to_hotspot": round(hotspot_norm, 2),
        },
    }


def refresh_risk_scores(supabase: Client) -> int:
    now = datetime.utcnow()
    cutoff = now - timedelta(days=settings.hotspot_incident_days)

    incidents_resp = (
        supabase.table("incidents")
        .select("lat, lng, incident_type, classification, occurred_at")
        .neq("status", "dismissed")
        .gte("occurred_at", cutoff.isoformat())
        .execute()
    )
    incidents = incidents_resp.data or []

    hotspots_resp = (
        supabase.table("hotspots")
        .select("center_lat, center_lng, risk_level")
        .execute()
    )
    hotspots = hotspots_resp.data or []

    city_bounds = _get_city_bounds(incidents)
    grid_cells = _generate_grid(city_bounds, step_degrees=0.005)

    supabase.table("risk_scores").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()

    written = 0
    for cell_lat, cell_lng in grid_cells:
        result = _compute_cell_score(cell_lat, cell_lng, incidents, hotspots, now)
        supabase.table("risk_scores").insert(
            {
                "lat": cell_lat,
                "lng": cell_lng,
                "score": result["score"],
                "level": result["level"],
                "factors": result["factors"],
                "expires_at": (
                    now + timedelta(minutes=settings.risk_score_ttl_minutes)
                ).isoformat(),
            }
        ).execute()
        written += 1

    logger.info("Computed %d risk scores", written)
    return written


def _get_city_bounds(incidents: list[dict]) -> dict:
    if not incidents:
        return {"min_lat": 12.90, "max_lat": 13.00, "min_lng": 77.50, "max_lng": 77.75}

    lats = [i["lat"] for i in incidents]
    lngs = [i["lng"] for i in incidents]
    margin = 0.02
    return {
        "min_lat": max(-90, min(lats) - margin),
        "max_lat": min(90, max(lats) + margin),
        "min_lng": max(-180, min(lngs) - margin),
        "max_lng": min(180, max(lngs) + margin),
    }


def _generate_grid(
    bounds: dict, step_degrees: float = 0.005
) -> list[tuple[float, float]]:
    cells = []
    lat = bounds["min_lat"]
    while lat <= bounds["max_lat"]:
        lng = bounds["min_lng"]
        while lng <= bounds["max_lng"]:
            cells.append((round(lat, 6), round(lng, 6)))
            lng += step_degrees
        lat += step_degrees
    return cells
