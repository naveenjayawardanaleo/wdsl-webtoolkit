from datetime import datetime, timezone

from .extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(191), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("developer", "client", "admin", name="user_role"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    subscription = db.relationship("Subscription", backref="user", uselist=False)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "subscription_status": self.subscription.status if self.subscription else None,
        }


class Subscription(db.Model):
    __tablename__ = "subscriptions"

    subscription_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), unique=True, nullable=False)
    status = db.Column(db.Enum("active", "inactive", name="subscription_status"), default="inactive", nullable=False)
    granted_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class Project(db.Model):
    __tablename__ = "projects"

    project_id = db.Column(db.Integer, primary_key=True)
    project_name = db.Column(db.String(255), nullable=False)
    # Nullable: a developer or a client can create and manage a project solo.
    # Collaboration Hub / shared-report UI only appears once both are attached.
    developer_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    developer = db.relationship("User", foreign_keys=[developer_id])
    client = db.relationship("User", foreign_keys=[client_id])
    reports = db.relationship("Report", backref="project", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "project_id": self.project_id,
            "project_name": self.project_name,
            "developer_id": self.developer_id,
            "client_id": self.client_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "report_count": len(self.reports),
        }


class Report(db.Model):
    __tablename__ = "reports"

    report_id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.project_id"), nullable=False)
    url = db.Column(db.String(1000), nullable=False)
    screenshot_path = db.Column(db.String(500))
    annotated_screenshot_path = db.Column(db.String(500))
    accessibility_score = db.Column(db.Integer)
    cv_prediction = db.Column(db.String(100))
    cv_confidence = db.Column(db.Float)
    axe_violations = db.Column(db.JSON)
    lighthouse_result = db.Column(db.JSON)
    ai_suggestions = db.Column(db.JSON)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    violations = db.relationship("Violation", backref="report", cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="report", cascade="all, delete-orphan")

    def to_dict(self, include_technical=True):
        base = {
            "report_id": self.report_id,
            "project_id": self.project_id,
            "url": self.url,
            "screenshot_path": self.screenshot_path,
            "accessibility_score": self.accessibility_score,
            "cv_prediction": self.cv_prediction,
            "cv_confidence": self.cv_confidence,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_technical:
            # The client-facing plain-language write-up is deliberately left
            # out of technical (developer/admin) responses -- AI suggestions
            # are exclusive to the client view. ai_suggestions_technical stays,
            # since that's the developer-oriented write-up, not client-facing.
            base.update(
                {
                    "annotated_screenshot_path": self.annotated_screenshot_path,
                    "axe_violations": self.axe_violations,
                    "lighthouse_result": self.lighthouse_result,
                    "ai_suggestions_technical": (self.ai_suggestions or {}).get("technical", []),
                    "violations": [v.to_dict() for v in self.violations],
                }
            )
        else:
            base["ai_suggestions"] = (self.ai_suggestions or {}).get("plain_language", [])
        return base


class Violation(db.Model):
    __tablename__ = "violations"

    violation_id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("reports.report_id"), nullable=False)
    axe_id = db.Column(db.String(255))
    impact = db.Column(db.Enum("minor", "moderate", "serious", "critical", name="violation_impact"))
    description = db.Column(db.Text)
    help_url = db.Column(db.String(500))
    target_selector = db.Column(db.String(1000))
    status = db.Column(
        db.Enum("todo", "in_progress", "completed", name="violation_status"),
        default="todo",
        nullable=False,
    )

    def to_dict(self):
        return {
            "violation_id": self.violation_id,
            "axe_id": self.axe_id,
            "impact": self.impact,
            "description": self.description,
            "help_url": self.help_url,
            "target_selector": self.target_selector,
            "status": self.status,
        }


class Comment(db.Model):
    __tablename__ = "comments"

    comment_id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("reports.report_id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    parent_comment_id = db.Column(db.Integer, db.ForeignKey("comments.comment_id"), nullable=True)
    comment_text = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum("open", "closed", name="comment_status"), default="open", nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    author = db.relationship("User")
    replies = db.relationship("Comment", backref=db.backref("parent", remote_side=[comment_id]))

    def to_dict(self):
        return {
            "comment_id": self.comment_id,
            "report_id": self.report_id,
            "user_id": self.user_id,
            "author_email": self.author.email if self.author else None,
            "author_role": self.author.role if self.author else None,
            "parent_comment_id": self.parent_comment_id,
            "comment_text": self.comment_text,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
