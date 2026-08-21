"""TC 7: Subscriptions"""

import pytest

from wdsl.models import User


def _developer_user_id(app, email):
    with app.app_context():
        return User.query.filter_by(email=email).first().user_id


def test_7_1_admin_can_grant_subscription(app, client, admin_user, client_user):
    user_id = _developer_user_id(app, client_user["email"])
    resp = client.patch(
        f"/api/admin/users/{user_id}/subscription",
        json={"status": "active"},
        headers=admin_user["headers"],
    )
    assert resp.status_code == 200
    assert resp.get_json()["subscription_status"] == "active"


def test_7_2_admin_can_revoke_subscription(app, client, admin_user, developer):
    user_id = _developer_user_id(app, developer["email"])
    resp = client.patch(
        f"/api/admin/users/{user_id}/subscription",
        json={"status": "inactive"},
        headers=admin_user["headers"],
    )
    assert resp.status_code == 200
    assert resp.get_json()["subscription_status"] == "inactive"


def test_7_2b_non_admin_cannot_change_subscriptions(app, client, developer, client_user):
    user_id = _developer_user_id(app, client_user["email"])
    resp = client.patch(
        f"/api/admin/users/{user_id}/subscription",
        json={"status": "active"},
        headers=developer["headers"],
    )
    assert resp.status_code == 403


@pytest.mark.slow
def test_7_3_user_without_active_subscription_denied_restricted_feature(app, client, developer_no_subscription, client_user):
    # Per the freemium model: the scan itself (axe report, score, screenshot)
    # is free for every developer -- only AI-generated suggestions are the
    # restricted, subscription-gated feature.
    dev_id_resp = client.get("/api/auth/me", headers=developer_no_subscription["headers"])
    assert dev_id_resp.get_json()["subscription_status"] == "inactive"

    client_resp = client.get("/api/auth/me", headers=client_user["headers"])
    client_user_id = client_resp.get_json()["user_id"]

    resp = client.post(
        "/api/analyze",
        json={"url": "https://example.com", "project_name": "x", "client_id": client_user_id},
        headers=developer_no_subscription["headers"],
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["ai_suggestions"]["generated_by"] == "premium_required"
    assert body["ai_suggestions"]["technical"] == []
