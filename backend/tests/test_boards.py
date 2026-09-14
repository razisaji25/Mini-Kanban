def test_create_board_defaults_title_and_becomes_active(client, state):
    resp = client.post("/api/boards", json={})
    assert resp.status_code == 200
    body = resp.json()

    assert len(body["boards"]) == len(state["boards"]) + 1
    new_board = body["boards"][-1]
    assert new_board["title"] == "Papan Baru"
    assert new_board["columns"] == []
    assert body["activeBoardId"] == new_board["id"]


def test_create_board_with_title(client):
    resp = client.post("/api/boards", json={"title": "Proyek Sampingan"})
    assert resp.status_code == 200
    assert resp.json()["boards"][-1]["title"] == "Proyek Sampingan"


def test_rename_board(client, board_id):
    resp = client.patch(f"/api/boards/{board_id}", json={"title": "Nama Baru"})
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    assert board["title"] == "Nama Baru"


def test_rename_missing_board_is_404(client):
    resp = client.patch("/api/boards/does-not-exist", json={"title": "x"})
    assert resp.status_code == 404
    assert "message" in resp.json()


def test_delete_board_reassigns_active_board(client, board_id):
    other = client.post("/api/boards", json={"title": "Papan Lain"}).json()["boards"][-1]["id"]
    client.post(f"/api/boards/{board_id}/activate")

    resp = client.delete(f"/api/boards/{board_id}")
    assert resp.status_code == 200
    body = resp.json()

    assert all(b["id"] != board_id for b in body["boards"])
    assert body["activeBoardId"] == other


def test_delete_last_board_leaves_no_active_board(client, board_id):
    resp = client.delete(f"/api/boards/{board_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["boards"] == []
    assert body["activeBoardId"] is None


def test_delete_missing_board_is_404(client):
    resp = client.delete("/api/boards/does-not-exist")
    assert resp.status_code == 404


def test_activate_board(client, board_id):
    new_id = client.post("/api/boards", json={"title": "Kedua"}).json()["boards"][-1]["id"]

    resp = client.post(f"/api/boards/{board_id}/activate")
    assert resp.status_code == 200
    assert resp.json()["activeBoardId"] == board_id
    assert new_id  # sanity: second board really was created


def test_activate_missing_board_is_404(client):
    resp = client.post("/api/boards/does-not-exist/activate")
    assert resp.status_code == 404
