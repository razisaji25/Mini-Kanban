import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import store


@pytest.fixture(autouse=True)
def reset_store():
    """Every test starts from the same freshly seeded state."""
    store.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def state(client):
    return client.get("/api/state").json()


@pytest.fixture
def board_id(state):
    return state["activeBoardId"]


@pytest.fixture
def column_id(state, board_id):
    board = next(b for b in state["boards"] if b["id"] == board_id)
    return board["columns"][0]["id"]


@pytest.fixture
def card_id(state, board_id, column_id):
    board = next(b for b in state["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)
    return column["cards"][0]["id"]


@pytest.fixture
def label_id(state):
    return state["labels"][0]["id"]
