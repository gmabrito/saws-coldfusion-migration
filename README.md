# SAWS ColdFusion Migration Bakeoff

Side-by-side comparison of two ColdFusion migration approaches for SAWS internal "EZ Link" intranet applications.

## Purpose

Evaluate which migration input produces better results:

- **BRD approach** (`modules/<name>/brd/`) -- AI generates modern code from sanitized Business Requirements Documents
- **Code approach** (`modules/<name>/code/`) -- AI generates modern code from original ColdFusion source

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + React Router DOM + Axios |
| Backend | Express 4 + mssql + msnodesqlv8 |
| Database | SQL Server (shared instance, per-module schemas) |
| Auth | Mock Active Directory provider |

## Repository Structure

```
inputs/          -- Source material (BRDs + CF source code)
shared/          -- Shared UI shell, auth mock, DB schemas, TypeScript types
modules/         -- 14 modules, each with brd/ and code/ subdirectories
docs/            -- Evaluation rubric, module catalog, comparison template
evaluation/      -- Bakeoff results, scoring, screenshots
```

## Modules (14 total)

| Module | Complexity | Description |
|--------|-----------|-------------|
| finance | High | Fire Hydrant Meter contracts + reading reports |
| contracting-v4-1 | High | Bidder/Vendor directory (search, edit, export) |
| records | High | Records Storage Transmittal (CRUD + keyword search) |
| development | High | CIAC Meetings + Contractor/Plumber Registry |
| ceo | Medium | Board Committee & Board Agendas |
| hr | Medium | Weekly Job Email + Inactive Employee Directory |
| water-resource | Medium | Aquifer & Water Stats display |
| oncall-directory | Medium | On-call schedule by department |
| contracting-v4-2 | Medium | Contracting Solicitations admin |
| is-part1 | Low | Emergency SMS Notification Opt-in |
| fleet | Low | Fleet management (minimal BRD) |
| print-shop | Low | Print shop (minimal BRD) |
| print-shop-final | Low | Print shop final (minimal BRD) |
| utility-maps | Low | Utility maps (minimal BRD) |

## Getting Started

```bash
# Install dependencies
npm install

# Set up database
# 1. Copy shared/db/.env.example to shared/db/.env and configure
# 2. Run shared/db/init-schemas.sql against your SQL Server
# 3. Run shared/db/seed/*.sql for mock data
```

## Running a Module

Each module's `brd/` and `code/` directories contain independent client + server apps:

```bash
# Start a module's server (e.g., finance BRD approach)
cd modules/finance/brd/server
npm install
npm run dev

# Start the client
cd modules/finance/brd/client
npm install
npm run dev
```

## Evaluation

See `docs/EVALUATION_RUBRIC.md` for scoring criteria. Each module gets a `COMPARISON.md` with side-by-side evaluation.

## Database

Shared SQL Server instance with per-module schemas:
- `dbo.*` -- shared tables (Employees, Departments, LookupValues)
- `ceo.*`, `finance.*`, `records.*`, etc. -- module-specific tables

See `shared/db/init-schemas.sql` for schema setup.
