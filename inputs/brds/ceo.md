# CLAUDE.md – CEO Final-4

**Source BRD:** `BRD - Cold Fusion Migration CEO_Final-4.pdf.docx`

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
- The First EZ link is the Board Committee Agenda. The committee consist of two different committees, Audit and Compensation. The Audit Committee assists the Board and executive management with overseeing the integrity of SAWS financial reporting, internal controls and external and internal audit functions. The Committee’s role includes a particular focus on the qualitative aspects of financial reporting policies and practices and the management of business and financial risk.
- The Compensation Committee was created to serve as an advisory committee to the Board for the annual performance appraisal and compensation process for the President and Chief Executive Officer, and to explore, plan and monitor succession planning for the role of the President and Chief Executive Officer.
- https://internal
- The Second EZ link is the Board Agenda. The board agenda link is used as a centralized location for archived meetings and when the board meetings will occur. The link provides information pertaining to handicap accessibility, and the ability to sign up to receive notification.
- https://internal/intranet/departments/ceo/boardagenda/documentadd.cfm
- 6.2 DESCRIBE THE PROBLEM
- Cold Fusion cost maintaining the licensing fees are constant whereas many applications and frameworks are open-sourced. The cost of maintaining the current modern language is free to use.

## Authoritative Requirements (Verbatim, Sanitized)

```text
7. BUSINESS REQUIREMENTS
7.1 Board Committee AGENDA – Functional Requirements
7.2 Board Agenda – Functional Requirements
7.1 	BOARD COMMITTEE AGENDA - FUNCTIONAL REQUIREMENTS
7.2 	BOARD AGENDA - FUNCTIONAL REQUIREMENTS
7.3 	REPORT REQUIREMENTS
```

## User Roles (Verbatim, Sanitized)

```text
8 USER ROLES
```

## Derived Conversion Guidance (Non-Authoritative)

- Implement workflows implied by Section 6 only when they are necessary to satisfy an explicit requirement in Section 7.
- Do not add new validation, approvals, calculations, or reports unless explicitly required.
- Preserve integrations, scheduled tasks, file generation, and notification behaviors exactly when specified.

## Deliverable expectations

- Produce code changes that can be traced back to requirement IDs.
- Prefer minimal, testable increments that preserve behavior.
