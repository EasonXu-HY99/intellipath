# IntelliPath — Smart Operations Platform

A full-stack operational intelligence dashboard for tracking enterprise
resources, personnel, cybersecurity access levels, permission request
workflows, AI recommendations, and audit logs.

Originally a single-file React prototype (`prototype/intellipath_full_gui_prototype.jsx`),
now a complete application with a real database and REST API.

## Features

- **Command Center** — live metrics, operational flow, AI recommendations, system checks
- **AI Assistant** — natural-language Q&A over live data (rule-based engine, LLM-ready)
- **Central Search** — search people and resources across the whole directory
- **Resource Tracking** — permission registry, cybersecurity level rule (L1–L7),
  access result per user, permission request flow, new resource / new request forms
- **Audit Logs** — every mutation is recorded; CSV export
- **Settings** — AI engine + governance toggles persisted to the database

## Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Frontend  | React 18 + Vite 6 + Tailwind CSS v4               |
| Backend   | Node.js + Express 4 (ESM)                         |
| Database  | SQLite via Node's built-in `node:sqlite` (no native deps) |

## Project layout

```
server/          Express API + SQLite schema/seed + rule-based AI engine
client/          Vite + React + Tailwind frontend
prototype/       original single-file JSX prototype (kept for reference)
data/            SQLite database file (git-ignored, auto-created)
render.yaml      Render blueprint for one-click deployment
```

## Local development

```bash
npm install
npm run dev          # starts API on :8080 + Vite dev server on :5173 (proxies /api)
```

Open http://localhost:5173.

## Production build & run

```bash
npm run build        # builds client/ -> client/dist
npm start            # serves API + static frontend on :8080
```

## API

| Method | Path                        | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/api/health`               | health check                         |
| GET    | `/api/metrics`              | dashboard metrics                    |
| GET    | `/api/resources?userId=`    | resources + access result per user   |
| POST   | `/api/resources`            | create a resource                    |
| GET    | `/api/people`               | people directory                     |
| GET    | `/api/level-rules`          | cybersecurity level rules            |
| GET    | `/api/permission-requests`  | permission requests + steps          |
| POST   | `/api/permission-requests`  | create a permission request          |
| GET    | `/api/audit-logs`           | audit trail                          |
| POST   | `/api/audit-logs`           | append an audit entry                |
| GET    | `/api/ai/recommendations`   | AI recommendations                   |
| POST   | `/api/ai/ask`               | rule-based Q&A `{ prompt }`          |
| GET    | `/api/search?q=`            | unified people + resource search     |
| GET/PUT| `/api/settings`             | engines + governance toggles         |

## Database

SQLite is provided by Node 24's built-in `node:sqlite` module — zero external
services and zero native build steps. The database file is created automatically
at `data/intellipath.db` and seeded with demo data on first boot.

Reset demo data at any time:

```bash
npm run seed
```

## Deployment

### Render (recommended)

1. Push this repo to GitHub (see below).
2. In [Render](https://render.com), choose **New + → Blueprint** and point it at
   the repo. `render.yaml` defines the web service, or create a **Web Service**
   manually with:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment: `NODE_VERSION=24.2.0`, `DB_PATH=data/intellipath.db`

> ⚠️ Render's **free** tier has an *ephemeral* filesystem, so the SQLite file is
> reset on each deploy/restart (the app auto-reseeds, so it keeps working but
> new data is lost). For durable data, add a **persistent disk** (Render paid
> feature) or swap to a hosted PostgreSQL later — the data-access layer is
> isolated in `server/db.js` for that migration.

## GitHub

```bash
git init
git add .
git commit -m "Initial commit: IntelliPath full-stack app"
gh repo create EasonXu-HY99/intellipath --private --source . --push
```
