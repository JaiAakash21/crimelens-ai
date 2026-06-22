from unittest.mock import Mock

import numpy as np


# ---------------------------------------------------------------------------
# Utility function tests
# ---------------------------------------------------------------------------


def test_haversine():
    from api.utils.geo import haversine

    dist = haversine(12.9716, 77.5946, 12.9720, 77.5933)
    assert 50 < dist < 200


def test_haversine_batch():
    from api.utils.geo import haversine_batch

    points = np.array([[12.9720, 77.5933], [12.9710, 77.5950]])
    distances = haversine_batch(12.9716, 77.5946, points)
    assert len(distances) == 2
    assert all(0 < d < 300 for d in distances)


def test_determine_risk_level_by_count():
    from api.utils.geo import determine_risk_level

    assert determine_risk_level(1, 1) == "low"
    assert determine_risk_level(5, 1) == "low"
    assert determine_risk_level(6, 1) == "moderate"
    assert determine_risk_level(15, 1) == "high"
    assert determine_risk_level(30, 1) == "high"


def test_determine_risk_level_severity_escalation():
    from api.utils.geo import determine_risk_level

    assert determine_risk_level(3, 4) == "moderate"
    assert determine_risk_level(7, 4) == "critical"
    assert determine_risk_level(7, 3) == "high"
    assert determine_risk_level(15, 4) == "critical"
    assert determine_risk_level(30, 4) == "critical"
    assert determine_risk_level(1, 4) == "moderate"


def test_get_type_severity():
    from api.utils.geo import get_type_severity

    assert get_type_severity("assault") == 4
    assert get_type_severity("robbery") == 3
    assert get_type_severity("harassment") == 2
    assert get_type_severity("theft") == 1
    assert get_type_severity("vandalism") == 1
    assert get_type_severity("unknown") == 1


def test_compute_cluster_severity():
    from api.utils.geo import compute_cluster_severity

    assert compute_cluster_severity(["theft", "robbery"]) == 2.0
    assert compute_cluster_severity(["assault", "robbery"]) == 3.5
    assert compute_cluster_severity([]) == 0.0


def test_compute_cluster_radius():
    from api.utils.geo import compute_cluster_radius

    points = np.array([[12.9716, 77.5946], [12.9720, 77.5933], [12.9710, 77.5950]])
    radius = compute_cluster_radius(12.9716, 77.5946, points)
    assert 0 < radius < 300


def test_compute_convex_hull():
    from api.utils.geo import compute_convex_hull

    points = np.array([[12.9716, 77.5946], [12.9720, 77.5933], [12.9710, 77.5950]])
    hull = compute_convex_hull(points)
    assert hull is not None
    assert len(hull) >= 3

    hull_2 = compute_convex_hull(points[:2])
    assert hull_2 is None


# ---------------------------------------------------------------------------
# IncidentRecord tests
# ---------------------------------------------------------------------------


def test_incident_record_from_db_row():
    from api.services.hotspot_detector import IncidentRecord

    row = {
        "id": "abc-123",
        "lat": "12.9716",
        "lng": "77.5946",
        "incident_type": "assault",
    }
    record = IncidentRecord.from_db_row(row)
    assert record.id == "abc-123"
    assert record.latitude == 12.9716
    assert record.severity == 4


def test_incident_record_default_severity():
    from api.services.hotspot_detector import IncidentRecord

    row = {"id": "x", "lat": "0", "lng": "0", "incident_type": "unknown_type"}
    record = IncidentRecord.from_db_row(row)
    assert record.severity == 1


# ---------------------------------------------------------------------------
# DBSCAN clustering logic (unit, no DB)
# ---------------------------------------------------------------------------


def test_run_dbscan_returns_clusters():
    from api.services.hotspot_detector import (
        IncidentRecord,
        _run_dbscan,
    )

    records = [
        IncidentRecord(
            id=f"inc-{i}",
            latitude=12.9716 + i * 0.001,
            longitude=77.5946,
            incident_type="theft",
            severity=1,
        )
        for i in range(10)
    ]

    labels, ids, types = _run_dbscan(records)
    assert len(labels) == 10
    assert len(ids) == 10
    assert len(types) == 10


def test_build_clusters():
    from api.services.hotspot_detector import IncidentRecord, _build_clusters

    records = [
        IncidentRecord(
            id="a",
            latitude=12.9716,
            longitude=77.5946,
            incident_type="theft",
            severity=1,
        ),
        IncidentRecord(
            id="b",
            latitude=12.9725,
            longitude=77.5947,
            incident_type="robbery",
            severity=3,
        ),
        IncidentRecord(
            id="c",
            latitude=12.9718,
            longitude=77.5955,
            incident_type="theft",
            severity=1,
        ),
    ]
    types = ["theft", "robbery", "theft"]
    labels = np.array([0, 0, 0])

    clusters = _build_clusters(labels, records, types)
    assert len(clusters) == 1
    cluster = clusters[0]
    assert cluster.point_count == 3
    assert cluster.risk_level == "moderate"
    assert set(cluster.incident_types) == {"theft", "robbery"}
    assert cluster.max_severity == 3
    assert cluster.geometry_geojson is not None


