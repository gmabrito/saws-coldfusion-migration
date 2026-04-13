# CLAUDE.md – Finance Final-2

**Source BRD:** `CF Application Migration Finance_Final-2.pdf.docx`

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
- The finance department utilizes two EZ link applications. First, is the Fire Hydrant Meter Application process. The Fire Hydrant meter contract process requires a customer to apply for a fire hydrant meter. The application process is an online application reviewed by a San Antonio Water System (SAWS) employee. The customer will receive an email notification when approved.
- The customer will proceed to either the SAWS West Side or East Side Customer Center to pay for the deposit. The payment verification is taken to the Supply department. Every 20th of the month, the reading is reported to SAWS preventative maintenance and inspection.
- https://internal
- Second, is the Fire Hydrant Reading Report. The consumer logs into SAWS.org to report the monthly reading. The information is updated in INFOR and transitions to EZ link for review as needed. The information is updated in INFOR.
- https://internal/intranet/departments/acct/fhm/report.cfm
- 6.2 DESCRIBE THE PROBLEM
- Cold Fusion cost maintaining the licensing fees are constant whereas many applications and frameworks are open-sourced. The cost of maintaining the current modern language is free to use.

## Authoritative Requirements (Verbatim, Sanitized)

```text
7. BUSINESS REQUIREMENTS____________________
7.1 Fire Hydrant Meter Contracts – Functional Requirements
7.2 Fire Hydrant Meter Reading Reports – Functional Requirements
7.1 	FIRE HYDRANT METER CONTRACTS - FUNCTIONAL REQUIREMENTS
7.2 	FIRE HYDRANT METER READING REPORT -
FUNCTIONAL REQUIREMENTS
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
