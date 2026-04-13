# Migration Log

## Approach
BRD-driven

## Decisions Made
- Implemented two features from BRD Section 6.1: Weekly Job Email and Inactive Employee Directory
- Job listings stored in hr.JobListings table with Internal/External type distinction per BRD
- Inactive Employee Directory reads from shared dbo.Employees table (WHERE IsActive = 0) rather than duplicating data
- Email generation endpoint produces HTML content for preview; actual SMTP sending is a deployment concern not specified in BRD
- Employee photos referenced via PhotoURL column on dbo.Employees; photo storage/upload not in scope per BRD
- Mock Active Directory authentication follows shared project conventions
- Admin role required for job CRUD and email generation; read-only access for authenticated users

## Requirements Covered
- 6.1 Weekly Job Email: manual job entry, internal/external positions, weekly email generation
- 6.1 Inactive Employee Directory: centralized inactive employee info with photos, search by name/department

## Known Gaps
- No explicit Section 7 requirements detected in BRD; implementation based on Section 6.1 descriptions
- SMTP email delivery not implemented (BRD says "sent out Friday afternoon" but no SMTP config specified)
- Scheduled Friday afternoon trigger not implemented (would require cron job or Windows Task Scheduler in production)
- Photo upload mechanism not specified in BRD; assumes PhotoURL is pre-populated in dbo.Employees
- User roles section (Section 8) had no detailed role definitions in BRD

## Notes
- Original ColdFusion endpoint: https://internal/intranet/departments/HR/JobListings/List.cfm
- Job listings support three statuses: Active, Closed, Draft
- Pagination implemented for inactive employee directory to handle large datasets
- Email preview page allows admin to review content before distribution
