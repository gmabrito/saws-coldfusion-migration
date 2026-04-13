# CLAUDE.md – IS Part 1 Final-1

**Source BRD:** `Cold Fusion Migration IS Part 1_Final-1.pdf.docx`

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
- The Emergency SMS text Message Notification Opt-in EZ link provides the opportunity for San Antonio Water System (SAWS) employees to receive emergency text messages. The notifications you may receive include Inclement/emergency weather, fire alarm, hazardous chemical incident, emergency lockdown, and other local and national emergencies. To opt-in for the text messages, you’re required to download the disclosure and fill out the preference requirements to give consent.
- 6.2 DESCRIBE THE PROBLEM
- Cold Fusion cost maintaining the licensing fees are constant whereas many applications and frameworks are open-sourced. The cost of maintaining the current modern language is free to use.
- Performance concerns affect efficiency and the effectiveness of all departments if we continue with Cold Fusion. Applications may exhibit slower performances. Many new platforms used today have the capability to out-perform the current limitation Cold Fusion executes today.
- Out-dated security measures create the ability to have vulnerabilities accessing the platform. Unable to maintain frequent updates. Limitation or inefficiencies updating Cold Fusion can cause long-term problems.
- Compliance issues may arise if the current application isn’t updated effectively.
- Cold Fusion is no longer an application IS department wants to utilize anymore.

## Authoritative Requirements (Verbatim, Sanitized)

```text
7. BUSINESS REQUIREMENTS
7.1  EMERGENCY SMS TEXT MESSAGE NOTIFICATION OPT-
IN - FUNCTIONAL REQUIREMENTS
7.2 TECHNICAL REQUIREMENTS
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
