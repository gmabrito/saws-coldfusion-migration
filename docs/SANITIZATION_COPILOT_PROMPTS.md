# Copilot Sanitization Prompts

Copy-paste these prompts into **GitHub Copilot Chat** (VS Code: `Ctrl+Shift+I`) to sanitize ColdFusion or any source code before sharing with AI tools.

---

## 1. Scan for PII (Detection Only)

```
Scan the selected file(s) for sensitive data that should NOT be shared with AI tools. Look for:

1. **Account numbers** - patterns like 000000320-0000321-0001, SAWS account formats, any numeric IDs that look like real customer accounts
2. **Person names** - real employee or customer names (not variable names), especially in comments, strings, or test data
3. **Employee IDs** - numeric staff IDs like 10000996
4. **Email addresses** - real @saws.org or other organizational emails in strings/comments
5. **Physical addresses** - street addresses, city/state/zip in strings or comments
6. **Phone numbers** - in strings, comments, or test data
7. **Dollar amounts** - real billing amounts, salaries, or financial figures in comments or test data
8. **Server names** - internal hostnames, IP addresses, database server names
9. **Connection strings** - database URLs, passwords, API keys, tokens
10. **Internal URLs** - intranet paths, internal API endpoints with real hostnames

For each finding, report:
- Line number
- What type of sensitive data it is
- The actual value found
- Risk level (HIGH = PII/credentials, MEDIUM = internal infrastructure, LOW = borderline)

Do NOT modify any files. Detection only.
```

---

## 2. Sanitize a File (Replace PII with Fake Data)

```
Sanitize this file by replacing all real sensitive data with realistic but fake replacements. Follow these rules:

**Account Numbers**: Replace with format-matching fakes
- 000000320-0000321-0001 → 000099001-0099002-0001
- Keep the same format/length, use 0009xxxx pattern

**Person Names**: Replace with obviously fake but realistic names
- Use names like: Alex Thompson, Jordan Rivera, Casey Williams, Pat Morgan
- Keep gender-neutral when possible
- Employee IDs: replace with 99000XX pattern

**Addresses**: Replace with generic SAWS-area addresses
- Use: 100 Test Street, San Antonio TX 78201
- Or: 200 Sample Blvd, San Antonio TX 78205

**Financial Amounts**: Replace with round numbers
- $34,143.24 → $10,000.00
- Keep the same order of magnitude but use clean numbers

**Server Names / Connection Strings**:
- Replace hostnames with: localhost, devserver, testdb
- Replace passwords with: P@ssw0rd_DEV
- Replace API keys with: FAKE-API-KEY-FOR-DEV

**Email Addresses**:
- Replace with: testuser@example.com, admin@test.saws.org

**Internal URLs**:
- Replace paths with: /internal/app/module/page.cfm
- Keep the structure but genericize the path

**PRESERVE**:
- All code logic, SQL queries, function names, variable names
- Code structure and formatting
- Comments about business rules (just replace any PII within them)
- ColdFusion tags and syntax
```

---

## 3. Sanitize SQL Queries and Connection Strings

```
Scan this file for SQL-related sensitive data and sanitize:

1. **Connection strings**: Replace server names, database names, usernames, and passwords with dev equivalents:
   - Server: localhost
   - Database: DevDB
   - User: dev_user
   - Password: P@ssw0rd_DEV

2. **Hardcoded SQL values**: Replace real account numbers, names, or IDs in WHERE clauses, INSERT statements, or test queries with fake values

3. **Database/table names that reveal infrastructure**: If table names contain real system names (e.g., PROD_BILLING), genericize them. But keep application-specific table names (e.g., CS_FRS_ACCOUNTS) as-is since those are part of the schema design.

4. **Linked server references**: Replace with generic names

Do NOT change:
- SQL syntax or query structure
- Column names
- JOIN logic
- WHERE clause operators
- Stored procedure names
```

---

## 4. Sanitize an Entire Directory

```
I need to sanitize all files in this directory before sharing with an AI code assistant. 

For each file, apply these sanitization rules:

**REMOVE entirely**:
- .env files with real credentials
- Files containing only test data with real PII
- Generated reports/PDFs with customer data
- Log files with real activity
- Backup files (*_backup*, *_old*)

**SANITIZE in place**:
- Source code files (.cfm, .cfc, .js, .sql): replace PII in strings/comments, keep logic
- Config files: replace real hostnames/credentials with dev values
- README/docs: replace any real names or system details

**LEAVE as-is**:
- Code logic, algorithms, business rules
- Framework/library files
- CSS/styling files
- Empty template files

Create a summary of all changes made, organized by file.
```

---

## 5. Generate Sanitization Report

```
Generate a sanitization compliance report for this codebase. Check every file and produce a table with:

| File | PII Found | Type | Status | Action Needed |
|------|----------|------|--------|--------------|

Categories to check:
- NAMES: Real person names in strings/comments
- ACCOUNTS: Customer account numbers
- FINANCIAL: Dollar amounts, billing data
- ADDRESSES: Physical addresses
- CREDENTIALS: Passwords, API keys, tokens, connection strings
- INFRASTRUCTURE: Internal server names, IPs, URLs
- EMPLOYEE_IDS: Staff identification numbers
- CONTACT: Phone numbers, email addresses

Status should be:
- CLEAN: No PII found
- NEEDS_SANITIZATION: PII found, needs replacement
- ALREADY_SANITIZED: Contains placeholder/fake data

At the end, provide:
- Total files scanned
- Files needing sanitization
- Risk summary (HIGH/MEDIUM/LOW counts)
- Recommended action for each HIGH-risk finding
```

---

## 6. ColdFusion-Specific Sanitization

```
This is ColdFusion code (.cfm/.cfc) being prepared for AI-assisted migration. Sanitize it while preserving all CF-specific patterns:

**Sanitize**:
- Real data in <cfquery> hardcoded values
- Real names/accounts in <cfoutput> display strings
- Connection details in <cfdatasource> or Application.cfc
- Real email addresses in <cfmail> tags
- Real file paths in <cffile> or <cfdirectory> operations
- Real URLs in <cflocation> or <cfhttp> tags
- Session-stored PII (SESSION.employee_name, SESSION.emp_id with real values)
- Comments containing real employee names or system details

**Preserve exactly as-is**:
- <cfcomponent>, <cffunction>, <cfargument> structure
- <cfquery> SQL logic (parameterized parts)
- <cfgrid>, <cfwindow>, <cflayout> UI components
- JavaScript/ExtJS code patterns
- Business logic and calculations
- Variable names and function names
- Application.cfc settings (except credentials)
- Error handling patterns
```

---

## Quick Reference: What's Safe vs What's Not

| Safe to Share | Must Sanitize |
|--------------|---------------|
| Function/variable names | Real person names |
| SQL query structure | Real account numbers |
| Business logic/algorithms | Dollar amounts from prod |
| UI component code | Internal server names |
| Error handling patterns | Database passwords |
| Framework configuration | Employee IDs |
| CSS/styling | Physical addresses |
| Route definitions | API keys/tokens |
| Package.json dependencies | Internal URLs with hostnames |
| Schema DDL (CREATE TABLE) | Test data with real values |
