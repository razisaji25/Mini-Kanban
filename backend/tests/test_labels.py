def test_create_label(client):
    resp = client.post("/api/labels", json={"name": "Mendesak", "color": "#ff0000"})
    assert resp.status_code == 200
    label = resp.json()["labels"][-1]
    assert label["name"] == "Mendesak"
    assert label["color"] == "#ff0000"


def test_delete_label_removes_it_from_cards(client, board_id, column_id, card_id, label_id):
    client.patch(f"/api/boards/{board_id}/cards/{card_id}", json={"labelIds": [label_id]})

    resp = client.delete(f"/api/labels/{label_id}")
    assert resp.status_code == 200
    body = resp.json()

    assert all(l["id"] != label_id for l in body["labels"])
    board = next(b for b in body["boards"] if b["id"] == board_id)
    column = next(c for c in board["columns"] if c["id"] == column_id)
    card = next(c for c in column["cards"] if c["id"] == card_id)
    assert label_id not in card["labelIds"]


def test_delete_missing_label_is_404(client):
    resp = client.delete("/api/labels/does-not-exist")
    assert resp.status_code == 404
