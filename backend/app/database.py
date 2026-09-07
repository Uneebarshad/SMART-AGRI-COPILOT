import logging
from datetime import datetime, timezone

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings


def utc_now() -> datetime:
    """Timezone-aware UTC timestamp used as a model column default."""
    return datetime.now(timezone.utc)


engine = create_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> tuple[bool, str | None]:
    """Cheap connectivity probe that never raises."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, None
    except SQLAlchemyError as exc:
        reason = str(getattr(exc, "orig", None) or exc).strip()
        return False, reason[:200] or exc.__class__.__name__


def init_db() -> tuple[bool, str | None]:
    """Ensure tables exist when the database is reachable; never raise."""
    ready, error = check_database_connection()
    if not ready:
        return False, error

    # Importing the models package registers every model on Base.metadata.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Seed the disease library if the table is empty.
    try:
        from app.services.disease_seed import seed_diseases_if_empty
        from app.services.history_seed import seed_history_if_empty
        from app.services.auth import migrate_demo_user
        with SessionLocal() as seed_session:
            seed_diseases_if_empty(seed_session)
            seed_history_if_empty(seed_session)
            migrate_demo_user(seed_session)
    except Exception as exc:
        logger_mod = logging.getLogger("smart_agri_copilot.init_db")
        logger_mod.warning("Data seeding failed (non-fatal): %s", exc)

    return True, None
