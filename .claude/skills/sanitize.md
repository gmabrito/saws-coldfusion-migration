---
name: sanitize
description: Scan and sanitize source code files to remove PII, credentials, and sensitive data before sharing with AI tools
command: sanitize
---

# Code Sanitization Skill

When the user runs `/sanitize`, follow this process:

## Step 1: Determine scope

Ask the user what to sanitize if not clear:
- A specific file path
- A directory (recursive)
- The entire project

## Step 2: Scan for sensitive data

Use Grep to search for these patterns across all source files (.cfm, .cfc, .js, .jsx, .ts, .sql, .json, .env, .md, .txt, .xml, .config):

### HIGH risk (must fix):
- **Credentials**: Grep for `password`, `passwd`, `secret`, `api_key`, `apikey`, `token`, `Bearer`, connection strings with real servers
- **SSNs**: Pattern `\d{3}-\d{2}-\d{4}`
- **Email addresses in strings**: Pattern `['"][a-zA-Z0-9._%+-]+@(?!example\.|test\.|fake\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}['"]` (exclude @example.com, @test.*, @fake.*)
- **Real .env files**: Any .env file (not .env.example) containing passwords or keys

### MEDIUM risk (should fix):
- **Account numbers**: SAWS format `\d{6,9}-\d{6,9}-\d{4}` or similar long numeric identifiers
- **Dollar amounts in comments/strings**: `\$[\d,]+\.\d{2}` with values over $1,000
- **Physical addresses**: Strings containing "St ", "Ave ", "Blvd ", "Dr " followed by city/state patterns
- **Phone numbers**: `\d{3}[-.)]\d{3}[-.)]\d{4}`
- **Internal hostnames**: Grep for patterns like `INTRADB`, `PRODSERVER`, `\\\\servername`, internal domain names

### LOW risk (review):
- **Person names in comments**: Look for `BY :`, `Author:`, `Created by`, `Modified by` followed by names
- **Employee IDs**: 7-8 digit numbers following employee-related context
- **Internal URLs**: Paths containing `/intranet/`, internal domain names

## Step 3: Report findings

Present a table to the user:

```
| # | File | Line | Risk | Type | Found | Suggested Replacement |
|---|------|------|------|------|-------|----------------------|
```

## Step 4: Sanitize (with user approval)

After the user approves, replace each finding using the Edit tool:

### Replacement rules:
- **Names** → Alex Thompson, Jordan Rivera, Casey Williams, Pat Morgan, Sam Chen
- **Account numbers** → 000099001-0099002-0001 (keep format, use 0009x prefix)
- **Employee IDs** → 9900001, 9900002, etc.
- **Emails** → testuser@example.com, admin@example.com
- **Addresses** → 100 Test Street, San Antonio TX 78201
- **Phone numbers** → 210-555-0100, 210-555-0101
- **Dollar amounts** → Round to nearest $1,000 or use $10,000.00
- **Passwords** → P@ssw0rd_DEV, DevSecret123!
- **Server names** → localhost, devserver, testdb
- **API keys** → FAKE-API-KEY-XXXXXXXX
- **Internal URLs** → https://internal/app/path

### Preserve:
- All code logic, SQL structure, function names, variable names
- ColdFusion tags and syntax
- Business rules in comments (just replace PII within them)
- File structure and formatting

## Step 5: Generate report

After sanitization, create a `SANITIZATION_REPORT.md` in the target directory with:
- Date of sanitization
- Files scanned (count)
- Findings by risk level
- Replacements made
- Files that were clean (no changes needed)
- Any items that need manual review
