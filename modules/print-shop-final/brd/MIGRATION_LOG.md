# Migration Log - Print Shop Final Module (BRD Approach)

## Approach
BRD-driven migration -- enhanced version of Print Shop module adding dashboard and approval workflow

## Decisions Made
- Extends print-shop module with two additional features: dashboard summary and rush order approval
- Dashboard endpoint aggregates jobs by status and department using parallel SQL queries for performance
- Rush order approval is a separate endpoint (`PUT /api/jobs/:id/approve`) requiring ADMIN role
- Approved rush orders transition to InProgress; denied rush orders transition to Cancelled
- Dashboard is the default landing page (home route) to give managers an overview
- Shares the same `printshop` database schema as the base print-shop module
- Dashboard cards use color-coded top borders matching status badge colors
- Recent jobs table on dashboard limited to 10 most recent entries
- Rush order approval UI shown as inline alert banner on job detail page

## Requirements Covered
- All print-shop base functionality (job CRUD, status workflow, filtering)
- Dashboard with summary cards (total jobs, submitted, in progress, completed)
- Dashboard with recent jobs table and department breakdown
- Rush order approval workflow (admin approve/deny with notes)
- Role-based access control for approval actions

## Known Gaps
- No historical dashboard data or date range filtering (shows all-time stats)
- No chart visualizations (text/table-based dashboard only)
- No batch approval for multiple rush orders
- Department dropdown is hardcoded; production would fetch from dbo.Departments
- No export/download of dashboard data

## Notes
- Shares `printshop` schema with print-shop module -- both modules can coexist on same database
- SQL schema file includes IF NOT EXISTS guards for safe re-execution
- Added filtered index on RushOrder for approval query performance
- Dashboard route registered before `:id` param route to avoid route conflict
