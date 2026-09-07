"""Transactional email abstraction for password-reset and future mail needs.

The provider is selected through the ``EMAIL_PROVIDER`` environment variable:

* ``"console"`` (default) — writes the email to the application log.  Safe for
  local development; no external service required.
* ``"smtp"`` — sends via a configurable SMTP server (credentials from settings).
* ``"none"`` — silently discards every email.  Useful for tests or when no
  email capability is desired.

No API keys or passwords are hard-coded; everything comes from
:class:`app.config.Settings`.
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("smart_agri_copilot.email")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def send_password_reset_email(to_email: str, reset_url: str, expires_minutes: int) -> bool:
    """Build and dispatch a password-reset email.

    Returns ``True`` when the provider reports success, ``False`` otherwise.
    Never raises — callers should treat failure as a silent degradation
    (the API response is identical regardless of email delivery status).
    """
    subject = "Smart Agri Copilot — Password Reset Request"
    html_body = _build_reset_html(to_email, reset_url, expires_minutes)
    text_body = _build_reset_text(reset_url, expires_minutes)

    return _dispatch(to_email, subject, html_body, text_body)


# ---------------------------------------------------------------------------
# Provider dispatch
# ---------------------------------------------------------------------------


def _dispatch(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    provider = (settings.email_provider or "none").strip().lower()
    logger.info("Email dispatch: provider=%s to=%s subject=%r", provider, to_email, subject)

    if provider == "console":
        return _send_console(to_email, subject, text_body)
    if provider == "smtp":
        return _send_smtp(to_email, subject, html_body, text_body)
    if provider == "none":
        logger.debug("Email provider is 'none'; skipping email to %s", to_email)
        return True

    logger.warning("Unknown EMAIL_PROVIDER '%s'; email to %s not sent", provider, to_email)
    return False


# ---------------------------------------------------------------------------
# Console provider (development)
# ---------------------------------------------------------------------------


def _send_console(to_email: str, subject: str, text_body: str) -> bool:
    """Log the email content — handy for local dev and CI."""
    logger.info(
        "---- EMAIL (console provider) ----\n"
        "To: %s\nSubject: %s\n\n%s\n"
        "---- END EMAIL ----",
        to_email,
        subject,
        text_body,
    )
    return True


# ---------------------------------------------------------------------------
# SMTP provider
# ---------------------------------------------------------------------------


def _send_smtp(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """Send via the configured SMTP server."""
    if not settings.smtp_host:
        logger.error("SMTP host is not configured; email to %s not sent", to_email)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.email_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    logger.info(
        "Starting SMTP send: host=%s port=%s tls=%s from=%s to=%s",
        settings.smtp_host, settings.smtp_port, settings.smtp_use_tls,
        settings.email_from, to_email,
    )
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.email_from, [to_email], msg.as_string())
        logger.info("SMTP send succeeded: to=%s", to_email)
        return True
    except Exception as exc:
        logger.error("SMTP email to %s failed: %s: %s", to_email, type(exc).__name__, exc)
        return False


# ---------------------------------------------------------------------------
# Email body builders
# ---------------------------------------------------------------------------

_RESET_TEXT_TEMPLATE = (
    "Hello,\n\n"
    "We received a request to reset the password for your Smart Agri Copilot account.\n\n"
    "Click the link below to set a new password. It will expire in {expires_minutes} minutes.\n\n"
    "{reset_url}\n\n"
    "If you did not request a password reset, you can safely ignore this email — "
    "your password will remain unchanged.\n\n"
    "For security, please do not share this link with anyone.\n\n"
    "— Smart Agri Copilot"
)

_RESET_HTML_TEMPLATE = """\
<div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #2e7d32; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 20px;">Smart Agri Copilot</h1>
  </div>
  <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 16px;">Hello,</p>
    <p style="margin: 0 0 16px;">
      We received a request to reset the password for your Smart Agri Copilot account.
    </p>
    <p style="margin: 0 0 20px;">
      Click the button below to set a new password. It will expire in <strong>{expires_minutes} minutes</strong>.
    </p>
    <a href="{reset_url}"
       style="display: inline-block; background: #2e7d32; color: #fff; padding: 12px 28px;
              border-radius: 8px; text-decoration: none; font-weight: 600;">
      Reset Password
    </a>
    <p style="margin: 24px 0 8px; font-size: 13px; color: #666;">
      If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="font-size: 12px; color: #888; word-break: break-all;">{reset_url}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 13px; color: #888; margin: 0;">
      If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
    </p>
    <p style="font-size: 13px; color: #888; margin: 8px 0 0;">
      For security, please do not share this link with anyone.
    </p>
  </div>
</div>
"""


def _build_reset_text(reset_url: str, expires_minutes: int) -> str:
    return _RESET_TEXT_TEMPLATE.format(reset_url=reset_url, expires_minutes=expires_minutes)


def _build_reset_html(to_email: str, reset_url: str, expires_minutes: int) -> str:
    return _RESET_HTML_TEMPLATE.format(reset_url=reset_url, expires_minutes=expires_minutes)
