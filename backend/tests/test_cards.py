def test_create_card_defaults(client, board_id, column_id):
    resp = client.post(f"/api/boards/{board_id}/columns/{column_id}/cards", json={"title": "Tugas baru"})
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)
    card = column["cards"][-1]

    assert card["title"] == "Tugas baru"
    assert card["notes"] == ""
    assert card["labelIds"] == []
    assert card["dueDate"] is None
    assert card["checklist"] == []
    assert card["archived"] is False


def test_create_card_missing_column_is_404(client, board_id):
    resp = client.post(f"/api/boards/{board_id}/columns/does-not-exist/cards", json={"title": "x"})
    assert resp.status_code == 404


def test_update_card_partial_fields(client, board_id, card_id, label_id):
    resp = client.patch(
        f"/api/boards/{board_id}/cards/{card_id}",
        json={
            "title": "Judul diedit",
            "notes": "catatan baru",
            "labelIds": [label_id],
            "dueDate": "2026-12-31",
            "checklist": [{"id": "ck1", "text": "langkah 1", "done": True}],
        },
    )
    assert resp.status_code == 200
    card = _find_card(resp.json(), board_id, card_id)

    assert card["title"] == "Judul diedit"
    assert card["notes"] == "catatan baru"
    assert card["labelIds"] == [label_id]
    assert card["dueDate"] == "2026-12-31"
    assert card["checklist"] == [{"id": "ck1", "text": "langkah 1", "done": True}]


def test_update_card_missing_is_404(client, board_id):
    resp = client.patch(f"/api/boards/{board_id}/cards/does-not-exist", json={"title": "x"})
    assert resp.status_code == 404


def test_move_card_to_another_column(client, board_id, column_id, card_id, state):
    board = next(b for b in state["boards"] if b["id"] == board_id)
    target_column_id = board["columns"][1]["id"]

    resp = client.post(
        f"/api/boards/{board_id}/cards/{card_id}/move",
        json={"toColumnId": target_column_id, "toIndex": 0},
    )
    assert resp.status_code == 200
    body = resp.json()
    board = next(b for b in body["boards"] if b["id"] == board_id)
    target = next(c for c in board["columns"] if c["id"] == target_column_id)
    origin = next(c for c in board["columns"] if c["id"] == column_id)

    assert card_id in [c["id"] for c in target["cards"]]
    assert card_id not in [c["id"] for c in origin["cards"]]


def test_move_card_clamps_out_of_range_index(client, board_id, card_id, state):
    board = next(b for b in state["boards"] if b["id"] == board_id)
    target_column_id = board["columns"][1]["id"]

    resp = client.post(
        f"/api/boards/{board_id}/cards/{card_id}/move",
        json={"toColumnId": target_column_id, "toIndex": 999},
    )
    assert resp.status_code == 200
    body = resp.json()
    board = next(b for b in body["boards"] if b["id"] == board_id)
    target = next(c for c in board["columns"] if c["id"] == target_column_id)
    assert target["cards"][-1]["id"] == card_id


def test_move_card_missing_target_column_is_404(client, board_id, card_id):
    resp = client.post(
        f"/api/boards/{board_id}/cards/{card_id}/move",
        json={"toColumnId": "does-not-exist", "toIndex": 0},
    )
    assert resp.status_code == 404


def test_duplicate_card(client, board_id, column_id, card_id, state):
    resp = client.post(f"/api/boards/{board_id}/cards/{card_id}/duplicate")
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)

    assert len(column["cards"]) == 2
    original = next(c for c in column["cards"] if c["id"] == card_id)
    duplicate = next(c for c in column["cards"] if c["id"] != card_id)
    assert duplicate["title"] == f"{original['title']} (salinan)"
    assert duplicate["id"] != card_id


def test_duplicate_missing_card_is_404(client, board_id):
    resp = client.post(f"/api/boards/{board_id}/cards/does-not-exist/duplicate")
    assert resp.status_code == 404


def test_archive_and_unarchive_card(client, board_id, card_id):
    resp = client.post(f"/api/boards/{board_id}/cards/{card_id}/archive", json={"archived": True})
    assert _find_card(resp.json(), board_id, card_id)["archived"] is True

    resp = client.post(f"/api/boards/{board_id}/cards/{card_id}/archive", json={"archived": False})
    assert _find_card(resp.json(), board_id, card_id)["archived"] is False


def test_archive_missing_card_is_404(client, board_id):
    resp = client.post(f"/api/boards/{board_id}/cards/does-not-exist/archive", json={"archived": True})
    assert resp.status_code == 404


def test_delete_card(client, board_id, column_id, card_id):
    resp = client.delete(f"/api/boards/{board_id}/cards/{card_id}")
    assert resp.status_code == 200
    board = next(b for b in resp.json()["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)
    assert all(c["id"] != card_id for c in column["cards"])


def test_delete_missing_card_is_404(client, board_id):
    resp = client.delete(f"/api/boards/{board_id}/cards/does-not-exist")
    assert resp.status_code == 404


def _find_card(body, board_id, card_id):
    board = next(b for b in body["boards"] if b["id"] == board_id)
    for column in board["columns"]:
        for card in column["cards"]:
            if card["id"] == card_id:
                return card
    raise AssertionError(f"card {card_id} not found")
