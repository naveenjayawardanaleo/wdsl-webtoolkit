"""TC 5: Report Viewing & Role-Based Access"""

from wdsl.extensions import db
from wdsl.models import Project, Report, Violation


def _seed_report(app, developer_email, client_email):
    from wdsl.models import User

    with app.app_context():
        dev = User.query.filter_by(email=developer_email).first()
        cli = User.query.filter_by(email=client_email).first()
        project = Project(project_name="TC5 project", developer_id=dev.user_id, client_id=cli.user_id)
        db.session.add(project)
        db.session.flush()

        report = Report(
            project_id=project.project_id,
            url="https://example.com",
            screenshot_path="/tmp/shot.png",
            annotated_screenshot_path="/tmp/shot_annotated.png",
            accessibility_score=72,
            cv_prediction="tourism",
            cv_confidence=91.2,
            axe_violations=[{"id": "image-alt", "impact": "critical"}],
            ai_suggestions={"technical": [{"id": "image-alt", "message": "tech"}], "plain_language": [{"id": "image-alt", "message": "plain"}]},
        )
        db.session.add(report)
        db.session.flush()

        violation = Violation(report_id=report.report_id, axe_id="image-alt", impact="critical", status="todo")
        db.session.add(violation)
        db.session.commit()
        return report.report_id, violation.violation_id


def test_5_1_developer_sees_full_technical_report(app, client, developer, client_user):
    report_id, _ = _seed_report(app, developer["email"], client_user["email"])
    resp = client.get(f"/api/reports/{report_id}", headers=developer["headers"])
    assert resp.status_code == 200
    body = resp.get_json()
    assert "axe_violations" in body
    assert "violations" in body
    assert "annotated_screenshot_path" in body


def test_5_2_client_sees_only_plain_language_report(app, client, developer, client_user):
    report_id, _ = _seed_report(app, developer["email"], client_user["email"])
    resp = client.get(f"/api/reports/{report_id}", headers=client_user["headers"])
    assert resp.status_code == 200
    body = resp.get_json()
    assert "axe_violations" not in body
    assert "annotated_screenshot_path" not in body
    assert body["ai_suggestions"] == ["plain"] or body["ai_suggestions"][0]["message"] == "plain"


def test_5_3_developer_can_update_violation_status(app, client, developer, client_user):
    _, violation_id = _seed_report(app, developer["email"], client_user["email"])
    resp = client.patch(
        f"/api/violations/{violation_id}/status",
        json={"status": "completed"},
        headers=developer["headers"],
    )
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "completed"


def test_5_client_cannot_update_violation_status(app, client, developer, client_user):
    _, violation_id = _seed_report(app, developer["email"], client_user["email"])
    resp = client.patch(
        f"/api/violations/{violation_id}/status",
        json={"status": "completed"},
        headers=client_user["headers"],
    )
    assert resp.status_code == 403
