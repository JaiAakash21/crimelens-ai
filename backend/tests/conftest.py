import os
from unittest.mock import Mock

os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["SUPABASE_SERVICE_KEY"] = "test-service-key"
os.environ["GEMINI_API_KEY"] = "test-gemini-key"

import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.dependencies import get_current_user, get_supabase_anon, get_supabase_service


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_supabase():
    db = Mock()

    db.table.return_value.select.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.order.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

    app.dependency_overrides[get_supabase_service] = lambda: db
    app.dependency_overrides[get_supabase_anon] = lambda: db

    yield db

    app.dependency_overrides.pop(get_supabase_service, None)
    app.dependency_overrides.pop(get_supabase_anon, None)


@pytest.fixture(autouse=True)
def mock_auth():
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "user-1",
        "email": "test@example.com",
    }
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def auth_header():
    return {"Authorization": "Bearer test-token"}
