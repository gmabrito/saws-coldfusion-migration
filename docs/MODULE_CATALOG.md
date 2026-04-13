# Module Catalog

## Priority Order

Start with High complexity modules (most bakeoff signal), then Medium, then Low.

| Priority | Module | Complexity | Key Functions | BRD Quality |
|----------|--------|-----------|---------------|-------------|
| 1 | finance | High | Fire Hydrant Meter contracts (approval workflow, email notifications), Reading reports (INFOR integration) | Good - explicit Section 7 requirements |
| 2 | contracting-v4-1 | High | Bidder/Vendor directory (search, edit, export to Excel), vendor profile management | Medium - Section 6 only, no Section 7 |
| 3 | records | High | Records Storage Transmittal (CRUD, keyword search, retention codes, offsite storage) | Medium - Section 6 only, no Section 7 |
| 4 | development | High | CIAC Meeting board (meetings, docs, minutes), Authorized Contractor/Plumber Registry | Good - explicit Section 7 requirements |
| 5 | ceo | Medium | Board Committee Agenda (Audit & Compensation), Board Agenda (archives, scheduling) | Good - explicit Section 7 requirements |
| 6 | hr | Medium | Weekly Job Email (automated Friday emails), Inactive Employee Directory | Low - no Section 7 requirements |
| 7 | water-resource | Medium | Aquifer & Water Stats (30-day stats, 5 counties, precipitation, temperatures, pumpage) | Good - explicit Section 7 requirements |
| 8 | oncall-directory | Medium | On-call schedule by department, contact information | Good - explicit Section 7 requirements |
| 9 | contracting-v4-2 | Medium | Contracting Solicitations admin (post/update, notifications) | Medium - Section 6 only, no Section 7 |
| 10 | is-part1 | Low | Emergency SMS Text Notification Opt-in | Good - explicit Section 7 requirements |
| 11 | fleet | Low | Fleet management | Minimal - no detail extracted |
| 12 | print-shop | Low | Print shop operations | Minimal - no detail extracted |
| 13 | print-shop-final | Low | Print shop operations (final version) | Minimal - no detail extracted |
| 14 | utility-maps | Low | Utility maps display | Minimal - no detail extracted |

## Complexity Criteria

- **High**: Multiple workflows, integrations, approval processes, or complex CRUD
- **Medium**: Standard CRUD with some business logic or scheduling
- **Low**: Minimal BRD content or single simple function

## BRD Quality Legend

- **Good**: Has explicit Section 7 (Business Requirements) with functional requirements
- **Medium**: Has Section 6 (Business Process) description but no formal Section 7
- **Minimal**: Little to no detail extracted from the original BRD
