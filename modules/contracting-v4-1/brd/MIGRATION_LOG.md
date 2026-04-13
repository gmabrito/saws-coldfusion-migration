# Migration Log

## Approach
BRD-driven

## Decisions Made

1. **Auth strategy**: Implemented JWT-based auth with a mock login endpoint for the prototype. The BRD describes AD-integrated users from the Contracting department; production would replace the mock with actual AD/SSO integration via the shared AuthProvider.
2. **Database schema**: Created `contracting.Vendors` and `contracting.VendorCategories` tables under the `contracting` schema, consistent with the project's per-module schema convention. Added `PasswordHash` and `PasswordResetDate` columns to support the password-reset feature described in BRD 6.1.
3. **Vendor search**: Implemented server-side search with parameterized SQL supporting filters by name (business or contact), category, and status. Paginated results with configurable page size.
4. **CSV export**: Built server-side CSV generation (BRD 6.1 "output results to Excel spreadsheets") as a `/api/vendors/export` endpoint that streams a downloadable CSV file. Chose CSV over XLSX for simplicity; CSV opens natively in Excel.
5. **Password reset**: Generates a temporary random password and stores it in the Vendors table. In production this would hash the password and trigger an email notification to the vendor.
6. **Shared UI shell**: Used the project's shared AppShell/IntranetNav patterns (sidebar + header layout, SAWS brand colors) implemented directly in Layout.jsx and index.css to match the conventions without requiring a package dependency for the prototype.
7. **Vendor registration**: BRD states vendors register through saws.org (separate application on apps.saws.org). This module only manages the directory -- registration is out of scope.
8. **Solicitations**: BRD 6.1 mentions solicitation administration. This is covered by the separate Contracting V4-2 module, not implemented here.

## Requirements Covered

- 6.1 - Search vendor profiles (by name, category, status)
- 6.1 - View vendor profile details
- 6.1 - Edit vendor profiles (update contact information)
- 6.1 - Reset vendor passwords
- 6.1 - Remove vendor profiles
- 6.1 - Export search results to Excel/CSV spreadsheet

Note: No explicit Section 7 requirements were detected in the BRD extracted text. All features derive from the Section 6.1 business process description.

## Known Gaps

1. **No Section 7 requirements**: The BRD extraction did not contain explicit Section 7 requirements. Implementation is based solely on the Section 6.1 business process description.
2. **Active Directory integration**: Mock auth only; real AD/Windows Authentication not wired.
3. **Email notifications**: Password reset does not send email notifications to vendors.
4. **Vendor self-service**: The vendor-facing saws.org portal (registration, solicitation viewing) is a separate application and not implemented.
5. **Audit trail**: No logging of who performed edits/deletions. Would be needed for production.

## Notes

- All SQL queries use parameterized inputs to prevent SQL injection.
- The Express server follows the project convention: cors, express.json(), RESTful routes, express-validator.
- The React client uses Vite with proxy to the Express server, React Router DOM 7, and Axios with auth interceptors.
- Seed data includes 10 sample vendors and 10 categories for prototype testing.
- Internal emails use `@internal` placeholder per project convention.
