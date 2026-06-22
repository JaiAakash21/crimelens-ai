from datetime import datetime, timedelta


from api.services.risk_engine import (
    _compute_cell_score,
    _get_city_bounds,
    _generate_grid,
)


def test_compute_cell_score_empty():
    now = datetime.utcnow()
    result = _compute_cell_score(12.97, 77.59, [], [], now)
    assert 0 <= result["score"] <= 100
    assert result["level"] in ("low", "moderate", "high", "critical")
    assert "factors" in result


def test_compute_cell_score_with_incidents():
    now = datetime.utcnow()
    incidents = [
        {
            "lat": 12.971,
            "lng": 77.593,
            "incident_type": "robbery",
            "classification": None,
            "occurred_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "lat": 12.972,
            "lng": 77.594,
            "incident_type": "assault",
            "classification": None,
            "occurred_at": (now - timedelta(hours=6)).isoformat(),
        },
        {
            "lat": 12.970,
            "lng": 77.592,
            "incident_type": "theft",
            "classification": None,
            "occurred_at": (now - timedelta(days=1)).isoformat(),
        },
    ]
    hotspots = []

    result = _compute_cell_score(12.971, 77.593, incidents, hotspots, now)
    assert result["score"] > 30
    assert result["level"] != "low"


def test_compute_cell_score_with_hotspot():
    now = datetime.utcnow()
    incidents = [
        {
            "lat": 12.971,
            "lng": 77.593,
            "incident_type": "theft",
            "classification": None,
            "occurred_at": (now - timedelta(days=5)).isoformat(),
        },
    ]
    hotspots = [
        {"center_lat": 12.972, "center_lng": 77.594, "risk_level": "high"},
    ]

    result = _compute_cell_score(12.971, 77.593, incidents, hotspots, now)
    assert result["factors"]["proximity_to_hotspot"] > 0


def test_compute_cell_score_far_away():
    now = datetime.utcnow()
    incidents = [
        {
            "lat": 13.100,
            "lng": 77.700,
            "incident_type": "theft",
            "classification": None,
            "occurred_at": (now - timedelta(days=30)).isoformat(),
        },
    ]
    hotspots = []

    result = _compute_cell_score(12.97, 77.59, incidents, hotspots, now)
    assert result["score"] < 20
    assert result["level"] == "low"


def test_get_city_bounds_empty():
    bounds = _get_city_bounds([])
    assert bounds["min_lat"] == 12.90
    assert bounds["max_lat"] == 13.00


def test_get_city_bounds_with_data():
    bounds = _get_city_bounds(
        [
            {"lat": 12.97, "lng": 77.59},
            {"lat": 12.93, "lng": 77.62},
            {"lat": 12.98, "lng": 77.64},
        ]
    )
    assert bounds["min_lat"] < 12.93
    assert bounds["max_lat"] > 12.98


def test_generate_grid():
    bounds = {"min_lat": 12.97, "max_lat": 12.98, "min_lng": 77.59, "max_lng": 77.60}
    cells = _generate_grid(bounds, step_degrees=0.005)
    assert len(cells) > 0
    for lat, lng in cells:
        assert 12.97 <= lat <= 12.98
        assert 77.59 <= lng <= 77.60
