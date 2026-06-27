import math

import numpy as np

EARTH_RADIUS_M = 6_371_000.0

INCIDENT_TYPE_SEVERITY: dict[str, int] = {
    "assault": 4,
    "robbery": 3,
    "harassment": 2,
    "theft": 1,
    "vandalism": 1,
    "suspicious_activity": 1,
    "other": 1,
}


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_M * c


def haversine_batch(
    center_lat: float, center_lng: float, points: np.ndarray
) -> np.ndarray:
    dlat = np.radians(points[:, 0] - center_lat)
    dlng = np.radians(points[:, 1] - center_lng)
    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(np.radians(center_lat))
        * np.cos(np.radians(points[:, 0]))
        * np.sin(dlng / 2) ** 2
    )
    c = 2 * np.arcsin(np.sqrt(a))
    return EARTH_RADIUS_M * c


def meters_per_degree_lat(_lat: float) -> float:
    return 111_320.0


def meters_per_degree_lng(lat: float) -> float:
    return 111_320.0 * math.cos(math.radians(lat))


def compute_cluster_radius(
    center_lat: float, center_lng: float, points: np.ndarray
) -> float:
    if len(points) < 2:
        return 0.0
    distances = haversine_batch(center_lat, center_lng, points)
    return float(distances.max())


def get_type_severity(incident_type: str) -> int:
    return INCIDENT_TYPE_SEVERITY.get(incident_type, 1)


def compute_cluster_severity(incident_types: list[str]) -> float:
    if not incident_types:
        return 0.0
    severities = [INCIDENT_TYPE_SEVERITY.get(t, 1) for t in incident_types]
    return sum(severities) / len(severities)


def determine_risk_level(point_count: int, max_type_severity: int) -> str:
    if point_count < 1:
        return "low"

    if point_count >= 15:
        base = "high"
    elif point_count >= 6:
        base = "moderate"
    else:
        base = "low"

    if max_type_severity >= 4 and base != "low":
        return "critical"
    if base == "moderate" and max_type_severity >= 3:
        return "high"
    if base == "low" and max_type_severity >= 3:
        return "moderate"

    return base


def compute_convex_hull(points: np.ndarray) -> list[list[float]] | None:
    if len(points) < 3:
        return None

    from scipy.spatial import ConvexHull

    try:
        hull = ConvexHull(points)
        return [[float(points[v, 0]), float(points[v, 1])] for v in hull.vertices]
    except Exception:
        return None
