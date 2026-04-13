# Migration Log

## Approach
BRD-driven

## Decisions Made
- Directory page (BRD 7.1) is publicly accessible without login; admin schedule management requires authentication
- On-call assignments are stored in the `oncall` schema with foreign keys to shared `dbo.Departments` and `dbo.Employees` tables
- Contact phone is stored per-assignment (not per-employee) to allow on-call-specific phone numbers
- Mock AD auth with JWT for prototype; three roles: admin, manager (can manage schedules), user (read-only)
- Current on-call view groups entries by department with employee name, phone, email, and date range
- Schedule list supports filtering by department and date range with pagination (BRD 7.3 report requirements)
- Date range validation enforced on both client and server (end date must be after start date)
- All SQL uses parameterized queries via stored procedures prefixed with `usp_`

## Requirements Covered
- 7.1 - On-Call Directory: current on-call schedule grouped by department with contact info (phone, email)
- 7.2 - Enhancements / Functional Requirements: CRUD operations for on-call assignments, department/employee selection, date range scheduling, phone per assignment, notes field
- 7.3 - Report Requirements: filterable schedule listing by department and date range with pagination

## Known Gaps
- No email/SMS notification when on-call assignments change (would require external service integration)
- No recurring schedule pattern support (e.g., weekly rotation); each assignment is a discrete date range
- Employee list comes from dbo.Employees which must be pre-populated; no employee management UI in this module
- No export to PDF/Excel for reports (could be added as enhancement)

## Notes
- Schema uses `oncall.Assignments` table with CHECK constraint ensuring EndDate > StartDate
- The `usp_GetCurrentOnCall` procedure uses `CAST(GETDATE() AS DATE) BETWEEN StartDate AND EndDate` for current on-call lookup
- Schedule query uses overlapping date range logic: `EndDate >= @StartDate AND StartDate <= @EndDate`
- Client uses React 19, Vite, React Router DOM 7, and Axios following project conventions
- SAWS brand colors applied consistently: Navy (#005A87) header, Blue (#0078AE) nav, Orange (#f28428) active indicator
