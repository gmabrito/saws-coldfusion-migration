# Data Sanitization Guide for AI-Assisted Development

## Why Sanitize?

When using AI coding tools (Claude Code, GitHub Copilot, ChatGPT, etc.), your source code is sent to external APIs. While these services don't train on your data under enterprise agreements, sensitive information still leaves your network. Sanitize before sharing to:

- Protect customer PII (names, accounts, addresses)
- Protect employee data (names, IDs, contact info)
- Protect infrastructure details (server names, credentials)
- Comply with data handling policies

## What's Safe vs What Must Be Sanitized

| Safe to Share | Must Sanitize |
|--------------|---------------|
| Function names, variable names | Real person names (customers, employees) |
| SQL query structure and logic | Real account numbers |
| Business rules and algorithms | Financial amounts from production |
| UI component code (HTML, CSS, JS) | Internal server/database names |
| Framework configuration | Passwords, API keys, tokens |
| Package dependencies | Employee IDs |
| Schema DDL (CREATE TABLE) | Physical addresses |
| Route definitions | Phone numbers, email addresses |
| Error handling patterns | Test data with real values |
| ColdFusion tags and syntax | Generated reports with customer data |

## Pre-Sharing Checklist

Before sharing any file with an AI tool:

- [ ] No real customer names or account numbers
- [ ] No real employee names or IDs
- [ ] No production passwords or API keys
- [ ] No internal server names or IP addresses
- [ ] No real dollar amounts from billing/financial data
- [ ] No real physical addresses
- [ ] No real email addresses (except @example.com)
- [ ] No generated reports with customer data (PDFs, CSVs)
- [ ] No .env files with production credentials
- [ ] No log files with real activity

## How to Sanitize

### Option A: GitHub Copilot (VS Code)

1. Open the file(s) in VS Code
2. Open Copilot Chat (`Ctrl+Shift+I`)
3. Copy the appropriate prompt from `SANITIZATION_COPILOT_PROMPTS.md`
4. Review the suggested changes before accepting
5. Verify no PII remains

**Best prompts to start with:**
- Use **Prompt #1** (Scan for PII) first to see what needs fixing
- Then use **Prompt #2** (Sanitize a File) to do the replacements
- Use **Prompt #5** (Generate Report) to verify completeness

### Option B: Claude Code

1. Navigate to the directory containing files to sanitize
2. Run `/sanitize`
3. Claude Code will scan, report findings, and ask for approval
4. Review the replacement table before confirming
5. A `SANITIZATION_REPORT.md` is generated automatically

### Option C: Manual (for small files)

Use find-and-replace with these patterns:
- Account numbers: Replace `\d{9}-\d{7}-\d{4}` with `000099001-0099002-0001`
- Names: Replace real names with Alex Thompson, Jordan Rivera, etc.
- Dollars: Replace `\$[\d,]+\.\d{2}` with round numbers
- Emails: Replace with `testuser@example.com`

## SAWS-Specific Patterns to Watch For

### ColdFusion Files (.cfm, .cfc)
```
SESSION.EMP_ID = 10000996        → SESSION.EMP_ID = 9900001
SESSION.user_name = "Debbie Cruz" → SESSION.user_name = "Alex Thompson"
<cfmail to="real@saws.org">      → <cfmail to="test@example.com">
<cfquery datasource="INTRADB">   → <cfquery datasource="DevDB">
```

### SQL Files (.sql)
```
WHERE ACCOUNT_NUM = '000120961'   → WHERE ACCOUNT_NUM = '000099001'
INSERT INTO ... VALUES ('John')   → INSERT INTO ... VALUES ('Alex')
Server=PRODSERVER;Database=SAWS   → Server=localhost;Database=DevDB
```

### Config/Environment Files
```
DB_SERVER=intradb.saws.local      → DB_SERVER=localhost
DB_PASSWORD=RealProd!Pass         → DB_PASSWORD=P@ssw0rd_DEV
API_KEY=sk-live-abc123            → API_KEY=FAKE-API-KEY-XXX
```

## Enterprise Copilot Deployment

If your organization has GitHub Copilot Enterprise:
- Code suggestions are already scoped to your organization
- Copilot Chat conversations are not used for training
- However, sanitization is still recommended for:
  - Code shared outside the organization (open source, vendor repos)
  - Files uploaded to non-enterprise AI tools
  - Code snippets shared in tickets, docs, or emails

## Automated Sanitization (CI/CD)

Consider adding a pre-commit hook or CI check:

```bash
# .githooks/pre-commit example
# Scan staged files for potential PII before committing

PATTERNS="@saws\.org|INTRADB|PRODSERVER|\d{9}-\d{7}-\d{4}"
if git diff --cached --name-only | xargs grep -lE "$PATTERNS" 2>/dev/null; then
  echo "WARNING: Potential PII detected in staged files."
  echo "Run sanitization before committing."
  echo "Files with matches listed above."
  exit 1
fi
```

## Questions?

- **"Is business logic safe to share?"** -- Yes. Rate calculation formulas, billing workflows, validation rules are all safe.
- **"What about table/column names?"** -- Safe. Schema structure is not PII.
- **"What about internal URL paths?"** -- Sanitize the hostname, keep the path structure. `/intranet/apps/frs/index.cfm` is fine, `http://intradb.saws.local/intranet/...` is not.
- **"Do I need to sanitize every dollar amount?"** -- Only real production amounts. Fake test data ($100.00, $1,000.00) is fine.
