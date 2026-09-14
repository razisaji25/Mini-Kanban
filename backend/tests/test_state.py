def test_get_state_returns_seeded_app_state(client):
    resp = client.get("/api/state")
    assert resp.status_code == 200
    body = resp.json()

    assert body["version"] == 1
    assert body["activeBoardId"] is not None
    assert body["settings"] == {"theme": "auto", "accent": "hangat", "lastExportAt": None}
    assert len(body["labels"]) == 2
    assert len(body["boards"]) == 1

    board = body["boards"][0]
    assert board["id"] == body["activeBoardId"]
    assert board["title"] == "Papan Pertama"
    assert [c["title"] for c in board["columns"]] == ["Rencana", "Dikerjakan", "Selesai"]
    assert len(board["columns"][0]["cards"]) == 1
    assert len(board["columns"][1]["cards"]) == 0
