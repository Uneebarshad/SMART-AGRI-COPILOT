"""Vercel serverless entrypoint for the FastAPI backend.

Vercel's Python runtime mounts this module as a catch-all function at
``/api/*`` (one function serves every API route; the full request path is
preserved, which matches how the app registers its routers under the ``/api``
prefix in ``backend/app/main.py``).

This is a thin adapter only — the application itself is unchanged, so local
development (``uvicorn app.main:app`` from ``backend/``) keeps working exactly
as before.  Do not add business logic here.
"""

import sys
from pathlib import Path

# Make the backend/ package importable as `app.*` inside the function bundle.
_BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.main import app  # noqa: E402,F401  (Vercel mounts this ASGI callable)
