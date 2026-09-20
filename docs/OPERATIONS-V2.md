# IntelliPath v2 operations guide

## Run and validate

Use Node 24 or later. Run `npm ci`, `npm test`, `npm run build`, then `npm start`. Tests use an isolated in-memory SQLite database and mock OpenAI responses; they do not call paid services or modify the live database. The server health response includes `version: "2.0"`.

## OpenAI setup

In the existing Render service's Environment settings, set `OPENAI_API_KEY` to a project-scoped OpenAI key and optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`). Do not put keys in a commit, chat, frontend build variable or Settings field. The app uses the [Responses API](https://developers.openai.com/api/docs/guides/text), sends `store: false`, and reads only authorized evidence. Model/project availability and billing must be enabled on the OpenAI account.

For local development, copy `.env.example` to `.env`, fill it locally, then run `node --env-file=.env server/index.js`. Normal `npm start` reads process environment variables supplied by Render. The Settings page reports whether a key is configured, not whether its credentials/billing were validated. A real request is required for that check.

AI auto mode calls OpenAI when configured. Local-only mode never calls OpenAI. Timeouts, provider errors and incomplete responses fall back to labeled local retrieval. Prompts are bounded, requests are throttled, and only the server's session-owned conversation history is accepted. Conversation state expires after 30 minutes and is cleared on server restart; it is not shared across instances. No AI action changes a record or grants access. Source cards show retrieval evidence, not a guarantee that every model sentence is correct.

## Classification and roles

Two controls apply independently:

- Record classification: account L1 sees only L1; L2 sees L1-L2; ...; L7 sees every classification. Enforcement occurs before counts, list/detail APIs, search, AI context, reports and downloads.
- Role permissions control routes/actions (user management, settings, write operations and AI). A high clearance does not grant an administrative action. Public site addresses are L1. Unclassified legacy audit entries default to L7 because their free text may contain sensitive names and resource details.

Existing accounts migrate once to admin L7, manager L6, analyst L5, viewer L1. New accounts default by role; an administrator can set a different L1-L7 clearance. The Users page can change another account's clearance and immediately revoke that account's sessions. Self-clearance changes are blocked. People-directory clearance is distinct from account clearance; administrator person preview never expands the signed-in account's accessible data.

## Daily PDF

Command Center downloads a real server-generated PDF. The selected date uses Singapore midnight boundaries. Sections follow the six [NIST CSF 2.0 functions](https://www.nist.gov/cyberframework): Govern, Identify, Protect, Detect, Respond, Recover. This is an operational report structure, not a claim of NIST compliance or certification.

Contents include executive counts, sites/assets/exposure, permission workflows, an alert register, incident register, remediation owners/deadlines/status, daily system/audit evidence and an optional complete inventory/knowledge appendix. Critical incident headings are red, alerts amber, remediation green. All severities remain in the report regardless of dashboard threshold. Synthetic observations are explicitly labeled.

Daily activity includes unresolved carry-over records last updated before the end of the selected day. The app has no historical status snapshots; current status and inventory are explicitly disclosed as current, not reconstructed history. Inventory appendix and detailed log inclusion are functional Settings controls. Evidence timestamps retain their recorded offsets (legacy timestamps without offsets are interpreted as Singapore time). PDFs currently use English/Latin text; non-Latin field characters are normalized for the built-in PDF font.

## Sites and demo search

Public addresses were verified on 2026-09-20 against [Seatrium's contact directory](https://www.seatrium.com/contact.php): Admiralty, Benoi, Pioneer, Tuas and Tuas Boulevard Yard. Corporate Headquarters is co-located at Tuas Boulevard; [Seatrium Offshore Technology](https://sot.seatrium.com/contact-us/) lists 50 Gul Road (Pioneer). The directory covers officially published Singapore hub/supporting locations, not undisclosed internal offices. Crescent Yard is absent from the current directory.

Selecting a site changes the Google Maps iframe query to the exact address and supplies an external Maps link. The keyless overview is a Google search embed: Google controls its marker results and availability; it is not a custom guaranteed multi-marker layer or physical access system.

The additive dataset supplies 105 new assets, 60 synthetic people, 105 each of documents, maintenance records, incidents, alerts and remediation, plus 105 telemetry records. Combined with the original seeds: 140 assets, 76 people, 525 knowledge/security records. Search supports ID/name/serial/IP/content matching, multi-term relevance, kind/site filters, pagination and authorized detail views. Demo documents download as actual Markdown files. Search does not require all words to appear in a single record, which fixes combined person-and-device queries.

## Settings with effects

| Setting | Effect |
|---|---|
| AI mode | Enables configured OpenAI or forces local retrieval |
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

Regression tests cover all seven clearances, forged preview/direct object access, search scoping and pagination, document/PDF access, account-session revocation, settings validation/effects, Singapore date boundaries, request states, and mocked OpenAI evidence/history/fallback behavior. The UI is checked in desktop and 390px layouts; no horizontal document overflow is expected. PDF samples are rendered and checked for page numbers, section coverage and text bounds. Real OpenAI credentials and the live Render deployment require separate post-deploy verification.
