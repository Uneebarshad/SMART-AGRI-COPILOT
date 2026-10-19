# Gemini Configuration (Google's official SDK)

## Overview

The backend talks to Google Gemini through the official Python SDK
[`google-genai`](https://pypi.org/project/google-genai/). One service —
`backend/app/services/gemini_service.py` — powers both features:

| Feature | Service function | Endpoint |
|---------|------------------|----------|
| AI Assistant chat | `generate_response()` | `POST /api/assistant/chat` |
| Leaf-scan diagnosis (vision) | `analyze_image_with_gemini()` | `POST /api/diagnosis/analyze` |

The previous provider-agnostic "OpenAI-compatible `/chat/completions`" workaround
(`backend/app/services/llm_service.py` plus the `LLM_*` environment variables) has
been removed.

## Environment variables (backend only)

| Variable | Example | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | *(user provides, never committed)* | Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model used for chat and vision |

Both are read through `app.config.Settings` (`backend/app/config.py`) from
`backend/.env`. `.env` is gitignored; `.env.example` ships with an empty key.

Note on precedence: real environment variables override `backend/.env`. If a
`GEMINI_API_KEY` is also exported in the shell or the OS environment, that value
wins — which can make a local run behave differently from a deploy.

Removed / no longer used: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`,
`LLM_API_BASE`, and any `OPENAI_*` variables.

## Model availability

Google retires Gemini ids over time and some models are unavailable to *newly
created* API-key projects. A retired or unavailable id makes the assistant return
HTTP 502 with a `Gemini model '<id>' not found — check GEMINI_MODEL` entry in the
backend log (the 404 is surfaced, never swallowed). Verified ids at the time of
writing:

| Model id | Notes |
|----------|-------|
| `gemini-2.5-flash` | Default; fast (~1–3 s), but rejected as 404 by newer key projects |
| `gemini-3.5-flash` | Works with both old and new keys; slower (~20–35 s) |
| `gemini-3.8-flash` | Newest flash model; works with both keys |

Pick the model that matches the key deployed to that environment — it is a single
environment variable change, no code change.

## How the assistant request works

1. Frontend sends `{conversation_id, message, language}` to `POST /api/assistant/chat`.
2. The route authenticates the user, loads up to 20 prior messages, and builds the
   farmer context block (profile, fields, current weather).
3. `generate_response()` sends, through the SDK:
   - `system_instruction` — agriculture persona + language rule + `FARMER CONTEXT`
   - `contents` — history mapped to Gemini roles (`assistant` → `model`) plus the
     new user turn
   - `temperature=0.7`, `max_output_tokens=800`
4. The reply text is stored as an assistant `Message` and returned in the unchanged
   `MessageRead` shape (`id`, `role`, `content`, `sources`, `follow_ups`, `created_at`,
   HTTP 201), so the frontend needs no changes.

## Reliability and safety

- Per-request timeouts: 45 s (chat), 60 s (vision); limited retries (2 attempts) on
  429/500/502/503 with short backoff.
- Connection-level drops (server disconnect, reset) are retried once with a 1 s
  backoff before failing; timeouts are never retried so the caller does not wait
  twice as long.
- Failures are translated into `GeminiProviderError` with short, safe messages
  (`Gemini rate limit exceeded`, `Gemini model '<id>' not found — check GEMINI_MODEL`,
  `Gemini rejected the API key (permission denied)`, timeouts, network errors).
- Missing key raises `GeminiConfigurationError` → HTTP 503 `llm_not_configured`;
  provider failures → HTTP 502 `llm_provider_error`. Both response codes and error
  strings keep the existing frontend contract.
- The key is sent by the SDK in a request header (never in a URL query string) and
  every value that reaches a log line or error message passes through a redaction
  helper, so secrets cannot leak into logs.
- Nothing Gemini-related exists in the frontend: `frontend/.env.example` only defines
  `VITE_API_BASE_URL`.

## Setup

1. Create a key at [Google AI Studio](https://aistudio.google.com/app/apikey).
2. In `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Install dependencies and start the API:
   ```bash
   cd backend
   .venv\Scripts\activate         # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
4. Ask the AI Assistant a question — the answer now comes from Gemini.

To change the model (for example to a newer Flash release), update `GEMINI_MODEL`
and restart; no code changes are needed.

## Tests

```bash
cd backend
.venv\Scripts\python.exe -m pytest tests/test_gemini_service.py tests/test_diagnosis_parser.py tests/test_assistant_context.py
```

`tests/test_gemini_service.py` covers configuration errors, provider-error mapping,
secret redaction, request shape, and vision parsing — with the Gemini boundary
mocked, so no key or network access is required.
