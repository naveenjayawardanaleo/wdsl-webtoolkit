"""Task 1: AI Suggestion Generator.

Takes axe-core violations and asks Gemini for two parallel write-ups of the
same findings: a technical version (developer role) and a plain-language
version (client role). If the Gemini API key is missing, invalid, or the
call fails/times out, we fall back to a deterministic templated summary so
the analyze request never crashes and the response shape never changes.
"""

import json
import logging

from flask import current_app

logger = logging.getLogger(__name__)

# Pinned rather than aliased: the "latest" alias (gemini-flash-latest) was
# measured to be intermittently very slow/hanging under real load (503s and
# 20-60s timeouts, reproduced with plain curl, no SDK involved), while this
# specific version answered in ~3s across repeated tests. Gemini model
# versions do get retired on a rolling basis (gemini-1.5-flash, this
# project's original choice, stopped resolving entirely -- see
# docs/gemini_integration_debug_notes.md), so this will need revisiting if
# gemini-3.5-flash is retired later; that's a known tradeoff, not an oversight.
MODEL_NAME = "gemini-3.5-flash"

_PROMPT_TEMPLATE = """You are helping an accessibility auditing tool explain WCAG violations found on a website.
Given the JSON list of axe-core violations below, produce a JSON object with exactly two keys: "technical" and "plain_language".

Each key must map to a list with one entry per violation, in the same order as the input, of the form:
{{"id": "<violation id>", "message": "<the write-up>"}}

For "technical": address a web developer who will fix the code. Keep terminology like CSS selectors, WCAG success criteria, and element attributes. Be specific about what to change.

For "plain_language": address a non-technical client. No jargon, no selectors, no WCAG codes. Explain what the problem means for real visitors (e.g. "some buttons on your site can't be understood by screen readers") and why it matters.

Violations JSON:
{violations_json}

Respond with ONLY the JSON object, no markdown fences, no commentary.
"""


def _fallback_suggestions(violations, reason):
    technical = []
    plain_language = []
    for v in violations:
        vid = v.get("id", "unknown")
        technical.append(
            {
                "id": vid,
                "message": (
                    f"[AI suggestion unavailable: {reason}] {v.get('help', 'Issue')} "
                    f"— see {v.get('help_url', 'axe-core docs')} for the fix."
                ),
            }
        )
        plain_language.append(
            {
                "id": vid,
                "message": (
                    f"[AI suggestion unavailable: {reason}] There is an accessibility issue "
                    f"on your site ({v.get('help', 'an issue was detected')}). Ask your developer to review it."
                ),
            }
        )
    return {"technical": technical, "plain_language": plain_language, "generated_by": "fallback"}


def generate_suggestions(violations):
    if not violations:
        return {"technical": [], "plain_language": [], "generated_by": "none"}

    api_key = current_app.config.get("GEMINI_API_KEY")
    if not api_key:
        return _fallback_suggestions(violations, "GEMINI_API_KEY is not configured")

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)

        compact_violations = [
            {
                "id": v.get("id"),
                "impact": v.get("impact"),
                "description": v.get("description"),
                "help": v.get("help"),
                "help_url": v.get("help_url"),
                "affected_count": v.get("node_count"),
            }
            for v in violations
        ]
        prompt = _PROMPT_TEMPLATE.format(violations_json=json.dumps(compact_violations, indent=2))

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
            request_options={"timeout": 20},
        )
        parsed = json.loads(response.text)
        if "technical" not in parsed or "plain_language" not in parsed:
            raise ValueError("Gemini response missing required keys")
        parsed["generated_by"] = MODEL_NAME
        return parsed

    except Exception as exc:  # noqa: BLE001 - any Gemini/SDK failure must degrade gracefully
        logger.warning("Gemini suggestion generation failed: %s", exc)
        return _fallback_suggestions(violations, "the AI service call failed")
