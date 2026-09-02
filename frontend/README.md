# Frontend — Smart Agri Copilot

React + Vite + Tailwind CSS application.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Available Scripts

| Command         | Description                      |
|-----------------|----------------------------------|
| `npm run dev`   | Start development server (:5173) |
| `npm run build` | Create production build          |
| `npm run preview` | Preview production build       |

## Folder Conventions

- **`components/`** — Reusable UI components (buttons, cards, forms)
- **`pages/`** — Full-page views that compose components
- **`services/`** — All API calls isolated here for easy replacement
- **`hooks/`** — Custom React hooks for shared stateful logic
- **`utils/`** — Pure helper functions (formatting, validation)
