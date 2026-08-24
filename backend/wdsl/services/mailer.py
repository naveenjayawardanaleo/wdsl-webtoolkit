"""Stateless "receive file, forward by email, discard" helper for the payment-slip endpoint."""

import smtplib
from email.message import EmailMessage

from flask import current_app


class MailerNotConfigured(Exception):
    pass


def send_payment_slip(account_email, filename, file_bytes, mimetype):
    host = current_app.config.get("SMTP_HOST")
    user = current_app.config.get("SMTP_USER")
    password = current_app.config.get("SMTP_PASSWORD")
    sender = current_app.config.get("SMTP_FROM") or user
    recipient = current_app.config.get("PAYMENT_NOTIFY_EMAIL")

    if not (host and user and password and sender and recipient):
        raise MailerNotConfigured("SMTP is not configured on this server")

    port = current_app.config.get("SMTP_PORT", 587)
    maintype, _, subtype = (mimetype or "application/octet-stream").partition("/")

    message = EmailMessage()
    message["Subject"] = f"WDSL WebToolkit — payment slip from {account_email}"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        "A Client Premium payment slip was submitted via the Payment page.\n\n"
        f"Account email: {account_email}\n"
        f"Attached file: {filename}\n\n"
        "Verify the payment and activate the subscription from the Admin panel."
    )
    message.add_attachment(file_bytes, maintype=maintype or "application", subtype=subtype or "octet-stream", filename=filename)

    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(user, password)
        server.send_message(message)
