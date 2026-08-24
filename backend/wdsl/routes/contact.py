"""Contact Us page: a stateless "receive form, forward by email" endpoint.

No database write -- the message is emailed to CONTACT_NOTIFY_EMAIL and
discarded, same pattern as the payment-slip endpoint.
"""

from flask import Blueprint, jsonify, request

from ..auth_utils import is_valid_email
from ..services.mailer import MailerNotConfigured, send_contact_message

contact_bp = Blueprint("contact", __name__)

MAX_FIELD_LENGTH = 200
MAX_MESSAGE_LENGTH = 5000


@contact_bp.route("", methods=["POST"])
def submit_contact_message():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    subject = (payload.get("subject") or "").strip()
    message_text = (payload.get("message") or "").strip()

    if not name or len(name) > MAX_FIELD_LENGTH:
        return jsonify({"error": "Please enter your name"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "A valid email is required"}), 400
    if not subject or len(subject) > MAX_FIELD_LENGTH:
        return jsonify({"error": "Please enter a subject"}), 400
    if not message_text or len(message_text) > MAX_MESSAGE_LENGTH:
        return jsonify({"error": "Please enter a message (max 5000 characters)"}), 400

    try:
        send_contact_message(name, email, subject, message_text)
    except MailerNotConfigured:
        return (
            jsonify(
                {
                    "error": "Email delivery isn't configured on this server right now. "
                    "Please email info@wdsl.lk directly instead."
                }
            ),
            503,
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Could not send your message: {exc}"}), 502

    return jsonify({"status": "sent"})
