# CLAUDE.md -- SAWS ColdFusion Migration Bakeoff

## Project Overview

This is a bakeoff comparing two ColdFusion migration approaches (BRD-driven vs code-driven) for 14 SAWS internal "EZ Link" intranet applications. Each module has `brd/` and `code/` subdirectories for the two approaches.

## Tech Stack

- **Frontend:** React 19 + Vite + React Router DOM 7 + Axios
- **Backend:** Express 4 + mssql 11 + msnodesqlv8
- **Database:** SQL Server -- shared instance, per-module schemas
- **Auth:** Mock Active Directory via `shared/ui-shell/providers/AuthProvider.jsx`

## Conventions

### Express Server Pattern
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### SQL Server Connection
```javascript
const sql = require('mssql');
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: { encrypt: false, trustServerCertificate: true }
};
```

### Stored Procedures
- Prefix with `usp_` (e.g., `usp_GetEmployees`, `usp_InsertContract`)
- Module-specific procs use the module schema (e.g., `finance.usp_GetContracts`)

### API Routes
- RESTful: `GET /api/<resource>`, `POST /api/<resource>`, `PUT /api/<resource>/:id`, `DELETE /api/<resource>/:id`
- Use `express-validator` for input validation

### Frontend
- Functional components with hooks
- Axios for API calls
- Import shared UI shell: `import { AppShell } from '@saws/ui-shell'`
- React Router DOM for navigation

## Database Schema Strategy

- `dbo.*` -- shared tables (Employees, Departments, LookupValues)
- Per-module schemas: `ceo`, `contracting`, `development`, `finance`, `fleet`, `hr`, `is_sms`, `oncall`, `printshop`, `records`, `utilitymaps`, `waterresource`

## SAWS Brand Colors

- Primary Blue: #0078AE
- Green: #00A344
- Orange: #f28428
- Navy: #005A87
- White: #FFFFFF
- Light Gray: #F5F5F5

## Directory Layout

- `inputs/brds/` -- sanitized BRD markdown files (read-only reference)
- `inputs/coldfusion/` -- original CF source (added later)
- `shared/` -- UI shell, auth mock, DB schemas, TypeScript types
- `modules/<name>/brd/` -- BRD-driven migration output
- `modules/<name>/code/` -- code-driven migration output
- `docs/` -- evaluation rubric, module catalog
- `evaluation/` -- bakeoff results

## Migration Rules

- Each approach outputs into its designated folder (`brd/` or `code/`)
- Must write a `MIGRATION_LOG.md` documenting decisions and assumptions
- Must use the shared UI shell and auth mock from `shared/`
- Reference BRD requirement IDs (e.g., 7.1.2) in code comments
- Do not invent requirements; implement only what is explicitly stated
- Preserve public endpoints under `https://saws.org/...` as-is
- Treat non-public URLs as `https://internal` placeholders
