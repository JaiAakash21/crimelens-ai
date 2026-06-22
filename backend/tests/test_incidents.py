from unittest.mock import Mock, patch



def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_create_incident(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "inc-1",
            "user_id": "user-1",
            "title": "Test incident",
            "description": "This is a test incident description for testing.",
            "incident_type": "theft",
            "status": "reported",
            "lat": 12.9716,
            "lng": 77.5946,
            "gps_accuracy": 5.0,
            "classification": None,
            "confidence": None,
            "occurred_at": "2026-06-22T10:00:00",
            "created_at": "2026-06-22T10:00:00",
            "updated_at": "2026-06-22T10:00:00",
        }
    ]

    with patch("api.routers.incidents.get_classifier") as mock_classifier:
        classifier = Mock()
        classifier.classify.return_value = {
            "label": "theft",
            "mapped_type": "theft",
            "confidence": 0.95,
            "reasoning": "Describes theft of phone",
            "raw_response": "",
        }
        mock_classifier.return_value = classifier

        response = client.post(
            "/api/v1/incidents",
            json={
                "title": "Test incident",
                "description": "This is a test incident description for testing.",
                "incident_type": "theft",
                "lat": 12.9716,
                "lng": 77.5946,
                "gps_accuracy": 5.0,
                "occurred_at": "2026-06-22T10:00:00",
            },
            headers=auth_header,
        )

        assert response.status_code == 201


def test_list_incidents(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.select.return_value.count = 0

    response = client.get("/api/v1/incidents?page=1&per_page=20", headers=auth_header)
    assert response.status_code == 200


def test_get_incident_not_found(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

    response = client.get("/api/v1/incidents/nonexistent", headers=auth_header)
    assert response.status_code == 404
