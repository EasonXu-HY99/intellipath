# Resource Workspace v2.1

Sign in with the **Engineer** demo preset to start at Resource Workspace. Search files, people, devices or agents; filter by type, site or illustrated application source. Select a result to inspect its record, locate a colleague or download a file. Existing Command Center, AI Assistant and security tools remain available according to role.

## Agent search

**Let agents help** selects local specialists based on query terms or a chosen resource type. The coordinator executes each specialist's scoped search and merges ranked results. Specialist cards explicitly select a single agent. Execution cards show actual match counts and each result names its finder. The Agents filter searches the capability directory itself.

The five specialists cover engineering documents/maintenance, people/places, devices, security evidence, and simulated email handovers. These are deterministic local search agents, available without a cloud key. They are not Microsoft-hosted agents or autonomous external integrations. Each specialist returns up to 50 matches; direct search offers pagination through the entire authorized index. Keyword matching works best with names, IDs, room numbers and terms present in the records. Conversational Groq Q&A remains in AI Assistant.

## People and locations

People & Places supports name, department, assignment, building and room searches plus site/building/floor filters. Selecting a colleague shows the assigned building, floor and room. Floor buttons update the schematic; a different floor does not falsely relocate the person.

Sixty synthetic colleagues have illustrative assignments across the five published Singapore sites. Building names and room positions are demo data, not actual Seatrium floor plans, live presence or navigation guidance. Legacy records with no building data retain that unknown status. Google Maps links locate the published yard address separately.

## Upload and search

Admin, manager, analyst and engineer roles have `files.upload`; viewers do not. The engineer defaults to L4. Files must be classified between L1 and the uploader's clearance. Search, agent results, record detail, AI evidence and original download follow the same server-side classification boundary.

- Maximum file size: 5 MB; demo storage quota: 50 MB per uploader and 100 MB in total.
- Supported extensions: TXT, MD, CSV, JSON, PDF, DOCX, XLSX, PPTX, PNG, JPG, JPEG.
- UTF-8 text files index their first 50,000 characters. Other files index filename, description, owner and site; OCR and binary document extraction are not implemented.
- Bytes are stored in SQLite and served only through an authenticated attachment download with `nosniff`. No public upload directory is exposed.
- The **OneDrive demo target** records intent but stores the file in IntelliPath. No Microsoft login, upload or synchronization occurs. All Microsoft source badges are explicitly marked demo.

Render free-tier storage is ephemeral: files and new records can be lost on redeploy or restart. Keep originals. Durable storage would be a separate infrastructure change; no paid services are provisioned here.

## Data and migration

An additive, idempotent migration adds location fields, upload storage, source metadata, an engineer demo account and 15 simulated Exchange messages. Combined seed totals are 140 devices, 76 people and 540 knowledge/security/email records. Existing records and accounts are preserved when the SQLite database survives. `npm run seed` deliberately resets demo data, including uploads.

## Verification

The 20-test regression suite covers classification and prior operations features plus repeatable migration, specialist delegation/source filters, upload validation, original byte downloads and viewer denial across search/detail/download. Desktop and 390px browser checks cover the search home, source icons, people floors and actual local file upload followed by agent retrieval. No real Microsoft account is connected.
