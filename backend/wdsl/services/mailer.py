"""Stateless "receive form/file, forward by email, discard" helpers.

Backs two endpoints that write nothing to the database: the payment-slip
upload on the Payment page, and the contact form on the Contact Us page.
"""

import smtplib
from email.message import EmailMessage

from flask import current_app


class MailerNotConfigured(Exception):
    pass


def _smtp_settings():
    host = current_app.config.get("SMTP_HOST")
    user = current_app.config.get("SMTP_USER")
    password = current_app.config.get("SMTP_PASSWORD")
    sender = current_app.config.get("SMTP_FROM") or user
    port = current_app.config.get("SMTP_PORT", 587)
    return host, port, user, password, sender


def _send(recipient, message):
    host, port, user, password, sender = _smtp_settings()
    if not (host and user and password and sender and recipient):
        raise MailerNotConfigured("SMTP is not configured on this server")

    message["From"] = sender
    message["To"] = recipient

    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(user, password)
        server.send_message(message)


def send_payment_slip(account_email, filename, file_bytes, mimetype):
    recipient = current_app.config.get("PAYMENT_NOTIFY_EMAIL")
    maintype, _, subtype = (mimetype or "application/octet-stream").partition("/")

    message = EmailMessage()
    message["Subject"] = f"WDSL WebToolkit — payment slip from {account_email}"
    message.set_content(
        "A Client Premium payment slip was submitted via the Payment page.\n\n"
        f"Account email: {account_email}\n"
        f"Attached file: {filename}\n\n"
        "Verify the payment and activate the subscription from the Admin panel."
    )
    message.add_attachment(file_bytes, maintype=maintype or "application", subtype=subtype or "octet-stream", filename=filename)

    _send(recipient, message)


def send_contact_message(name, from_email, subject, body_text):
    recipient = current_app.config.get("CONTACT_NOTIFY_EMAIL")

    message = EmailMessage()
    message["Subject"] = f"WDSL WebToolkit contact form — {subject}"
    message["Reply-To"] = from_email
    message.set_content(f"From: {name} <{from_email}>\nSubject: {subject}\n\n{body_text}")

    _send(recipient, message)
