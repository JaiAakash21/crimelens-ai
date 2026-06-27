"""
DBSCAN Hotspot Detection Service
=================================
Input:  latitude, longitude, incident_type, severity (derived)
Output: cluster_id, point_count, risk_level, geometry

Risk Level Thresholds:
  1-5  incidents -> Low
  6-15 incidents -> Moderate
  15+  incidents -> High
  Severity escalation: type severity >= 4 upgrades Low->Moderate, Moderate->High, High->Critical

Usage:
    from api.services.hotspot_detector import detect_hotspots
    count = detect_hotspots(supabase_client)
"""

import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone

import numpy as np
from sklearn.cluster import DBSCAN
from supabase import Client

from api.config import get_settings
from api.utils.geo import (
    haversine_batch,
    meters_per_degree_lat,
    compute_cluster_severity,
    determine_risk_level,
    get_type_severity,
    compute_convex_hull,
)

logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Data contract
# ---------------------------------------------------------------------------


@dataclass
class IncidentRecord:
    id: str
    latitude: float
    longitude: float
    incident_type: str
    severity: int

    @classmethod
    def from_db_row(cls, row: dict) -> "IncidentRecord":
        return cls(
            id=row["id"],
            latitude=float(row["lat"]),
            longitude=float(row["lng"]),
            incident_type=row.get("incident_type", "other"),
            severity=get_type_severity(row.get("incident_type", "other")),
        )


@dataclass
class ClusterResult:
    cluster_id: int
    center_lat: float
    center_lng: float
    radius_meters: float
    point_count: int
    incident_ids: list[str]
    incident_types: list[str]
    avg_severity: float
    max_severity: int
    risk_level: str
    geometry_geojson: dict | None = None


# ---------------------------------------------------------------------------
# Core detection logic
# ---------------------------------------------------------------------------


def _load_incidents(supabase: Client) -> list[IncidentRecord]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.hotspot_incident_days)

    result = (
        supabase.table("incidents")
        .select("id, lat, lng, incident_type")
        .neq("status", "dismissed")
        .gte("created_at", cutoff.isoformat())
        .execute()
    )
    return [IncidentRecord.from_db_row(r) for r in (result.data or [])]


def _run_dbscan(
    records: list[IncidentRecord],
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    coords = np.array([[r.latitude, r.longitude] for r in records])
    ids = np.array([r.id for r in records])
    types = [r.incident_type for r in records]

    if len(records) < settings.hotspot_min_samples:
        return np.array([]), ids, types

    lat_scale = meters_per_degree_lat(float(np.mean(coords[:, 0])))
    eps_degrees = settings.hotspot_eps_meters / lat_scale

    clustering = DBSCAN(
        eps=eps_degrees,
        min_samples=settings.hotspot_min_samples,
        metric="haversine",
    )
    clustering.fit(np.radians(coords))

    return clustering.labels_, ids, types


def _build_clusters(
    labels: np.ndarray,
    records: list[IncidentRecord],
    types: list[str],
) -> list[ClusterResult]:
    unique_labels = set(labels)
    unique_labels.discard(-1)

    coords = np.array([[r.latitude, r.longitude] for r in records])
    ids = [r.id for r in records]

    clusters: list[ClusterResult] = []

    for label in sorted(unique_labels):
        mask = labels == label
        cluster_points = coords[mask]
        cluster_ids = [ids[i] for i in range(len(ids)) if labels[i] == label]
        cluster_types = [types[i] for i in range(len(ids)) if labels[i] == label]
        unique_types = list(set(cluster_types))

        center = cluster_points.mean(axis=0)
        center_lat = float(center[0])
        center_lng = float(center[1])

        radius = float(haversine_batch(center_lat, center_lng, cluster_points).max())
        point_count = len(cluster_points)
        avg_severity = compute_cluster_severity(cluster_types)
        max_severity = max(get_type_severity(t) for t in unique_types)
        risk_level = determine_risk_level(point_count, max_severity)

        hull = compute_convex_hull(cluster_points)
        geometry = (
            {"type": "Polygon", "coordinates": [hull + [hull[0]]]} if hull else None
        )

        clusters.append(
            ClusterResult(
                cluster_id=int(label),
                center_lat=center_lat,
                center_lng=center_lng,
                radius_meters=radius,
                point_count=point_count,
                incident_ids=cluster_ids,
                incident_types=unique_types,
                avg_severity=avg_severity,
                max_severity=max_severity,
                risk_level=risk_level,
                geometry_geojson=geometry,
            )
        )

    return clusters


# ---------------------------------------------------------------------------
# Database persistence
# ---------------------------------------------------------------------------


def _persist_clusters(supabase: Client, clusters: list[ClusterResult]) -> None:
    supabase.table("hotspots").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()

    for cluster in clusters:
        supabase.table("hotspots").insert(
            {
                "cluster_id": cluster.cluster_id,
                "center_lat": cluster.center_lat,
                "center_lng": cluster.center_lng,
                "radius_meters": cluster.radius_meters,
                "point_count": cluster.point_count,
                "incident_types": cluster.incident_types,
                "risk_level": cluster.risk_level,
                "geometry_geojson": cluster.geometry_geojson,
            }
        ).execute()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def detect_hotspots(supabase: Client) -> int:
    records = _load_incidents(supabase)

    if len(records) < settings.hotspot_min_samples:
        logger.info(
            "Insufficient incidents for DBSCAN: %d (minimum %d)",
            len(records),
            settings.hotspot_min_samples,
        )
        return 0

    labels, ids, types = _run_dbscan(records)
    clusters = _build_clusters(labels, records, types)

    _persist_clusters(supabase, clusters)

    logger.info(
        "DBSCAN complete: %d clusters from %d incidents (%.1f%% clustered)",
        len(clusters),
        len(records),
        (sum(c.point_count for c in clusters) / len(records)) * 100 if records else 0,
    )
    return len(clusters)


def detect_hotspots_dry_run(supabase: Client) -> list[dict]:
    records = _load_incidents(supabase)

    if len(records) < settings.hotspot_min_samples:
        return []

    labels, ids, types = _run_dbscan(records)
    clusters = _build_clusters(labels, records, types)

    return [asdict(c) for c in clusters]
