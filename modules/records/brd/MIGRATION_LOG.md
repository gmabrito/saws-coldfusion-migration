# Migration Log

## Approach
BRD-driven migration. All functionality derived from the Records BRD Section 6.1 business process description.

## Decisions Made

1. **Schema design**: Created `records.RetentionCodes`, `records.Transmittals`, and `records.BoxIndexes` tables under the `records` schema, following the project convention for per-module schemas.
2. **Stored procedures**: All database operations use parameterized stored procedures prefixed with `usp_` (e.g., `records.usp_GetTransmittals`, `records.usp_SearchBoxIndexes`) per project convention.
3. **Transmittal-Box relationship**: Modeled as one-to-many. A transmittal is the header/form; box indexes are the line items. Cascade delete on transmittal removal.
4. **Retention codes**: Seeded with 17 common SAWS retention categories. Each code has a retention period in years used to auto-calculate disposition dates on the client.
5. **Status workflow**: Draft -> Submitted -> Reviewed -> In Storage -> Disposed. Departments create in Draft/Submitted; Records Management advances through remaining statuses.
6. **Keyword search**: Searches across BoxIndexes.Keywords, BoxIndexes.Description, and BoxIndexes.BoxNumber using LIKE patterns, matching the BRD requirement for keyword-based box identification.
7. **Auto-disposition date**: Client auto-calculates disposition date from retention date + retention code years for convenience.
8. **Auth**: JWT-based mock auth with three prototype roles (admin, records, user) matching the pattern used across other modules.
9. **Delete permissions**: Only admin and records roles can delete transmittals, since Records Management department owns the records lifecycle.
10. **Box index replacement on edit**: PUT endpoint replaces all box indexes within a transaction rather than diffing individual boxes, simplifying the edit flow.

## Requirements Covered

- 6.1 - Record, edit, and retrieve record indexes (CRUD operations on transmittals and box indexes)
- 6.1 - Submit records indexes of SAWS records which require offsite storage (transmittal form with box entries)
- 6.1 - Keyword searches to identify boxes with potentially relevant records (search endpoint and page)
- 6.1 - Identify corresponding retention code and retention date for disposition eligibility (retention code dropdown, retention/disposition date fields)
- 6.1 - Departments submit records indexes to Records Management (department-scoped transmittal submission)
- 6.1 - Request reviewed and recovered from storage by records department (status workflow: Reviewed, In Storage)

## Known Gaps

- No Section 7 explicit requirements were extracted from the BRD, so all functionality is derived from Section 6.1 business process description
- No email notifications for transmittal status changes (not specified in BRD)
- Department list is hardcoded in the client prototype; production would query dbo.Departments
- No file attachment support (not mentioned in BRD)
- No print/export of transmittal forms (not mentioned in BRD)

## Notes

- Tech stack matches project standard: Express 4 + mssql/msnodesqlv8 backend, React 19 + Vite + React Router DOM 7 frontend
- All SQL uses parameterized queries via stored procedures to prevent injection
- Client uses SAWS brand colors (#0078AE blue, #005A87 navy, #f28428 orange)
- Form validation on both client (inline errors) and server (express-validator)
- Pagination implemented for transmittal list (server-side OFFSET/FETCH)
- Disposition eligibility highlighted in red on search results when date has passed
