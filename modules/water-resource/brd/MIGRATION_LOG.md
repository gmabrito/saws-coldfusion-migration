# Migration Log

## Approach
BRD-driven

## Decisions Made
- Used `waterresource` schema per project convention for module-specific tables
- Single `DailyReadings` table stores all daily data (county water levels, weather, pumpage) since data is manually entered as a single daily record per BRD
- Water levels tracked for 5 counties: Bexar, Medina, Uvalde, Comal, Hays (stored as columns rather than rows since the county list is fixed)
- Unique constraint on ReadingDate ensures one reading per day
- Mock data fallback in client pages for prototype demonstration when API server is not running
- Stored procedures use `usp_` prefix per project convention
- Three user roles: admin (full access), operator (data entry), user (read-only dashboard and readings)
- Temperature stored in Fahrenheit, water levels in feet above mean sea level (ft MSL), precipitation in inches, pumpage in acre-feet
- 30-day rolling window for dashboard summary statistics

## Requirements Covered
- 7.1 Functional Requirements: Display 30-day aquifer stats (dashboard with summary cards, county water levels, recent readings table)
- 7.1 Aquifer & Water Stats: Water levels for 5 counties (Bexar, Medina, Uvalde, Comal, Hays), daily precipitation, daily temperatures, total pumpage
- 7.1 Manual Data Entry: Admin/operator form for entering daily readings with full validation
- 7.3 Report Requirements: Daily readings table with date range filter for reporting

## Known Gaps
- No chart/graph visualizations (could be added with a charting library)
- No data export to CSV/PDF for reports (BRD 7.3 may require this)
- No historical trend analysis beyond 30-day window
- No email notifications or alerts for threshold levels
- Employee FK reference assumes shared dbo.Employees table exists

## Notes
- All stored procedures use parameterized inputs to prevent SQL injection
- Client includes mock data fallback so the UI can be previewed without a running database
- Express-validator used for server-side input validation on all POST/PUT endpoints
- Dashboard summary cards show both latest values and 30-day averages for context
- County water levels displayed as individual cards with min/max/avg statistics
