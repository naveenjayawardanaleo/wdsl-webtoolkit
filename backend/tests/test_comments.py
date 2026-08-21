"""TC 6: Collaboration Hub"""

from wdsl.extensions import db
from wdsl.models import Project, Report, User


def _seed_report(app, developer_email, client_email):
    with app.app_context():
        dev = User.query.filter_by(email=developer_email).first()
        cli = User.query.filter_by(email=client_email).first()
        project = Project(project_name="TC6 project", developer_id=dev.user_id, client_id=cli.user_id)
        db.session.add(project)
        db.session.flush()
        report = Report(project_id=project.project_id, url="https://example.com", accessibility_score=80)
        db.session.add(report)
        db.session.commit()
        return report.report_id


def test_6_1_client_can_open_comment(app, client, developer, client_user):
    report_id = _seed_report(app, developer["email"], client_user["email"])
    resp = client.post(
        f"/api/reports/{report_id}/comments",
        json={"comment_text": "Why is the login button unreadable to screen readers?"},
        headers=client_user["headers"],
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["status"] == "open"
    assert body["parent_comment_id"] is None


def test_6_1b_developer_cannot_open_top_level_comment(app, client, developer, client_user):
    report_id = _seed_report(app, developer["email"], client_user["email"])
    resp = client.post(
        f"/api/reports/{report_id}/comments",
        json={"comment_text": "Developer trying to open a thread"},
        headers=developer["headers"],
    )
    assert resp.status_code == 403


def test_6_2_developer_can_reply(app, client, developer, client_user):
    report_id = _seed_report(app, developer["email"], client_user["email"])
    opened = client.post(
        f"/api/reports/{report_id}/comments",
        json={"comment_text": "Please explain this violation"},
        headers=client_user["headers"],
    ).get_json()

    resp = client.post(
        f"/api/comments/{opened['comment_id']}/replies",
        json={"comment_text": "Fixed by adding alt text to the logo image"},
        headers=developer["headers"],
    )
    assert resp.status_code == 201
    assert resp.get_json()["parent_comment_id"] == opened["comment_id"]


def test_6_2b_client_cannot_post_developer_style_reply(app, client, developer, client_user):
    report_id = _seed_report(app, developer["email"], client_user["email"])
    opened = client.post(
        f"/api/reports/{report_id}/comments",
        json={"comment_text": "Please explain this violation"},
        headers=client_user["headers"],
    ).get_json()

    resp = client.post(
        f"/api/comments/{opened['comment_id']}/replies",
        json={"comment_text": "Client trying to reply like a developer"},
        headers=client_user["headers"],
    )
    assert resp.status_code == 403


def test_6_3_client_can_close_thread(app, client, developer, client_user):
    report_id = _seed_report(app, developer["email"], client_user["email"])
    opened = client.post(
        f"/api/reports/{report_id}/comments",
        json={"comment_text": "Satisfied with the fix, closing"},
        headers=client_user["headers"],
    ).get_json()

    resp = client.patch(f"/api/comments/{opened['comment_id']}/close", headers=client_user["headers"])
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "closed"


def test_6_3b_developer_cannot_close_thread(app, client, developer, client_user):
    report_id = _seed_report(app, developer["email"], client_user["email"])
    opened = client.post(
        f"/api/reports/{report_id}/comments",
        json={"comment_text": "Only I should be able to close this"},
        headers=client_user["headers"],
    ).get_json()

    resp = client.patch(f"/api/comments/{opened['comment_id']}/close", headers=developer["headers"])
    assert resp.status_code == 403
