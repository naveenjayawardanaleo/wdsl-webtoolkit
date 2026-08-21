"""TC 1: Authentication & Registration"""


def test_1_1_invalid_email_rejected(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "longenough1", "role": "client"},
    )
    assert resp.status_code == 400
    assert "email" in resp.get_json()["error"].lower()


def test_1_2_short_password_rejected(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "someone@example.com", "password": "short", "role": "client"},
    )
    assert resp.status_code == 400
    assert "password" in resp.get_json()["error"].lower()


def test_1_3_duplicate_registration_rejected(client):
    payload = {"email": "dup@example.com", "password": "longenough1", "role": "client"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 409


def test_1_4_valid_login_returns_role_correctly(client):
    client.post(
        "/api/auth/register",
        json={"email": "role-check@example.com", "password": "longenough1", "role": "developer"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "role-check@example.com", "password": "longenough1"},
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert "token" in body
    assert body["user"]["role"] == "developer"


def test_1_5_invalid_credentials_show_error(client):
    client.post(
        "/api/auth/register",
        json={"email": "wrongpw@example.com", "password": "correctpass1", "role": "client"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "wrongpw@example.com", "password": "totally-wrong"},
    )
    assert resp.status_code == 401
    assert "error" in resp.get_json()
