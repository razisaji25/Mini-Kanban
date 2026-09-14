def test_update_settings_theme_only(client, state):
    resp = client.patch("/api/settings", json={"theme": "dark"})
    assert resp.status_code == 200
    settings = resp.json()["settings"]
    assert settings["theme"] == "dark"
    assert settings["accent"] == state["settings"]["accent"]


def test_update_settings_accent_only(client, state):
    resp = client.patch("/api/settings", json={"accent": "hijau"})
    assert resp.status_code == 200
    settings = resp.json()["settings"]
    assert settings["accent"] == "hijau"
    assert settings["theme"] == state["settings"]["theme"]


def test_mark_exported_sets_timestamp(client):
    assert client.get("/api/state").json()["settings"]["lastExportAt"] is None

    resp = client.post("/api/settings/mark-exported")
    assert resp.status_code == 200
    assert resp.json()["settings"]["lastExportAt"] is not None
