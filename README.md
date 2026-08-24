# IntelliPath — Smart Operations Platform

A full-stack operational intelligence dashboard for tracking enterprise
devices, personnel, cybersecurity access levels, permission request
workflows, AI recommendations, and audit/system logs — with role-based
access control and a glassmorphism UI.

Originally a single-file React prototype (`prototype/intellipath_full_gui_prototype.jsx`),
now a complete application with a real database, REST API, and authentication.

**Live:** https://intellipath-mroh.onrender.com/

## Features

- **Login & role-based access** — 4 seeded accounts, each with different
  permissions and a different UI (navigation + actions are filtered by role)
- **User management** — create/remove accounts, change password (admin only)
- **Command Center** — live metrics, operational flow, AI recommendations, system health
- **AI Assistant** — natural-language Q&A over live data (rule-based engine, LLM-ready)
- **Central Search** — search people and devices across the whole directory
- **Resource Tracking** — device registry (make/model/serial/IP/OS/health),
  cybersecurity level rule (L1–L7), access result per user, permission request
  flow, new device / new request forms
- **Logs & Audit** — audit trail + system/device event logs; CSV export
- **Settings** — AI engine + governance toggles persisted to the database
- **Glassmorphism UI** — dark glass surfaces, aurora "flowing light" background,
  lucide icons, custom fonts (no emoji)

## Demo accounts

| Username | Name          | Role               | Password       | Access |
|----------|---------------|--------------------|----------------|--------|
| `admin`  | Haiyang Xu    | Administrator      | `Admin@2026`   | Everything + user management |
| `fsun`   | Feiyong Sun   | Operations Manager | `Manager@2026` | Resources (read/write), audit, settings |
| `mlim`   | Mary Lim      | Security Analyst   | `Analyst@2026` | AI, search, audit, resources (read) |
| `jtan`   | John Tan      | Viewer             | `Viewer@2026`  | Overview, search, resources (read) |

> ⚠️ On Render's free tier the SQLite file is ephemeral, so accounts and data
> reset to these seeds on each redeploy.

## Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Frontend  | React 18 + Vite 6 + Tailwind CSS v4 + lucide-react |
| Backend   | Node.js + Express 4 (ESM)                          |
| Auth      | scrypt password hashing + token sessions (no deps) |
| Database  | SQLite via Node's built-in `node:sqlite` (no native deps) |

## Project layout

```
server/          Express API + SQLite schema/seed + RBAC + rule-based AI engine
client/          Vite + React + Tailwind frontend (glass theme)
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

| Method | Path                          | Description                              | Auth |
|--------|-------------------------------|------------------------------------------|------|
| GET    | `/api/health`                 | health check                             | —    |
| POST   | `/api/auth/login`             | sign in `{ username, password }` → token | —    |
| POST   | `/api/auth/logout`            | end session                              | ✓    |
| GET    | `/api/auth/me`                | current user + permissions               | ✓    |
| POST   | `/api/auth/change-password`   | change own password                      | ✓    |
| GET/POST | `/api/users`                | list / create users                      | admin |
| DELETE | `/api/users/:id`              | delete a user                            | admin |
| GET    | `/api/metrics`                | dashboard metrics                        | ✓    |
| GET    | `/api/resources?userId=`      | devices + access result per user         | resources.read |
| POST   | `/api/resources`              | create a device                          | resources.write |
| GET    | `/api/people`                 | people directory                         | ✓    |
| GET    | `/api/level-rules`            | cybersecurity level rules                | ✓    |
| GET/POST | `/api/permission-requests`  | list / create permission requests        | read/write |
| GET    | `/api/audit-logs`             | audit trail                              | audit.read |
| GET    | `/api/system-logs`            | device/system events                     | audit.read |
| GET    | `/api/ai/recommendations`     | AI recommendations                       | ✓    |
| POST   | `/api/ai/ask`                 | rule-based Q&A `{ prompt }`              | ai     |
| GET    | `/api/search?q=`              | unified people + device search           | search |
| GET/PUT | `/api/settings`             | engines + governance toggles             | settings |

## Database

SQLite is provided by Node 24's built-in `node:sqlite` module — zero external
services and zero native build steps. The database is created automatically at
`data/intellipath.db` and seeded with realistic demo data (35 devices, 16
people, audit + system logs, 4 accounts) on first boot.

Reset demo data at any time:

```bash
npm run seed
```

## Deployment

Deployed on [Render](https://render.com) via the `render.yaml` blueprint
(`autoDeploy` is on, so pushing to `master` redeploys automatically). To
deploy your own copy: **New + → Blueprint** → select this repo → Apply.

> ⚠️ Render's **free** tier has an *ephemeral* filesystem: the SQLite file is
> reset on each deploy/restart (the app auto-reseeds, so it keeps working but
> new data is lost). For durable data, add a **persistent disk** (Render paid
> feature) or swap to a hosted PostgreSQL — the data-access layer is isolated
> in `server/db.js` for that migration.
