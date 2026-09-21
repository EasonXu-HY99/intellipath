# Maritime workspace v2.2

Sign-in pairs photographic concept artwork of a shipyard, vessel and engineers with a white login panel. Every sign-in opens on one search bar over a sunrise fleet. Navigation and upload are in the top-right menu. Results, filters, sources and specialist agents appear only after submission. An empty search browses authorized records. Back to ocean clears results and ignores outstanding responses.

## Five named roles

Access descends through **Admin > Manager > Analysis > Engineer > Viewer**. The fleet contains five, four, three, two or one vessel respectively. The authenticated role determines the image. These decorative vessels do not count real assets.

Internal ranks remain numeric for storage and comparisons. All user-facing access badges, selectors, search metadata, AI instructions and PDF labels use role names. Route/action permissions still apply in addition to record scope.

Migration 3 runs once in a transaction. Old record ranks map `1 -> 1`, `2/3/4 -> 2`, `5 -> 3`, `6 -> 4`, `7 -> 5`; accounts receive the rank of their role. Uploaded bytes and record contents are retained. Old sessions are revoked. Changing an account's access role updates both role and rank and revokes its sessions. Self-role changes are blocked.

## Photographic direction

The rear helicopter perspective follows civilian ships toward a rising sun. The five-ship scene has a large central vessel and two progressively smaller pairs. Separate variants remove ships without cropping the remaining fleet. Static images preserve realistic hulls, wakes and light; there is no procedural ship model, video, animation library or paid runtime service. Mobile layouts preserve the full fleet above the search bar.

`client/public/images/shipyard-dawn.png` and `fleet-1.png` through `fleet-5.png` were generated for this interface. They are labeled concept imagery, not documentary images of Seatrium vessels, facilities or staff. Assets are served locally. See [brand provenance](BRAND-ASSETS.md) for logos.

## People, locations and page names

Human Resources combines a colleague's assigned building/floor/room with an outdoor yard map. Fifteen synthetic colleagues have illustrative outdoor pins, zone labels and recorded timestamps. These are not verified facility coordinates or live tracking. The indoor diagram is also illustrative. Switching a floor never moves a person. People with no assignment retain an unknown location. Google receives coordinates or the public site address, not a person's name or record.

Site maps were removed from AI Assistant. Command Center is now Cybersecurity Center; Resource Tracking is Asset Inventory; Logs & Audit is Activity Log. The incident card aligns to its own content instead of stretching to match the adjacent column.

## Frontend tools evaluated

- [frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design): consulted for typography, subject-specific art direction and visual critique; not globally installed.
- [React Bits](https://reactbits.dev/backgrounds/waves) and [Motion](https://motion.dev/docs/react): reviewed, but static photographic assets meet the final brief without extra dependencies.
- Figma: discovered through the plugin directory; no external design account is required for this existing React project.

Verification covers 22 API/migration tests, a production build, desktop/mobile login and search, role-based fleet variants, indoor/outdoor personnel views, named access labels and the navigation upload entry. Microsoft sources and OneDrive remain explicit demos.
