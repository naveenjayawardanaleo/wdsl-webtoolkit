# WDSL WebToolkit

An AI-powered web accessibility and UX analyzer with dual user roles (developer/client) and an admin panel, built as a Final Year Project. Combines rule-based scanning (axe-core + Google Lighthouse), a fine-tuned EfficientNet-B0 computer vision model, and a Gemini-powered AI Suggestion Generator behind a shared collaboration workspace.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS v4, React Router
- **Backend**: Python + Flask, SQLAlchemy, JWT auth (Flask-JWT-Extended)
- **Database**: MySQL
- **Scanning**: Playwright + axe-core, Google Lighthouse (via a Node subprocess)
- **AI/ML**: PyTorch (EfficientNet-B0 screenshot classifier), Google Gemini (AI Suggestion Generator)

## Prerequisites

- Python 3.10+ with a virtualenv
- Node.js 18+
- A MySQL server reachable locally (or update `DATABASE_URL` to point elsewhere)

## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
playwright install chromium
cp .env.example .env   # then fill in MySQL credentials, JWT secret, and (optionally) GEMINI_API_KEY
python app.py           # runs on http://localhost:5000, creates tables on first boot
```

Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE` | MySQL connection (or set `DATABASE_URL` directly to override) |
| `JWT_SECRET_KEY` | Signing key for auth tokens — set to a real random string outside local dev |
| `GEMINI_API_KEY` | Google Gemini API key for the AI Suggestion Generator. If blank, `/api/analyze` still works and returns a clearly-labeled fallback suggestion instead of a real AI-generated one |

### 2. Lighthouse runner (Node)

```bash
cd automation
npm install
```

This installs `lighthouse` + `chrome-launcher`, invoked as a subprocess from the backend during each scan. No separate server to run — the backend calls `node run_lighthouse.js <url>` itself.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # runs on http://localhost:5173
```

## Running the tests

```bash
cd backend
pytest -m "not slow" -q   # fast subset: no browser, no CV model, no Gemini call
pytest -q                 # full suite, including Playwright/CV model/Gemini integration tests
```

Tests are grouped to match the dissertation's test plan (TC1 Authentication through TC7 Subscriptions — see `backend/tests/`).

## Seeding demo data & capturing dissertation screenshots

```bash
cd backend
python seed.py                                  # creates one developer, one client, one admin, and a demo report
python capture_screenshots.py http://localhost:5173   # logs in as each role and screenshots every page
```

Screenshots are saved to `screenshots/` with filenames matching the dissertation's Implementation chapter figure captions (`fig_6_1_...png` through `fig_6_13_...png`).

Demo accounts created by `seed.py` (password `demopass123` for all three):

- `developer@wdsl-demo.test` — active subscription (gets AI suggestions)
- `client@wdsl-demo.test` — no subscription
- `admin@wdsl-demo.test` — no subscription

## Business model note

Per the project proposal, the scan itself (axe-core report, Lighthouse scores, accessibility score, screenshot) is free for every developer account. Only AI-generated suggestions (Task 1) are the subscription-gated premium feature, checked per-developer at the point suggestions are generated. Subscriptions are granted/revoked only by an admin from the admin panel — there is no self-service payment flow.

## Known limitation: CV model accuracy

The screenshot classifier's fine-tuning validation accuracy (~83-84%) is materially higher than its held-out inference accuracy (68%, 200 screenshots). See `AImodels/model_evaluation_notes.md` for the investigation — the root cause couldn't be conclusively isolated because the original training script and dataset split aren't preserved in this repository.