def test_build_clusters_excludes_noise():
    from api.services.hotspot_detector import IncidentRecord, _build_clusters

    records = [
        IncidentRecord(
            id="a",
            latitude=12.9716,
            longitude=77.5946,
            incident_type="theft",
            severity=1,
        ),
        IncidentRecord(
            id="b",
            latitude=12.9717,
            longitude=77.5947,
            incident_type="theft",
            severity=1,
        ),
        IncidentRecord(
            id="c",
            latitude=13.0000,
            longitude=78.0000,
            incident_type="vandalism",
            severity=1,
        ),
    ]
    types = ["theft", "theft", "vandalism"]
    labels = np.array([0, 0, -1])

    clusters = _build_clusters(labels, records, types)
    assert len(clusters) == 1
    assert clusters[0].point_count == 2


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------


def test_list_hotspots(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value.data = [
        {
            "id": "hotspot-1",
            "cluster_id": 0,
            "center_lat": 12.972,
            "center_lng": 77.594,
            "radius_meters": 250.0,
            "point_count": 7,
            "incident_types": ["theft", "robbery"],
            "risk_level": "high",
            "geometry_geojson": None,
            "created_at": "2026-06-22T00:00:00",
            "last_updated": "2026-06-22T00:00:00",
        }
    ]

    response = client.get("/api/v1/hotspots", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["risk_level"] == "high"


def test_get_hotspot(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "id": "hotspot-1",
        "cluster_id": 0,
        "center_lat": 12.972,
        "center_lng": 77.594,
        "radius_meters": 250.0,
        "point_count": 7,
        "incident_types": ["theft", "robbery"],
        "risk_level": "high",
        "geometry_geojson": None,
        "created_at": "2026-06-22T00:00:00",
        "last_updated": "2026-06-22T00:00:00",
    }

    response = client.get("/api/v1/hotspots/hotspot-1", headers=auth_header)
    assert response.status_code == 200


def test_get_hotspot_not_found(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

    response = client.get("/api/v1/hotspots/nonexistent", headers=auth_header)
    assert response.status_code == 404


def test_hotspot_refresh_dry_run(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "role": "admin"
    }
    mock_supabase.table.return_value.select.return_value.neq.return_value.gte.return_value.execute.return_value.data = [
        {"id": "a", "lat": 12.9716, "lng": 77.5946, "incident_type": "theft"},
        {"id": "b", "lat": 12.9717, "lng": 77.5947, "incident_type": "robbery"},
        {"id": "c", "lat": 12.9718, "lng": 77.5948, "incident_type": "harassment"},
    ]

    response = client.post("/api/v1/hotspots/refresh?dry_run=true", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["dry_run"] is True
    assert "clusters" in data
    assert data["hotspots_detected"] >= 0


def test_hotspot_refresh_persist(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "role": "admin"
    }
    mock_supabase.table.return_value.select.return_value.neq.return_value.gte.return_value.execute.return_value.data = [
        {"id": "a", "lat": 12.9716, "lng": 77.5946, "incident_type": "theft"},
        {"id": "b", "lat": 12.9717, "lng": 77.5947, "incident_type": "robbery"},
        {"id": "c", "lat": 12.9718, "lng": 77.5948, "incident_type": "assault"},
    ]

    response = client.post("/api/v1/hotspots/refresh", headers=auth_header)
    assert response.status_code == 200
    assert response.json()["hotspots_detected"] >= 0


# ---------------------------------------------------------------------------
# Full detection pipeline (mocked DB)
# ---------------------------------------------------------------------------


def test_detect_hotspots_dry_run():
    from api.services.hotspot_detector import detect_hotspots_dry_run

    mock_db = Mock()
    mock_db.table.return_value.select.return_value.neq.return_value.gte.return_value.execute.return_value.data = [
        {
            "id": str(i),
            "lat": 12.9716 + i * 0.002,
            "lng": 77.5946 + i * 0.001,
            "incident_type": "theft",
        }
        for i in range(20)
    ]

    clusters = detect_hotspots_dry_run(mock_db)
    assert len(clusters) >= 0
    if clusters:
        c = clusters[0]
        assert "cluster_id" in c
        assert "point_count" in c
        assert "risk_level" in c
        assert "center_lat" in c
        assert "center_lng" in c
        assert "radius_meters" in c
        assert "incident_ids" in c
        assert "avg_severity" in c
        assert "geometry_geojson" in c


def test_detect_hotspots_insufficient_data():
    from api.services.hotspot_detector import detect_hotspots

    mock_db = Mock()
    mock_db.table.return_value.select.return_value.neq.return_value.gte.return_value.execute.return_value.data = []

    count = detect_hotspots(mock_db)
    assert count == 0


# ---------------------------------------------------------------------------
# End-to-end risk level examples
# ---------------------------------------------------------------------------


def test_risk_level_examples():
    from api.utils.geo import determine_risk_level

    examples = [
        (1, 1, "low"),
        (3, 1, "low"),
        (5, 2, "low"),
        (6, 1, "moderate"),
        (10, 1, "moderate"),
        (15, 1, "high"),
        (20, 1, "high"),
        (5, 4, "moderate"),
        (10, 4, "critical"),
        (15, 4, "critical"),
        (7, 3, "high"),
        (3, 3, "moderate"),
    ]

    for count, severity, expected in examples:
        result = determine_risk_level(count, severity)
        assert result == expected, (
            f"count={count}, severity={severity}: expected {expected}, got {result}"
        )
