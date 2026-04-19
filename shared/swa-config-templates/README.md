# SWA Config Templates

Reusable Azure Static Web Apps configuration templates for SAWS ColdFusion migration modules.

---

## Templates

### `internal-only.json`
Use for **fully internal SAWS staff applications**. All routes (`/*`) require Azure AD authentication. Any unauthenticated request is redirected to `/.auth/login/aad`.

This is the standard pattern for all existing ColdFusion migration modules (flat-rate-sewer, finance, hr, fleet, etc.) where no public-facing pages are needed.

### `internal-external-split.json`
Use for modules with **both public (SAWS.org-facing) and internal (SAWS employee) pages**.

- `/public/*` and `/api/public/*` — allow anonymous access
- All other routes (`/*`) — require Azure AD authentication
- Unauthenticated users hitting internal routes are redirected to `/.auth/login/aad`

Current modules using this pattern: **AquaDocs**, **AquaRecords**

---

## How Segregation Works

### SWA Layer (page routing)
Azure Static Web Apps evaluates the `routes` array in order. The first matching rule wins:
1. `/public/*` — anonymous and authenticated allowed (public pages, e.g. TPIA submission form, doc search)
2. `/api/public/*` — anonymous and authenticated allowed (public API endpoints)
3. `/*` — authenticated only (all other pages and API routes)

SWA enforces this **before** the request reaches Express. No JWT verification is needed — the SWA platform validates the Azure AD session cookie and injects the user identity.

### Express Layer (API routing)
The Express server enforces authentication and authorization on API routes using the `authenticate` middleware from `@saws/auth/server`, which reads the `X-MS-CLIENT-PRINCIPAL` header injected by the SWA platform.

- `/api/public/*` routes — no `authenticate` middleware; fully anonymous
- `/api/internal/*` routes — `router.use(authenticate)` at the top of the router
- `/api/internal/admin/*` routes — `authenticate` + `authorize([...adminGroups])`

This dual-layer approach means:
- Public pages work for citizens/external users with no Azure AD account
- Internal pages are protected at the SWA edge (fast redirect before the app loads)
- API routes are protected at the Express layer (defense in depth)

---

## Azure AD Tenant

All modules use the **same Azure AD tenant** (SAWS corporate directory). Segregation is at the route level, not at the tenant level. There is no separate B2C tenant for public users — public pages simply allow anonymous access.

---

## API Route Convention

| Route prefix | Auth | Description |
|---|---|---|
| `/api/public/*` | Anonymous | Public-facing endpoints (submit form, check status) |
| `/api/internal/*` | `authenticate` required | Staff-facing endpoints |
| `/api/internal/admin/*` | `authenticate` + admin group | Admin-only endpoints |

---

## AD Group Convention

AD groups follow the pattern `SAWS-<Module>-<Role>`:

| Group | Purpose |
|---|---|
| `SAWS-<Module>-Admin` | Full access: configure, manage, override |
| `SAWS-<Module>-Staff` | Process and respond to core module work |
| `SAWS-<Module>-ReadOnly` | View-only access for reporting |

Examples:
- `SAWS-AquaDocs-Admin`, `SAWS-AquaDocs-User`
- `SAWS-Records-Admin`, `SAWS-Records-Staff`
- `SAWS-FRS-Admin`, `SAWS-FRS-User`, `SAWS-FRS-ReadOnly`

Groups are assigned in Azure SWA role assignments and arrive in the `X-MS-CLIENT-PRINCIPAL` header as the `userRoles` claim.
