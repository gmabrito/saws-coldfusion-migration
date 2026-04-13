# CLAUDE.md – Contracting V4-2

**Source BRD:** `BRD- Cold Fusion Migration Contracting_V4-2.pdf.docx`

## Mission

Migrate the legacy ColdFusion implementation to a modern platform while preserving functional behavior. Do not invent requirements; implement only what is explicitly stated in the Authoritative Requirements section.

## How to use this file

1) Read **Authoritative Requirements** first (verbatim).
2) Use **Derived Conversion Guidance** to interpret intent without adding scope.
3) When coding, reference requirement numbers exactly as written (e.g., 7.1.2).

## Global conversion rules (apply to this app)

- Treat text in fenced blocks as authoritative and do not paraphrase.
- Preserve public endpoints under `https://saws.org/...` as-is.
- Treat any non-public URLs, emails, and internal file paths as `https://internal`.
- For ColdFusion endpoints (`.cf*`), preserve the path as `https://internal/<original-path>.cf*`.

## Application Overview (Derived – Non-Authoritative)

- 6.1 CURRENT BUSINESS PROCESS
- The Bidder, Consultant & Vendor through EZlink is an interface for the directory of registered vendors and contractors who are interested in doing business with SAWS.
- Vendors registered through saws.org (separate application hosted on apps.saws.org) This account allows them access to conduct business with SAWS on saws.org, which includes:
- Receive new solicitation notifications matching their business profile and subscribe to receive updates on selected solicitations
- View/download solicitations, plans, specifications and engineering reports, and/or accompanying documents
- View changes during the solicitation period and monitor award status.
- Through the EZlink interface, Contracting department can search, edit (update contact information & reset passwords), view and remove vendor profiles. They are also able to utilize the search and output results to Excel spreadsheets of vendor profiles.
- Contracting Solicitations administration application is utilized by the Contracting Department to post and update solicitations to saws.org, add documents, send notifications and email updates.

## Authoritative Requirements (Verbatim, Sanitized)

(No explicit Section 7 requirements detected in extracted text.)

## User Roles (Verbatim, Sanitized)

(No explicit Section 8 roles detected in extracted text.)

## Derived Conversion Guidance (Non-Authoritative)

- Implement workflows implied by Section 6 only when they are necessary to satisfy an explicit requirement in Section 7.
- Do not add new validation, approvals, calculations, or reports unless explicitly required.
- Preserve integrations, scheduled tasks, file generation, and notification behaviors exactly when specified.

## Deliverable expectations

- Produce code changes that can be traced back to requirement IDs.
- Prefer minimal, testable increments that preserve behavior.
