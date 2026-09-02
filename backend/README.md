# Backend — Smart Agri Copilot

Python + FastAPI REST API.

## Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

## Folder Conventions

- **`app/main.py`** — FastAPI application entry point and middleware
- **`app/config.py`** — Settings loaded from environment / `.env`
- **`app/database.py`** — SQLAlchemy engine, session, and base model
- **`app/routes/`** — API route handlers (one file per domain)
- **`app/models/`** — SQLAlchemy ORM models
- **`app/schemas/`** — Pydantic request/response schemas
- **`app/services/`** — Business logic (called by routes, not directly by FastAPI)
