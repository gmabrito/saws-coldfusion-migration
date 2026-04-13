# CLAUDE.md – Oncall Directory-Final-1

**Source BRD:** `BRD- Cold Fusion Migration Oncall Directory-Final-1.pdf.docx`

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
- The On-call Directory is a schedule used to provide what employee is On-call. The form provides employees from each department contact information
- 6.2 DESCRIBE THE PROBLEM
- ColdFusion costs to maintain the licensing fees are constant whereas many applications and frameworks are open-sourced. The cost of maintaining the current modern language is free to use.
- Performance concerns affect efficiency and the effectiveness of all departments if we continue with Coldfusion. Applications may exhibit slower performances. Many new platforms used today have the capability to out-perform the current limitation Coldfusion executes today.
- Out-dated security measures create the ability to have vulnerabilities accessing the platform. Unable to maintain frequent updates. Limitation or inefficiencies updating Coldfusion can cause long-term problems.
- Compliance issues may arise if the current application isn’t updated effectively.
- Coldfusion is no longer an application IS department wants to utilize anymore.

## Authoritative Requirements (Verbatim, Sanitized)

```text
7. BUSINESS REQUIREMENTS
7.1 ON- CALL DIRECTORY -FUNCTIONAL REQUIREMENTS
7.2 ENHANCEMENTS - FUNCTIONAL REQUIREMENTS
7.3 REPORT REQUIREMENTS
```

## User Roles (Verbatim, Sanitized)

```text
8. USER ROLES
```

## Derived Conversion Guidance (Non-Authoritative)

- Implement workflows implied by Section 6 only when they are necessary to satisfy an explicit requirement in Section 7.
- Do not add new validation, approvals, calculations, or reports unless explicitly required.
- Preserve integrations, scheduled tasks, file generation, and notification behaviors exactly when specified.

## Deliverable expectations

- Produce code changes that can be traced back to requirement IDs.
- Prefer minimal, testable increments that preserve behavior.
