import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _database_uri():
    explicit = os.environ.get("DATABASE_URL")
    if explicit:
        return explicit

    user = os.environ.get("MYSQL_USER", "root")
    password = os.environ.get("MYSQL_PASSWORD", "")
    host = os.environ.get("MYSQL_HOST", "127.0.0.1")
    port = os.environ.get("MYSQL_PORT", "3306")
    name = os.environ.get("MYSQL_DATABASE", "wdsl_webtoolkit")
    auth = user if not password else f"{user}:{password}"
    return f"mysql+pymysql://{auth}@{host}:{port}/{name}"


class Config:
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

    SCREENSHOT_DIR = os.environ.get("SCREENSHOT_DIR", str(BACKEND_DIR / "storage" / "screenshots"))


class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    TESTING = True
    JWT_SECRET_KEY = "test-secret"
