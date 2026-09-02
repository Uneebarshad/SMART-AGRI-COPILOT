# Smart Agri Copilot

An AI-powered agriculture assistant that helps farmers with crop management, disease identification, and smart farming recommendations.

## Project Structure

```
smart-agri-copilot/
├── frontend/          # React + Vite + Tailwind CSS web application
├── backend/           # Python + FastAPI REST API
├── .gitignore
└── README.md
```

### Frontend (`frontend/`)

React-based single-page application built with Vite and Tailwind CSS.

- **`src/components/`** — Reusable UI components
- **`src/pages/`** — Page-level views
- **`src/services/`** — API client layer (all HTTP calls isolated here)
- **`src/hooks/`** — Custom React hooks
- **`src/utils/`** — Utility functions

### Backend (`backend/`)

FastAPI application providing the REST API.

- **`app/main.py`** — Application entry point
- **`app/routes/`** — API route handlers
- **`app/models/`** — Database models
- **`app/schemas/`** — Request/response schemas
- **`app/services/`** — Business logic layer
- **`app/database.py`** — Database connection setup
- **`app/config.py`** — Configuration management

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 15+

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Interactive API docs at `http://localhost:8000/docs`.

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React, Vite, Tailwind CSS   |
| Backend    | Python, FastAPI             |
| Database   | PostgreSQL                  |

## License

This project is proprietary. All rights reserved.
