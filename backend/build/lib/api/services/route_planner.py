import logging
from typing import Optional

import httpx
from supabase import Client

from api.config import get_settings
from api.utils.geo import haversine

logger = logging.getLogger(__name__)
settings = get_settings()


def get_safe_route(
    supabase: Client,
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    prefer_safety: bool = True,
) -> dict:
    alternatives = []

    try:
        route = _fetch_osrm_route(origin_lat, origin_lng, dest_lat, dest_lng)
        if not route:
            raise ValueError("No route returned from OSRM")
    except Exception as e:
        logger.warning("OSRM routing failed: %s. Falling back to straight-line.", e)
        return {
            "route_geometry": {
                "type": "LineString",
                "coordinates": [[origin_lng, origin_lat], [dest_lng, dest_lat]],
            },
            "safety_score": 50.0,
            "distance_meters": haversine(origin_lat, origin_lng, dest_lat, dest_lng),
            "estimated_time_secs": int(
                haversine(origin_lat, origin_lng, dest_lat, dest_lng) / 1.4
            ),
            "alternative_routes": [],
        }

    coordinates = route["geometry"]["coordinates"]
    distance = route["distance"]
    duration = route["duration"]

    risk_scores = _fetch_risk_scores(supabase)

    segment_scores = []
    for i in range(len(coordinates) - 1):
        seg_lat = (coordinates[i][1] + coordinates[i + 1][1]) / 2
        seg_lng = (coordinates[i][0] + coordinates[i + 1][0]) / 2
        seg_score = _score_point(seg_lat, seg_lng, risk_scores)
        segment_scores.append(seg_score)

    avg_safety = (sum(segment_scores) / len(segment_scores)) if segment_scores else 50.0
    safety_score = 100.0 - avg_safety
    safety_score = max(0.0, min(100.0, safety_score))

    if prefer_safety and len(alternatives) > 0:
        alternatives.sort(key=lambda a: a["safety_score"], reverse=True)
        best = alternatives[0]
        if best["safety_score"] > safety_score + 5:
            return {
                "route_geometry": best["route_geometry"],
                "safety_score": best["safety_score"],
                "distance_meters": best["distance"],
                "estimated_time_secs": best["duration"],
                "alternative_routes": [
                    {
                        "safety_score": safety_score,
                        "distance_meters": distance,
                        "estimated_time_secs": duration,
                    }
                ],
            }

    return {
        "route_geometry": {
            "type": "LineString",
            "coordinates": coordinates,
        },
        "safety_score": round(safety_score, 1),
        "distance_meters": distance,
        "estimated_time_secs": duration,
        "alternative_routes": alternatives,
    }


def _fetch_osrm_route(
    origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float
) -> Optional[dict]:
    url = (
        f"{settings.osrm_base_url}/route/v1/foot/"
        f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
        "?overview=full&geometries=geojson&steps=false&alternatives=true"
    )

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url)
        resp.raise_for_status()
        data = resp.json()

    if data["code"] != "Ok" or not data["routes"]:
        return None

    main_route = data["routes"][0]
    alternatives = data["routes"][1:] if len(data["routes"]) > 1 else []

    return {
        "geometry": main_route["geometry"],
        "distance": main_route["distance"],
        "duration": main_route["duration"],
        "alternatives": [
            {
                "route_geometry": a["geometry"],
                "safety_score": 0.0,
                "distance": a["distance"],
                "duration": a["duration"],
            }
            for a in alternatives
        ],
    }


def _fetch_risk_scores(supabase: Client) -> list[dict]:
    result = (
        supabase.table("risk_scores")
        .select("lat, lng, score")
        .gt("expires_at", "now()")
        .execute()
    )
    return result.data or []


def _score_point(lat: float, lng: float, risk_scores: list[dict]) -> float:
    if not risk_scores:
        return 25.0

    min_dist = float("inf")
    nearest_score = 25.0

    for rs in risk_scores:
        dist = haversine(lat, lng, rs["lat"], rs["lng"])
        if dist < min_dist:
            min_dist = dist
            nearest_score = rs["score"]

    if min_dist < 100:
        return nearest_score
    elif min_dist < 300:
        return nearest_score * 0.7
    else:
        return nearest_score * 0.3
