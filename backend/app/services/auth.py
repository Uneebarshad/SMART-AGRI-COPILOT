"""Authentication primitives: password hashing, JWT tokens, and password-reset tokens.

All secrets (JWT key, algorithm, TTL) come from ``app.config.settings`` so
nothing is hard-coded here.  Passwords are hashed with bcrypt;
raw passwords are never stored or returned.  Reset tokens are generated with
``secrets.token_urlsafe``, stored as SHA-256 hashes, and are single-use.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of ``plain``.  Never store the plain copy."""
    # bcrypt has a 72-byte input limit; truncate defensively.
    hashed = bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Check ``plain`` against a stored bcrypt ``hashed`` value."""
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(
            plain.encode("utf-8")[:72],
            hashed.encode("utf-8"),
        )
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------


def create_access_token(user_id: int) -> str:
    """Build a signed JWT containing ``sub=user_id`` and an ``exp`` claim."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT.  Raises ``jwt.PyJWTError`` on any failure."""
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["sub", "exp"]},
    )


# ---------------------------------------------------------------------------
# Password-reset tokens
# ---------------------------------------------------------------------------


def generate_reset_token() -> str:
    """Return a cryptographically secure, URL-safe reset token (48 bytes → 64 chars)."""
    return secrets.token_urlsafe(48)


def hash_reset_token(raw_token: str) -> str:
    """SHA-256 hash of the raw reset token for safe database storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_reset_token_for_user(db: Session, user: User) -> str:
    """Generate a reset token, store its hash + expiry on the user row, return the raw token.

    The caller is responsible for building the reset URL and sending the email.
    """
    raw_token = generate_reset_token()
    token_hash = hash_reset_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.password_reset_token_expire_minutes
    )
    user.password_reset_token_hash = token_hash
    user.password_reset_expires_at = expires_at
    db.commit()
    return raw_token


def validate_reset_token(db: Session, raw_token: str) -> User | None:
    """Look up the user whose stored hash matches *raw_token* and whose token has not expired.

    Returns the ``User`` on success, or ``None`` when the token is invalid,
    expired, or does not match any row.
    """
    token_hash = hash_reset_token(raw_token)
    user = db.query(User).filter(User.password_reset_token_hash == token_hash).first()
    if user is None:
        return None

    now = datetime.now(timezone.utc)
    if user.password_reset_expires_at is None or user.password_reset_expires_at < now:
        return None

    return user


def clear_reset_token(db: Session, user: User) -> None:
    """Invalidate the reset token after a successful password change."""
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.commit()


# ---------------------------------------------------------------------------
# Demo-user migration (one-shot, idempotent)
# ---------------------------------------------------------------------------


def migrate_demo_user(db: Session) -> None:
    """Ensure any pre-auth demo user row can still log in.

    The legacy ``get_demo_user()`` created a User with no email and no
    password.  We give that row a deterministic email (``demo@smartagri.local``)
    and a known password (``demo``) so the developer can keep using it while
    the rest of the app moves to real authentication.  The function is
    idempotent: it only writes when a field is missing.
    """
    user = db.query(User).first()
    if user is None:
        return

    changed = False
    if not user.email:
        user.email = "demo@smartagri.local"
        changed = True
    if not user.password_hash:
        user.password_hash = hash_password("demo")
        changed = True
    if not user.name:
        user.name = "Demo Farmer"
        changed = True
    if not user.is_active:
        user.is_active = True
        changed = True

    if changed:
        db.commit()
