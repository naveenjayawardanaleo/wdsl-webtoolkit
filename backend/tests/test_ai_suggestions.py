"""TC 4: AI Suggestion Generation"""

import os

import pytest

from wdsl.services import ai_suggestions

SAMPLE_VIOLATIONS = [
    {
        "id": "image-alt",
        "impact": "critical",
        "description": "Images must have alternate text",
        "help": "Images must have alternate text",
        "help_url": "https://dequeuniversity.com/rules/axe/4.7/image-alt",
        "node_count": 2,
    }
]


def test_4_1_gemini_call_succeeds_when_key_configured(app):
    if not app.config.get("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not configured in this environment -- see .env.example")
    with app.app_context():
        result = ai_suggestions.generate_suggestions(SAMPLE_VIOLATIONS)
    assert result["generated_by"].startswith("gemini")
    assert len(result["technical"]) == 1
    assert len(result["plain_language"]) == 1


def test_4_1b_falls_back_gracefully_without_key(app):
    with app.app_context():
        app.config["GEMINI_API_KEY"] = ""
        result = ai_suggestions.generate_suggestions(SAMPLE_VIOLATIONS)
    assert result["generated_by"] == "fallback"
    assert len(result["technical"]) == 1
    assert len(result["plain_language"]) == 1
    # the fallback still returns a usable message per violation, it just says so
    assert "unavailable" in result["technical"][0]["message"]


def test_4_2_technical_and_plain_language_differ_by_role(app):
    with app.app_context():
        result = ai_suggestions.generate_suggestions(SAMPLE_VIOLATIONS)
    technical_message = result["technical"][0]["message"]
    plain_message = result["plain_language"][0]["message"]
    assert technical_message != plain_message
