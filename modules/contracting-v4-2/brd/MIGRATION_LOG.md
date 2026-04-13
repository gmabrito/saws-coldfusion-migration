# Migration Log

## Approach
BRD-driven

## Decisions Made
- Used the `contracting` schema for all tables per the project-wide schema strategy.
- Solicitations support full CRUD with status filtering (Open/Closed/Awarded) and type filtering (IFB/RFP/RFQ).
- SolicitationDocuments tracks document metadata attached to solicitations; actual file storage is metadata-only at this stage.
- SolicitationNotifications records notification history including message, recipient count, and sent date. In production, this would trigger actual email delivery to registered vendors.
- Sortable table columns implemented client-side for Title, Type, Posted Date, Deadline, and Status.
- Award fields (AwardedVendorID, AwardDate) are conditionally shown in the form only when Status is set to "Awarded".
- Mock login endpoint provided for development/testing; production will use shared AD/JWT auth from `shared/ui-shell`.
- Used parameterized SQL throughout all routes (no raw string interpolation).
- Server port defaults to 3002 to avoid conflicts with other module servers (v4-1 uses 3001).
- Client Vite dev server on port 5178 proxies `/api` to the Express backend on port 3002.
- Seed data included in schema.sql for immediate UI testing (5 solicitations, 8 documents, 4 notifications).
- DELETE endpoint cascades removal of associated documents and notifications before deleting the solicitation.

## Requirements Covered
- Post and update solicitations to saws.org - Full CRUD for solicitations with status and type management
- Add documents to solicitations - Document metadata attachment with file name, type, and description
- Send notifications and email updates to vendors - Notification creation with message and recipient count tracking, notification history view

## Known Gaps
- File upload is metadata-only; binary file storage (Azure Blob, file system) not implemented in this prototype.
- Email delivery integration not implemented; notification endpoint records the notification but does not send actual emails.
- Vendor subscriber list management not implemented; recipient count is manually entered.
- Shared UI shell (`@saws/ui-shell`) import not wired up; standalone Layout component used for the prototype.
- No public-facing solicitation view for saws.org; this prototype covers the admin interface only.

## Notes
- All API routes use `express-validator` for input validation with proper error responses.
- Both client and server follow the patterns established in the `development` BRD reference module.
- SQL schema uses CHECK constraints for Status enum (Open/Closed/Awarded).
- Foreign key constraints link documents and notifications back to their parent solicitation.
- Indexes created on Status, SolicitationType, and foreign key columns for query performance.
