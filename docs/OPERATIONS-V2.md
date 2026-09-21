# IntelliPath v2 operations guide

## Run and validate

Use Node 24 or later. Run `npm ci`, `npm test`, `npm run build`, then `npm start`. Tests use an isolated in-memory SQLite database and mock Groq responses; they do not call paid services or modify the live database. The server health response includes `version: "2.2"`. See [the workspace guide](RESOURCE-WORKSPACE.md) for the search-first home, engineer role and uploads.

## Free AI setup (Groq)

1. Create a [GroqCloud account](https://console.groq.com/) and keep it on the **Free plan**. Do not upgrade to Developer or attach payment for this demo. The app cannot detect your billing tier; the same API becomes metered if you upgrade the account.
2. Create an [API key](https://console.groq.com/keys). In Render > this service > Environment, set `GROQ_API_KEY` to the key and `GROQ_MODEL=openai/gpt-oss-120b` (also the default). Save and redeploy once the code is merged. Do not send keys in chat, commit them, or create a `VITE_` key.
3. Open Settings: leave Answer mode on Groq with local fallback. Configuration status means a key is present, not that credentials were validated. Ask AI a question: a successful response is labeled **Groq**, with evidence references. A **Local** response explains why fallback occurred.

The `openai/` model identifier refers to an open-weight model hosted by Groq. All inference requests go to `api.groq.com`; the paid OpenAI API is not called and legacy `OPENAI_API_KEY` / `OPENAI_MODEL` variables are ignored.

Groq currently offers a Free plan with organization-level request/token limits; see your [account limits](https://console.groq.com/settings/limits) and [official rate-limit documentation](https://console.groq.com/docs/rate-limits). Free availability and quotas can change. A 429 response falls back immediately to local retrieval, without retries, another key or a paid provider. Authentication/model permission failures, network timeouts and incomplete answers also fall back with distinct notices. Staying on the Free plan is the billing safeguard, not the model name. [Billing FAQ](https://console.groq.com/docs/billing-faqs).

Only authorized retrieval evidence and this session's recent conversation are sent to Groq. The context is bounded to 12 evidence excerpts and four recent messages; output is capped at 2,048 completion tokens (including reasoning). Only the final answer is displayed. Evidence is a partial retrieval sample. Under [Groq's data policy](https://console.groq.com/docs/your-data), inference content is not normally retained, but reliability/abuse logs may be retained up to 30 days. Zero Data Retention can be enabled in Data Controls; usage metadata is still collected. The demo uses synthetic operational records.

For local development, copy `.env.example` to `.env`, fill it locally, then run `node --env-file=.env server/index.js`. Normal `npm start` reads process environment supplied by Render. Local-only mode never calls a cloud provider. Requests are throttled; only server-owned session history is accepted, expiring after 30 minutes and on server restart. AI cannot change records or grant access. Source cards are retrieved evidence, not a guarantee that every generated sentence is correct.

## Maritime visual theme

The blue-and-white interface draws on [Seatrium's maritime engineering and people-focused values](https://www.seatrium.com/). Navy navigation, white work surfaces, blue primary actions and semantic incident colors replace the earlier neon glass theme. Login and Cybersecurity Center use locally bundled photographic concept artwork of a shipyard, vessel and engineers. The search home uses a rear-view sunrise fleet. These generated images do not depict actual Seatrium personnel or facilities. Official Seatrium logo assets identify the demo context on login, navigation and search; they do not imply endorsement. See [asset provenance](BRAND-ASSETS.md). Mobile layouts preserve the full fleet; the final scene is static. See [maritime UI and migration notes](MARITIME-UI.md).

## Classification and roles

Two controls apply together:

- Named record scope: Viewer sees Viewer records; Engineer adds Engineer records; Analysis adds Analysis records; Manager adds Manager records; Admin sees all five groups. Enforcement precedes counts, listing/detail, search, AI context, reports and downloads.
- Role permissions control actions such as account management, settings and resource writes. Rank is fixed by role. Public site addresses are Viewer records; new audit events default to Admin.

Migration 3 converts existing data to five roles and revokes existing sessions. It preserves record contents and uploaded bytes. User Management changes another account's role and rank together, immediately revoking its sessions; self-role changes are blocked. Person previews never expand the signed-in account's scope. See [migration mapping](MARITIME-UI.md).

## Daily PDF

Cybersecurity Center downloads a real server-generated PDF. The selected date uses Singapore midnight boundaries. Sections follow the six [NIST CSF 2.0 functions](https://www.nist.gov/cyberframework): Govern, Identify, Protect, Detect, Respond, Recover. This is an operational report structure, not a claim of NIST compliance or certification.

Contents include executive counts, sites/assets/exposure, permission workflows, an alert register, incident register, remediation owners/deadlines/status, daily system/audit evidence and an optional complete inventory/knowledge appendix. Critical incident headings are red, alerts amber, remediation green. All severities remain in the report regardless of dashboard threshold. Synthetic observations are explicitly labeled.

Daily activity includes unresolved carry-over records last updated before the end of the selected day. The app has no historical status snapshots; current status and inventory are explicitly disclosed as current, not reconstructed history. Inventory appendix and detailed log inclusion are functional Settings controls. Evidence timestamps retain their recorded offsets (legacy timestamps without offsets are interpreted as Singapore time). PDFs currently use English/Latin text; non-Latin field characters are normalized for the built-in PDF font.

## Sites and demo search

Public addresses were verified on 2026-09-20 against [Seatrium's contact directory](https://www.seatrium.com/contact.php): Admiralty, Benoi, Pioneer, Tuas and Tuas Boulevard Yard. Corporate Headquarters is co-located at Tuas Boulevard; [Seatrium Offshore Technology](https://sot.seatrium.com/contact-us/) lists 50 Gul Road (Pioneer). The directory covers officially published Singapore hub/supporting locations, not undisclosed internal offices. Crescent Yard is absent from the current directory.

Human Resources embeds the selected colleague's illustrative outdoor pin, or the public yard address for indoor/unknown positions, and supplies an external Maps link. Indoor building/floor/room assignments remain a separate diagram. No live GPS feed is connected. The keyless overview is a Google search embed: Google controls its marker results and availability; it is not a custom guaranteed multi-marker layer or physical access system.

The additive dataset supplies 105 new assets, 60 synthetic people, 105 each of documents, maintenance records, incidents, alerts and remediation, plus 105 telemetry records. Combined with the original seeds: 140 assets, 76 people, 540 knowledge/security/email records. Search supports ID/name/serial/IP/content matching, multi-term relevance, kind/site filters, pagination and authorized detail views. Demo documents download as actual Markdown files. Search does not require all words to appear in a single record, which fixes combined person-and-device queries.

## Settings with effects

| Setting | Effect |
|---|---|
| AI mode | Enables configured Groq or forces local retrieval |
| Report inventory appendix | Includes/excludes full inventory and knowledge detail |
| Report evidence logs | Includes/excludes the selected day's system/audit timeline |
| Search page size | Default 10, 20 or 50 results on the next search |
| Alert threshold | Filters dashboard alert counts and recommendations |
| Session hours | Expiry for newly issued login sessions, 1-168 hours |

Classification and audit recording cannot be disabled. Old engine/governance switches were removed because they did not control a functioning integration.

## Migration and deployment

Startup uses an additive transaction and a migration marker. Existing rows/accounts/settings are retained; new demo IDs are inserted idempotently. `npm run seed` remains a destructive local demo reset and now resets the extended data consistently. Back up durable data before deliberate resets.

The repository's Render blueprint auto-deploys master. Its free-tier filesystem is ephemeral, so deployment/restart can recreate the SQLite database and reset all demo accounts/data. The migration cannot provide persistence across filesystem loss. Keep the change on its feature branch until a deployment is intended; for persistent use attach storage or migrate the database separately. No paid infrastructure was provisioned by this change.

## Validation

Regression tests cover all five role scopes, forged preview/direct object access, search scoping and pagination, document/PDF access, account-session revocation, settings validation/effects, Singapore date boundaries, request states, and mocked Groq evidence/history/fallback behavior. The UI is checked in desktop and 390px layouts; no horizontal document overflow is expected. PDF samples are rendered and checked for page numbers, section coverage and text bounds. Real Groq credentials and the live Render deployment require separate post-deploy verification.
