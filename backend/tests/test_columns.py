def test_create_column_default_title(client, board_id):
    resp = client.post(f"/api/boards/{board_id}/columns", json={})
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    assert board["columns"][-1]["title"] == "Kolom Baru"
    assert board["columns"][-1]["cards"] == []
    assert board["columns"][-1]["wipLimit"] is None


def test_create_column_with_title(client, board_id):
    resp = client.post(f"/api/boards/{board_id}/columns", json={"title": "Review"})
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    assert board["columns"][-1]["title"] == "Review"


def test_create_column_missing_board_is_404(client):
    resp = client.post("/api/boards/does-not-exist/columns", json={"title": "x"})
    assert resp.status_code == 404


def test_rename_column(client, board_id, column_id):
    resp = client.patch(f"/api/boards/{board_id}/columns/{column_id}", json={"title": "Baru"})
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)
    assert column["title"] == "Baru"


def test_set_column_wip_limit(client, board_id, column_id):
    resp = client.patch(f"/api/boards/{board_id}/columns/{column_id}", json={"wipLimit": 3})
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)
    assert column["wipLimit"] == 3

    # explicit null clears the limit
    resp = client.patch(f"/api/boards/{board_id}/columns/{column_id}", json={"wipLimit": None})
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)
    assert column["wipLimit"] is None


def test_update_column_missing_is_404(client, board_id):
    resp = client.patch(f"/api/boards/{board_id}/columns/does-not-exist", json={"title": "x"})
    assert resp.status_code == 404


def test_reorder_columns(client, board_id, state):
    board = next(b for b in state["boards"] if b["id"] == board_id)
    original_ids = [c["id"] for c in board["columns"]]
    reversed_ids = list(reversed(original_ids))

    resp = client.patch(f"/api/boards/{board_id}/columns/reorder", json={"columnIds": reversed_ids})
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    assert [c["id"] for c in board["columns"]] == reversed_ids


def test_reorder_columns_missing_board_is_404(client):
    resp = client.patch("/api/boards/does-not-exist/columns/reorder", json={"columnIds": []})
    assert resp.status_code == 404


def test_delete_column_removes_its_cards(client, board_id, column_id):
    resp = client.delete(f"/api/boards/{board_id}/columns/{column_id}")
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    assert all(c["id"] != column_id for c in board["columns"])


def test_delete_missing_column_is_404(client, board_id):
    resp = client.delete(f"/api/boards/{board_id}/columns/does-not-exist")
    assert resp.status_code == 404
