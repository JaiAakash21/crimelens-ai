from unittest.mock import Mock, patch


def test_classify_single(client, auth_header):
    with patch("api.routers.classify.get_classifier") as mock_get:
        classifier = Mock()
        classifier.classify.return_value = {
            "label": "theft",
            "mapped_type": "theft",
            "confidence": 0.95,
            "reasoning": "Describes theft of phone",
            "raw_response": '{"label": "theft", "confidence": 0.95, "reasoning": "Describes theft of phone"}',
        }
        mock_get.return_value = classifier

        response = client.post(
            "/api/v1/classify",
            json={
                "title": "Phone stolen",
                "description": "Someone stole my phone from the table",
            },
            headers=auth_header,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["label"] == "theft"
        assert data["mapped_type"] == "theft"
        assert data["confidence"] == 0.95
        assert "reasoning" in data


def test_classify_single_low_confidence(client, auth_header):
    with patch("api.routers.classify.get_classifier") as mock_get:
        classifier = Mock()
        classifier.classify.return_value = {
            "label": "other",
            "mapped_type": "other",
            "confidence": 0.15,
            "reasoning": "Description is too vague",
            "raw_response": "",
        }
        mock_get.return_value = classifier

        response = client.post(
            "/api/v1/classify",
            json={
                "title": "Something happened",
                "description": "I saw something unusual but I am not sure what it was",
            },
            headers=auth_header,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["label"] == "other"
        assert data["mapped_type"] == "other"
        assert data["confidence"] == 0.15


def test_classify_batch(client, auth_header):
    with patch("api.routers.classify.get_classifier") as mock_get:
        classifier = Mock()
        classifier.classify_batch.return_value = [
            {
                "label": "theft",
                "mapped_type": "theft",
                "confidence": 0.95,
                "reasoning": "Phone theft",
                "raw_response": "",
            },
            {
                "label": "assault",
                "mapped_type": "assault",
                "confidence": 0.98,
                "reasoning": "Physical attack",
                "raw_response": "",
            },
        ]
        mock_get.return_value = classifier

        response = client.post(
            "/api/v1/classify/batch",
            json={
                "items": [
                    {"title": "Phone stolen", "description": "Someone stole my phone"},
                    {
                        "title": "Fight",
                        "description": "Two people were fighting on the street",
                    },
                ]
            },
            headers=auth_header,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 2
        assert data["results"][0]["label"] == "theft"
        assert data["results"][1]["label"] == "assault"


def test_classify_batch_validation_error(client, auth_header):
    response = client.post(
        "/api/v1/classify/batch",
        json={"items": []},
        headers=auth_header,
    )
    assert response.status_code == 422


def test_reclassify_incident_success(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "id": "inc-1",
        "title": "Phone stolen",
        "description": "Someone stole my phone from the table",
    }

    with patch("api.routers.classify.get_classifier") as mock_get:
        classifier = Mock()
        classifier.classify.return_value = {
            "label": "theft",
            "mapped_type": "theft",
            "confidence": 0.95,
            "reasoning": "Describes theft of phone",
            "raw_response": '{"label": "theft", "confidence": 0.95, "reasoning": "Describes theft of phone"}',
        }
        mock_get.return_value = classifier

        response = client.post(
            "/api/v1/classify/incident/inc-1",
            headers=auth_header,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["label"] == "theft"
        assert data["mapped_type"] == "theft"
        assert data["confidence"] == 0.95


def test_reclassify_incident_not_found(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

    response = client.post(
        "/api/v1/classify/incident/nonexistent",
        headers=auth_header,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Incident not found"


def test_reclassify_persists_to_db(client, mock_supabase, auth_header):
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "id": "inc-1",
        "title": "Phone stolen",
        "description": "Someone stole my phone from the table",
    }

    with patch("api.routers.classify.get_classifier") as mock_get:
        classifier = Mock()
        classifier.classify.return_value = {
            "label": "theft",
            "mapped_type": "theft",
            "confidence": 0.95,
            "reasoning": "Describes theft of phone",
            "raw_response": '{"label": "theft", "confidence": 0.95, "reasoning": "Describes theft of phone"}',
        }
        mock_get.return_value = classifier

        client.post(
            "/api/v1/classify/incident/inc-1",
            headers=auth_header,
        )

        mock_supabase.table.assert_any_call("incidents")
        mock_supabase.table.assert_any_call("classifications")
