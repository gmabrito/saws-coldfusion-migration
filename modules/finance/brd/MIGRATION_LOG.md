# Migration Log - Finance Module (BRD Approach)

## Approach
BRD-driven migration from `inputs/brds/finance.md`

## Decisions Made
- Split into two route modules: `contracts.js` (7.1) and `readings.js` (7.2) matching BRD sections
- Contract application is public-facing (no auth required) per BRD: "online application reviewed by SAWS employee"
- Reading submission requires authentication per BRD: "consumer logs into SAWS.org"
- Admin review workflow with Approve/Deny + notes per BRD: "employee reviews, customer receives email notification when approved"
- Monthly report endpoint groups readings by contract and period per BRD Section 7.3
- Deposit tracking fields added to Contracts table per BRD: "customer proceeds to SAWS Customer Center to pay for deposit"
- Customer Center field (West Side/East Side) per BRD mention of both locations
- Usage calculated as current - previous reading per BRD: "reading is reported to SAWS preventative maintenance"

## Requirements Covered
- 7.1 Fire Hydrant Meter Contracts: application form, admin review, approval workflow, email notification placeholder
- 7.2 Fire Hydrant Meter Reading Reports: monthly reading submission, contract lookup, report generation
- 7.3 Report Requirements: monthly report with contract details and readings

## Known Gaps
- INFOR integration mentioned in BRD ("information is updated in INFOR") not implemented -- would require INFOR API specs
- Email notification on approval referenced but not implemented (no SMTP config in prototype)
- Payment/deposit verification workflow tracked in DB but no Supply department integration
- "Every 20th of the month" reading deadline displayed in UI but not enforced server-side

## Notes
- BRD mentions two distinct features under Finance that map cleanly to separate API route modules
- Database uses `finance` schema per project convention for loose coupling
- Auth uses JWT pattern from saws-fhm reference implementation
