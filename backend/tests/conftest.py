import sys
from pathlib import Path

import bcrypt
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from wdsl import create_app
from wdsl.config import TestConfig
from wdsl.extensions import db
from wdsl.models import Subscription, User


@pytest.fixture
def app():
    application = create_app(TestConfig)
    yield application
    with application.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def make_user(app, email, password, role, subscription_status="inactive"):
    with app.app_context():
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user = User(email=email, password_hash=password_hash, role=role)
        db.session.add(user)
        db.session.flush()
        db.session.add(Subscription(user_id=user.user_id, status=subscription_status))
        db.session.commit()
        return user.user_id


def auth_header(client, email, password):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def developer(app, client):
    make_user(app, "dev@example.com", "devpass123", "developer", subscription_status="active")
    return {"email": "dev@example.com", "password": "devpass123", "headers": auth_header(client, "dev@example.com", "devpass123")}


@pytest.fixture
def developer_no_subscription(app, client):
    make_user(app, "freedev@example.com", "devpass123", "developer", subscription_status="inactive")
    return {"email": "freedev@example.com", "password": "devpass123", "headers": auth_header(client, "freedev@example.com", "devpass123")}


@pytest.fixture
def client_user(app, client):
    make_user(app, "client@example.com", "clientpass123", "client")
    return {"email": "client@example.com", "password": "clientpass123", "headers": auth_header(client, "client@example.com", "clientpass123")}


@pytest.fixture
def admin_user(app, client):
    make_user(app, "admin@example.com", "adminpass123", "admin")
    return {"email": "admin@example.com", "password": "adminpass123", "headers": auth_header(client, "admin@example.com", "adminpass123")}
