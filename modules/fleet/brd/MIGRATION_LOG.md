# Migration Log

## Approach
BRD-driven

## Decisions Made
- Derived BRD requirements from department name: Fleet vehicle management with basic CRUD for vehicles and maintenance logs
- Vehicle status uses three-state enum: Active, Maintenance, Retired with CHECK constraint in SQL
- Maintenance log automatically updates vehicle mileage when a higher mileage entry is logged
- VIN field is optional (17-char when provided) since not all fleet vehicles may have VINs readily available
- Maintenance types provided as a predefined list in the client (Oil Change, Tire Rotation, Brake Service, etc.)
- Used fleet schema per project convention for module-specific tables
- Vehicle detail page shows aggregated total maintenance cost
- Department and employee assignments use FK references to shared dbo tables

## Requirements Covered
- Vehicle CRUD: list with filters (status, department, search), detail view, add, edit
- Maintenance logging: date, type, description, cost, mileage, performed-by fields
- Vehicle detail includes full maintenance history table sorted by date descending
- Search/filter on vehicle list by vehicle number, make, model, VIN, status

## Known Gaps
- No department dropdown populated from dbo.Departments (uses raw ID input); would need a /api/departments endpoint
- No employee dropdown for assignment (uses raw ID input); would need a /api/employees endpoint
- No vehicle deletion endpoint (intentional -- fleet records should be retired, not deleted)
- No file attachments for maintenance records (receipts, photos)
- No reporting/export functionality

## Notes
- Server runs on port 3002, client on port 5174 with Vite proxy to server
- Mock login supports "admin" (admin role) and "fleet" (user role) usernames with any password
- React 19 + Vite + React Router DOM 7 stack per project conventions
- SAWS branding colors applied: Blue #0078AE, Navy #005A87, Orange #f28428
- Maintenance form uses orange accent button to visually distinguish from standard CRUD operations
