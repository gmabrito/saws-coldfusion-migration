# Migration Log - Print Shop Module (BRD Approach)

## Approach
BRD-driven migration -- functionality derived from department name "Print Shop" (print job request and tracking system)

## Decisions Made
- Single route module `jobs.js` handles all print job CRUD operations
- Print job submission requires authentication (internal employees only)
- Status workflow: Submitted -> InProgress -> Completed (or Cancelled at any stage)
- Rush order flag tracked as boolean on PrintJobs table, displayed as orange badge in UI
- Soft-delete pattern for cancellation (status update, not row deletion)
- CompletedDate auto-set when status transitions to Completed
- Department and Employee foreign keys reference shared dbo tables per project convention
- Paper size options: Letter, Legal, Tabloid, A4, Custom
- Color type options: Color, Black & White
- Status timeline on detail page built from existing date fields

## Requirements Covered
- Print job submission form with title, description, quantity, paper size, color type, department, rush order
- Print job listing with status and department filters
- Print job detail view with status timeline
- Status update workflow (admin can advance status)
- Job cancellation (soft delete via status change)
- JWT authentication for protected operations

## Known Gaps
- No file upload for print-ready documents (would require file storage integration)
- Department dropdown is hardcoded; production would fetch from dbo.Departments
- No email notification when job status changes
- No print shop staff role differentiation (uses generic ADMIN role)
- No job priority queue or scheduling system

## Notes
- Uses `printshop` schema per project convention, shared with print-shop-final module
- Minimal BRD content -- all functionality derived from "Print Shop" department name
- Status badges use SAWS brand orange (#f28428) for rush orders
