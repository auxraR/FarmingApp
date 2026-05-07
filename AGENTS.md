# AGENTS.md

## Repo Layout (Real Entrypoints)
- `backend/` is a Django project (`backend/manage.py`, settings in `backend/core/settings.py`, API routes in `backend/core/urls.py`).
- `frontend/` is a Vite + React app (`frontend/vite.config.js`, entry `frontend/src/main.jsx`).

## Quick Start Commands

### Backend (Django)
- Install deps: `python -m pip install -r backend/requirements.txt`
- Run dev server (port 8000): `python backend/manage.py runserver`
- Run tests (currently minimal): `python backend/manage.py test`

### Frontend (Vite/React)
- Uses `package-lock.json` in `frontend/`, so prefer npm.
- Install deps: `npm install` (run in `frontend/`)
- Run dev server (port 5173): `npm run dev` (run in `frontend/`)
- Lint: `npm run lint` (run in `frontend/`)
- Build: `npm run build` (run in `frontend/`)

## API Contract / Ports
- Frontend Axios base URL is hard-coded: `http://127.0.0.1:8000/api` (`frontend/src/api/client.js`).
- Django exposes API under `/api/` via DRF router (`backend/core/urls.py`):
  - `/api/livestock/`, `/api/batches/`, `/api/feeding/`, `/api/health-actions/`, `/api/weight-control/`

## Backend DB Gotchas (Easy To Miss)
- DB is Microsoft SQL Server via `mssql-django` and `pyodbc` (`backend/core/settings.py`).
- Settings assume:
  - DB name `BaltodanoFarm` on `localhost`
  - Windows integrated auth (`Trusted_Connection=yes;`)
  - ODBC driver name `ODBC Driver 17 for SQL Server`
- Most Django models are `managed = False` (`backend/api/models.py`), so Django migrations are not the source of truth for schema; the tables are expected to already exist in SQL Server.

## CORS / Local Dev
- Backend allows frontend origins `http://localhost:5173` and `http://127.0.0.1:5173` (`backend/core/settings.py`).

## Repo Hygiene
- Root `.gitignore` ignores `node_modules/`, `dist/`, `.vite/`, and Python bytecode; avoid searching/including `frontend/node_modules/` in code reviews or commits.
