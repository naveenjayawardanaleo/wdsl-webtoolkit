"""Seed the database with one developer, one client, one admin, and a
completed project/report, so the dashboard/report pages aren't empty when
demoing or capturing screenshots for the dissertation."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bcrypt
from PIL import Image, ImageDraw

from wdsl import create_app
from wdsl.extensions import db
from wdsl.models import Comment, Project, Report, Subscription, User, Violation
from wdsl.services.annotate import annotate_screenshot


def _placeholder_screenshot_bytes():
    import io

    image = Image.new("RGB", (1366, 900), color=(248, 250, 252))
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 0, 1366, 72], fill=(15, 23, 42))
    draw.text((40, 26), "example.com — demo homepage", fill=(255, 255, 255))
    draw.rectangle([40, 20, 160, 60], outline=(255, 255, 255), width=2)  # hero-logo area
    draw.rectangle([200, 300, 340, 344], fill=(125, 211, 252))  # CTA button area
    draw.text((215, 312), "Book now", fill=(255, 255, 255))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()

DEMO_USERS = [
    ("developer@wdsl-demo.test", "demopass123", "developer", "active"),
    ("client@wdsl-demo.test", "demopass123", "client", "inactive"),
    ("admin@wdsl-demo.test", "demopass123", "admin", "inactive"),
]

SAMPLE_VIOLATIONS = [
    {
        "id": "image-alt",
        "impact": "critical",
        "description": "Images must have alternate text",
        "help": "Images must have alternate text",
        "help_url": "https://dequeuniversity.com/rules/axe/4.7/image-alt",
        "affected_elements": [
            {"target": ["img.hero-logo"], "html": '<img class="hero-logo" src="/logo.png">', "fix_summary": "Add an alt attribute", "selector": "img.hero-logo", "bounding_box": {"x": 40, "y": 20, "width": 120, "height": 40}}
        ],
        "node_count": 1,
    },
    {
        "id": "color-contrast",
        "impact": "serious",
        "description": "Elements must meet minimum color contrast ratio thresholds",
        "help": "Elements must have sufficient color contrast",
        "help_url": "https://dequeuniversity.com/rules/axe/4.7/color-contrast",
        "affected_elements": [
            {"target": [".cta-button"], "html": '<button class="cta-button">Book now</button>', "fix_summary": "Increase contrast ratio to at least 4.5:1", "selector": ".cta-button", "bounding_box": {"x": 200, "y": 300, "width": 140, "height": 44}}
        ],
        "node_count": 3,
    },
]


def main():
    app = create_app()
    with app.app_context():
        users = {}
        for email, password, role, sub_status in DEMO_USERS:
            existing = User.query.filter_by(email=email).first()
            if existing:
                users[role] = existing
                continue
            password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user = User(email=email, password_hash=password_hash, role=role)
            db.session.add(user)
            db.session.flush()
            db.session.add(Subscription(user_id=user.user_id, status=sub_status))
            users[role] = user
        db.session.commit()

        project = Project.query.filter_by(project_name="WDSL Demo Project").first()
        if not project:
            project = Project(
                project_name="WDSL Demo Project",
                developer_id=users["developer"].user_id,
                client_id=users["client"].user_id,
            )
            db.session.add(project)
            db.session.flush()

        report = Report.query.filter_by(project_id=project.project_id).first()
        if not report:
            import uuid

            storage_dir = Path(app.config["SCREENSHOT_DIR"])
            storage_dir.mkdir(parents=True, exist_ok=True)
            screenshot_bytes = _placeholder_screenshot_bytes()
            annotated_bytes = annotate_screenshot(screenshot_bytes, SAMPLE_VIOLATIONS)

            screenshot_path = storage_dir / f"demo_{uuid.uuid4().hex}.png"
            annotated_path = storage_dir / f"demo_{uuid.uuid4().hex}_annotated.png"
            screenshot_path.write_bytes(screenshot_bytes)
            annotated_path.write_bytes(annotated_bytes)

            report = Report(
                project_id=project.project_id,
                url="https://example.com",
                screenshot_path=str(screenshot_path),
                annotated_screenshot_path=str(annotated_path),
                accessibility_score=76,
                cv_prediction="tourism",
                cv_confidence=88.4,
                axe_violations=SAMPLE_VIOLATIONS,
                lighthouse_result={"categories": {"performance": 92, "accessibility": 81, "best-practices": 96, "seo": 90}},
                ai_suggestions={
                    "technical": [
                        {"id": "image-alt", "message": "Add alt=\"WDSL logo\" to img.hero-logo so screen readers can announce it."},
                        {"id": "color-contrast", "message": "The CTA button text is #ffffff on #7dd3fc (~2.1:1). Darken the background to at least #0284c7 to reach 4.5:1."},
                    ],
                    "plain_language": [
                        {"id": "image-alt", "message": "The logo image on your homepage has no description, so visitors using screen readers can't tell what it is."},
                        {"id": "color-contrast", "message": "The 'Book now' button is hard to read for visitors with low vision because the text color is too close to the background color."},
                    ],
                    "generated_by": "fallback",
                },
            )
            db.session.add(report)
            db.session.flush()

            for v in SAMPLE_VIOLATIONS:
                db.session.add(
                    Violation(
                        report_id=report.report_id,
                        axe_id=v["id"],
                        impact=v["impact"],
                        description=v["description"],
                        help_url=v["help_url"],
                        target_selector=v["affected_elements"][0]["selector"],
                        status="todo",
                    )
                )

            opened = Comment(
                report_id=report.report_id,
                user_id=users["client"].user_id,
                comment_text="Can you explain why the 'Book now' button was flagged?",
                status="open",
            )
            db.session.add(opened)
            db.session.flush()
            db.session.add(
                Comment(
                    report_id=report.report_id,
                    user_id=users["developer"].user_id,
                    parent_comment_id=opened.comment_id,
                    comment_text="Sure — the button text color doesn't have enough contrast against its background for low-vision users. I'm fixing it now.",
                    status="open",
                )
            )

        db.session.commit()
        print(f"Seeded. Demo report id: {report.report_id}")
        for email, password, role, _ in DEMO_USERS:
            print(f"  {role}: {email} / {password}")


if __name__ == "__main__":
    main()
