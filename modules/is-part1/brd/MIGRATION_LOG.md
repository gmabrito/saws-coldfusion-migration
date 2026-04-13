# Migration Log

## Approach
BRD-driven

## Decisions Made
- Implemented BRD 7.1 Emergency SMS Text Message Notification Opt-in as the primary feature
- Used soft-delete for opt-out (IsActive flag) to preserve consent audit trail
- Notification types defined as server-side constants matching BRD spec: Inclement/Emergency Weather, Fire Alarm, Hazardous Chemical Incident, Emergency Lockdown, Other Emergencies
- Disclosure form download implemented as client-side text blob; in production this would serve the actual PDF from SAWS
- Phone number validated as 10-digit US format
- Consent checkbox required before form submission per BRD 7.1 disclosure requirements
- Admin view includes expandable preference details per opt-in record
- Authorization enforced: employees can only modify/delete their own opt-ins, admins can manage all
- Used is_sms schema per project convention for module-specific tables

## Requirements Covered
- 7.1 Emergency SMS Text Message Notification Opt-in (opt-in form, notification type selection, phone number entry, disclosure download, consent acceptance, opt-out capability)
- 7.2 Technical Requirements (SQL Server schema with indexes, stored procedures with usp_ prefix, RESTful API, JWT authentication, express-validator input validation)
- 7.3 Report Requirements (Admin view with search/filter, status filtering, preference detail expansion)

## Known Gaps
- Actual SMS sending integration not implemented (would require Twilio or similar provider)
- PDF disclosure form not available; using plain text placeholder
- Employee lookup from dbo.Employees depends on shared table being populated
- No bulk notification send capability (out of BRD scope)

## Notes
- Server runs on port 3001, client on port 5173 with Vite proxy to server
- Mock login supports "admin" (admin role) and "employee" (user role) usernames with any password
- React 19 + Vite + React Router DOM 7 stack per project conventions
- SAWS branding colors applied: Blue #0078AE, Navy #005A87, Orange #f28428
