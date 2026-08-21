"""TC 2: URL Submission & Scanning Pipeline

These hit the real Playwright + axe-core pipeline against a live URL
(https://example.com), so they need network access and are slower than
the unit tests. That's intentional -- TC 2.4/2.5 exist specifically to
prove the real pipeline works end to end, not a mocked stand-in.
"""

import pytest

from wdsl.services.scanner import normalize_url


def _create_project_and_analyze(client, developer, client_user, url):
    dev_resp = client.get("/api/auth/me", headers=developer["headers"])
    client_resp = client.get("/api/auth/me", headers=client_user["headers"])
    client_user_id = client_resp.get_json()["user_id"]

    return client.post(
        "/api/analyze",
        json={"url": url, "project_name": "TC2 test project", "client_id": client_user_id},
        headers=developer["headers"],
    )


def test_2_1_invalid_url_format_rejected():
    assert normalize_url("not a url at all !!") is None
    assert normalize_url("") is None
    assert normalize_url("ftp://example.com") is None
    assert normalize_url("example.com") == "https://example.com"


@pytest.mark.slow
def test_2_2_unreachable_url_rejected(client, developer, client_user):
    resp = _create_project_and_analyze(client, developer, client_user, "http://127.0.0.1:59999")
    assert resp.status_code in (502, 504)
    assert "error" in resp.get_json()


@pytest.mark.slow
def test_2_3_2_4_2_5_full_scan_pipeline_succeeds(client, developer, client_user):
    resp = _create_project_and_analyze(client, developer, client_user, "https://example.com")
    assert resp.status_code == 200
    body = resp.get_json()

    # 2.3: request succeeded end to end
    assert "report_id" in body

    # 2.4: Playwright captured a screenshot
    assert body["screenshot"].startswith("data:image/png;base64,")
    assert len(body["screenshot"]) > 1000

    # 2.5: axe-core returned a violations list (possibly empty, but present and typed correctly)
    assert isinstance(body["axe_results"]["violations"], list)
    assert isinstance(body["axe_results"]["violations_count"], int)
    assert isinstance(body["axe_results"]["passes_count"], int)
