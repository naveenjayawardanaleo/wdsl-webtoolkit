"""Payment details page: a stateless slip-submission endpoint.

Not a payment gateway. No card capture, no transaction processing, no
database write. Receives an uploaded payment slip, emails it as an
attachment to the admin's inbox for manual verification, and discards it.
"""

from flask import Blueprint, jsonify, request

from ..auth_utils import is_valid_email
from ..services.mailer import MailerNotConfigured, send_payment_slip

payment_bp = Blueprint("payment", __name__)

MAX_SLIP_BYTES = 8 * 1024 * 1024  # 8MB
ALLOWED_MIMETYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"}


@payment_bp.route("/slip", methods=["POST"])
def submit_payment_slip():
    email = (request.form.get("email") or "").strip().lower()
    if not is_valid_email(email):
        return jsonify({"error": "A valid account email is required"}), 400

    slip = request.files.get("slip")
    if not slip or not slip.filename:
        return jsonify({"error": "A payment slip file (image or PDF) is required"}), 400

    if slip.mimetype not in ALLOWED_MIMETYPES:
        return jsonify({"error": "Payment slip must be an image (JPEG/PNG/WEBP/HEIC) or a PDF"}), 400

    file_bytes = slip.read(MAX_SLIP_BYTES + 1)
    if len(file_bytes) > MAX_SLIP_BYTES:
        return jsonify({"error": "Payment slip must be smaller than 8MB"}), 400

    try:
        send_payment_slip(email, slip.filename, file_bytes, slip.mimetype)
    except MailerNotConfigured:
        return (
            jsonify(
                {
                    "error": "Email delivery isn't configured on this server right now. "
                    "Please send your payment slip via the WhatsApp link above instead."
                }
            ),
            503,
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Could not send your payment slip: {exc}"}), 502

    return jsonify({"status": "sent"})
