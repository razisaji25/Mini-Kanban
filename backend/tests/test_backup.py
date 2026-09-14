def test_export_matches_state(client, state):
    resp = client.get("/api/export")
    assert resp.status_code == 200
    assert resp.json() == state


def test_import_replace_discards_existing_data(client, state):
    incoming = {
        "version": 1,
        "activeBoardId": "b_custom",
        "settings": {"theme": "light", "accent": "biru", "lastExportAt": None},
        "labels": [],
        "boards": [
            {
                "id": "b_custom",
                "title": "Papan Impor",
                "createdAt": "2026-01-01T00:00:00Z",
                "columns": [],
            }
        ],
    }

    resp = client.post("/api/import", json={"data": incoming, "mode": "replace"})
    assert resp.status_code == 200
    body = resp.json()

    assert len(body["boards"]) == 1
    assert body["boards"][0]["title"] == "Papan Impor"
    assert body["activeBoardId"] == "b_custom"


def test_import_merge_keeps_existing_and_adds_new(client, state, board_id):
    incoming = {
        "version": 1,
        "activeBoardId": None,
        "settings": {"theme": "auto", "accent": "hangat", "lastExportAt": None},
        "labels": [{"id": "l_new", "name": "Baru", "color": "#000000"}],
        "boards": [
            {
                "id": "b_new",
                "title": "Papan Tambahan",
                "createdAt": "2026-01-01T00:00:00Z",
                "columns": [],
            }
        ],
    }

    resp = client.post("/api/import", json={"data": incoming, "mode": "merge"})
    assert resp.status_code == 200
    body = resp.json()

    board_ids = [b["id"] for b in body["boards"]]
    assert board_id in board_ids
    assert "b_new" in board_ids
    assert len(body["boards"]) == len(state["boards"]) + 1
    assert any(l["id"] == "l_new" for l in body["labels"])


def test_import_merge_does_not_overwrite_existing_ids(client, board_id):
    incoming = {
        "version": 1,
        "activeBoardId": None,
        "settings": {"theme": "auto", "accent": "hangat", "lastExportAt": None},
        "labels": [],
        "boards": [
            {
                "id": board_id,
                "title": "Judul Yang Seharusnya Diabaikan",
                "createdAt": "2026-01-01T00:00:00Z",
                "columns": [],
            }
        ],
    }

    resp = client.post("/api/import", json={"data": incoming, "mode": "merge"})
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    assert board["title"] != "Judul Yang Seharusnya Diabaikan"


def test_reset_reseeds_default_board(client, board_id):
    client.post("/api/boards", json={"title": "Akan Dihapus"})

    resp = client.post("/api/reset")
    assert resp.status_code == 200
    body = resp.json()

    assert len(body["boards"]) == 1
    assert body["boards"][0]["title"] == "Papan Pertama"
    assert body["boards"][0]["id"] != board_id
