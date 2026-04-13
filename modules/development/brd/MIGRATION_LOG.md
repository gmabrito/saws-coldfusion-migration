# Migration Log

## Approach
BRD-driven

## Decisions Made
- Used the `development` schema for all tables per the project-wide schema strategy.
- Meetings support full CRUD plus document metadata tracking and inline minutes editing (BRD 7.1).
- Contractor Registry supports full CRUD with search/filter by company name, contact, license number, status, and license type (BRD 7.2).
- Document "upload" is metadata-only at this stage; actual file storage would be added during production integration.
- Minutes are stored as NVARCHAR(MAX) to allow free-form meeting notes maintained during meetings.
- Mock login endpoint provided for development/testing; production will use shared AD/JWT auth from `shared/ui-shell`.
- Used parameterized SQL throughout all routes (no raw string interpolation).
- Server port defaults to 3007 to avoid conflicts with other module servers.
- Client Vite dev server proxies `/api` to the Express backend on port 3007.
- Seed data included in schema.sql for immediate UI testing.

## Requirements Covered
- **7.1** CIAC Meetings - Create, read, update, delete meetings; upload document metadata; maintain meeting minutes
- **7.2** Authorized Contractors/Plumbers Registry - Register, search, filter, edit, and remove contractors/plumbers
- **7.3** Report Requirements - Listing views serve as the primary reporting interface; data is sortable and filterable

## Known Gaps
- File upload is metadata-only; binary file storage (Azure Blob, file system) not implemented in this prototype.
- BRD 7.3 report export (PDF/Excel download) not yet implemented; data is viewable in the list/detail views.
- No email notification integration for meeting reminders.
- Shared UI shell (`@saws/ui-shell`) import not wired up; standalone Layout component used for the prototype.

## Notes
- All API routes use `express-validator` for input validation.
- Both client and server follow the patterns established in the `saws-fhm` reference module.
- SQL schema uses CHECK constraints for Status and LicenseType enums.
- The contractor search leverages server-side LIKE queries with parameterized inputs.
