"""Diagnostic: show the runtime email settings (secrets redacted)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.config import settings

def redact(val, show=0):
    """Show only the first `show` chars; mask the rest."""
    if not val:
        return "(empty)"
    s = str(val)
    if len(s) <= show:
        return s
    return s[:show] + "*" * (len(s) - show)

print("=== Runtime Email Configuration ===")
print(f"  email_provider : {settings.email_provider!r}")
print(f"  email_from     : {settings.email_from!r}")
print(f"  smtp_host      : {settings.smtp_host!r}")
print(f"  smtp_port      : {settings.smtp_port!r}")
print(f"  smtp_user      : {redact(settings.smtp_user, 3)}")
print(f"  smtp_password  : {redact(settings.smtp_password, 0)}")
print(f"  smtp_use_tls   : {settings.smtp_use_tls!r}")
print(f"  frontend_url   : {settings.frontend_url!r}")
print()

# Check for obvious problems
problems = []
if settings.email_provider != "smtp":
    problems.append(f"EMAIL_PROVIDER is '{settings.email_provider}', NOT 'smtp' — emails go to console/nowhere")
if not settings.smtp_host:
    problems.append("SMTP_HOST is empty — no SMTP server configured")
if not settings.smtp_user:
    problems.append("SMTP_USER is empty — no SMTP authentication user")
if not settings.smtp_password:
    problems.append("SMTP_PASSWORD is empty — no SMTP authentication password")
if settings.email_from in ("", "no-reply@smartagri.local"):
    problems.append("EMAIL_FROM is not set to your Gmail address")

if problems:
    print("=== PROBLEMS FOUND ===")
    for i, p in enumerate(problems, 1):
        print(f"  {i}. {p}")
else:
    print("=== Configuration looks OK ===")
