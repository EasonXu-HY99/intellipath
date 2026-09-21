# IntelliPath — Resource Workspace v2.2

Search-first resource workspace for files, people, devices and specialist agents, with five named access roles, Groq Free-plan AI integration and cybersecurity PDF reports. See [the resource workspace guide](docs/RESOURCE-WORKSPACE.md) for uploads, local agent delegation and people location; [the operations guide](docs/OPERATIONS-V2.md) covers configuration and reporting.

A full-stack operational intelligence dashboard for tracking enterprise
devices, personnel, cybersecurity access levels, permission request
workflows, AI recommendations, and audit/system logs — with role-based
access control and a blue-and-white maritime engineering interface.

Originally a single-file React prototype (`prototype/intellipath_full_gui_prototype.jsx`),
now a complete application with a real database, REST API, and authentication.

**Live:** https://intellipath-mroh.onrender.com/

## Features

- **Maritime search landing** — a single search bar over a photographic rear-view sunrise fleet; one to five decorative ships according to role, and a photographic shipyard sign-in screen. See [visual design notes](docs/MARITIME-UI.md).
- **Login & role-based access** — 5 seeded accounts, including an engineer, each with different
  permissions and a different UI (navigation + actions are filtered by role)
- **User management** — create/remove accounts, change password (admin only)
- **Cybersecurity Center** — authorized inventory metrics, incidents, alerts, remediation and daily PDF reports
- **AI Assistant** — Groq chat completions (GPT-OSS 120B, Free plan supported) over authorized evidence, session-owned conversation context, source references and explicit local fallback
- **Resource Workspace home** — ranked, paginated search across people, devices, files, agents, email, maintenance, incidents, alerts, remediation, locations, requests and logs; source filters, downloads and record details
- **Agent discovery and delegation** — coordinator selects five local specialist search agents, combines authorized results and shows which agents searched and found each record; no API key needed
- **Human Resources** — indoor building/floor/room assignments and outdoor yard maps for synthetic colleagues; unknown locations remain unknown
- **File upload** — engineer and operational roles can upload classified files up to 5 MB; UTF-8 text is indexed, binary files are searchable by metadata; original files can be downloaded
- **Microsoft ecosystem** — Teams, OneDrive, SharePoint, Exchange, Defender and Sentinel logos illustrate demo sources; OneDrive upload target is explicitly a local-only demo
- **Daily cybersecurity PDF** — Singapore reporting day, unresolved carry-over, severity highlights, remediation ownership/deadlines, evidence and authorized inventory appendix
- **Singapore site directory** — five officially published sites, exact-address Google Maps selection and links; headquarters shares the Tuas Boulevard location
- **Asset Inventory** — device registry (make/model/serial/IP/OS/health),
  named access rules (Admin, Manager, Analysis, Engineer, Viewer), access result per user, permission request
  flow, new device / new request forms
- **Activity Log** — audit trail + system/device event logs; CSV export
- **Settings** — functional AI mode, report contents, alert threshold, search page size and new-session lifetime controls
- **Maritime UI** — navy navigation, white surfaces, photographic shipyard/engineer concept imagery, responsive layouts and accessible status colors

## Demo accounts

| Username | Name          | Role               | Password       | Access |
|----------|---------------|--------------------|----------------|--------|
| `engineer` | Demo Engineer | Engineer | `Engineer@2026` | Search, AI, people/devices, upload |
| `admin`  | Haiyang Xu    | Admin              | `Admin@2026`   | Everything + user management |
| `fsun`   | Feiyong Sun   | Manager            | `Manager@2026` | Resources (read/write), audit, settings |
| `mlim`   | Mary Lim      | Analysis           | `Analyst@2026` | AI, search, audit, resources (read) |
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
server/          Express API + SQLite schema/seed + RBAC/classification + grounded AI + PDF
client/          Vite + React + Tailwind frontend (maritime blue-and-white theme)
prototype/       original single-file JSX prototype (kept for reference)
data/            SQLite database file (git-ignored, auto-created)
render.yaml      Render blueprint for one-click deployment
```

## Local development

```bash
npm install
npm run dev          # starts API on :8080 + Vite dev server on :5173 (proxies /api)
npm test             # isolated in-memory API and authorization regression tests
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
| POST   | `/api/ai/ask`                 | grounded Q&A `{ prompt, conversationId? }` | ai |
| GET    | `/api/search?q=&kind=&site=&page=` | classified multi-type search | search |
| GET    | `/api/records/:id`            | authorized record detail | search |
| GET    | `/api/documents/:id/download` | original uploaded file or seeded Markdown | search |
| GET    | `/api/workspace`              | local agent and illustrated source directory | search |
| POST   | `/api/agents/search`          | delegated local search with execution trace | search |
| POST   | `/api/files/upload`           | classified file and searchable metadata | files.upload |
| GET    | `/api/sites`                  | official Singapore site directory | authenticated |
| GET    | `/api/reports/daily.pdf?date=YYYY-MM-DD` | cybersecurity PDF | overview |
| PUT    | `/api/users/:id/clearance`    | change role and rank; revoke target sessions | users |
| GET/PUT | `/api/settings`             | validated operational preferences | settings |

## Database

SQLite is provided by Node 24's built-in `node:sqlite` module — zero external
services and zero native build steps. The database is created automatically at
`data/intellipath.db` and seeded with demo data (140 devices, 76
people, 540 knowledge/security/email records, audit + system logs, 5 accounts) on first boot.
New synthetic records use DEMO IDs and example.invalid addresses. They are not actual Seatrium incident, employee or telemetry records.

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
