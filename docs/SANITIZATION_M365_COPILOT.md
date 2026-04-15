# M365 Copilot Sanitization Workflow

## Overview

Use Microsoft 365 Copilot to audit source code for PII, then a PowerShell script to apply replacements, then M365 Copilot again to verify.

```
Step 1: M365 Copilot → Audit (Excel report)
Step 2: Human → Review & approve replacements
Step 3: PowerShell → Apply replacements to files
Step 4: M365 Copilot → Verify clean
```

---

## Step 1: Upload Files to OneDrive

Upload your ColdFusion source folder to OneDrive or SharePoint. Example:
```
OneDrive/SAWS CF Migration/FRS/
OneDrive/SAWS CF Migration/SITREP/
OneDrive/SAWS CF Migration/Locates/
```

---

## Step 2: M365 Copilot - Initial Audit

Open Microsoft 365 Copilot (copilot.microsoft.com or Teams) and use this prompt. Reference your folder with `/`.

### Prompt: Full PII Audit

```
I need you to review ColdFusion source code files that are being prepared 
for AI-assisted code migration. These files may contain real customer data, 
employee information, and internal infrastructure details that must be 
removed before the code can be shared with external AI tools.

Review all files in /FRS and create a detailed Excel spreadsheet with 
these columns:

Column A: FileName - the source file name
Column B: LineNumber - approximate line number where the data appears
Column C: FoundValue - the exact sensitive value found (copy it verbatim)
Column D: DataType - categorize as one of:
  - CREDENTIAL (passwords, API keys, tokens, connection strings)
  - PERSON_NAME (real employee or customer names)
  - ACCOUNT_NUMBER (SAWS account numbers, customer IDs)
  - EMPLOYEE_ID (staff ID numbers)
  - EMAIL (real email addresses, not @example.com)
  - ADDRESS (physical street addresses)
  - PHONE (phone numbers)
  - FINANCIAL (dollar amounts from real billing/transactions)
  - SERVER_NAME (internal hostnames, database servers, IP addresses)
  - INTERNAL_URL (intranet paths with real hostnames)
Column E: RiskLevel - HIGH, MEDIUM, or LOW
  - HIGH = credentials, SSNs, production passwords
  - MEDIUM = names, account numbers, financial data, addresses
  - LOW = internal URLs, employee IDs in comments
Column F: SuggestedReplacement - a realistic but fake replacement value:
  - Names → Alex Thompson, Jordan Rivera, Casey Williams, Pat Morgan, Sam Chen
  - Account numbers → 000099001-0099002-0001 (keep same format)
  - Employee IDs → 9900001, 9900002, 9900003
  - Emails → testuser@example.com
  - Addresses → 100 Test Street, San Antonio TX 78201
  - Phone → 210-555-0100
  - Financial → round to nearest $1,000
  - Passwords → P@ssw0rd_DEV
  - Server names → localhost or devserver
  - Internal URLs → https://internal/app/path
Column G: Context - brief description of where it appears (e.g., "in SQL 
  query comment", "hardcoded in cfmail tag", "session variable assignment")

IMPORTANT RULES:
- DO scan: string literals, comments, hardcoded values, cfmail tags, 
  connection strings, session variables, cfquery hardcoded values
- DO NOT flag: variable names, function names, SQL column names, 
  ColdFusion tag names, table names, framework code
- DO NOT flag: obviously fake/placeholder data like "test@test.com"
- Flag ALL real @saws.org email addresses
- Flag ALL SAWS account number patterns (9+ digit formatted numbers)
- Flag dollar amounts over $100 that appear in comments or display strings
  (not in code logic like "if amount > 100")

Name the spreadsheet: FRS_Sanitization_Audit.xlsx
Add a summary sheet with:
- Total findings by DataType
- Total findings by RiskLevel  
- List of files that are CLEAN (no findings)
- List of files to DELETE entirely (generated reports, log files, backups)
```

### Prompt: Quick Scan (shorter version)

```
Quickly scan all files in /FRS for sensitive data. Focus only on HIGH 
and MEDIUM risk items:

HIGH: passwords, API keys, database credentials, SSNs
MEDIUM: real person names, account numbers, email addresses, 
financial amounts, physical addresses

For each finding, give me: file name, the sensitive value, what type 
it is, and what to replace it with.

Format as a simple table I can review quickly.
```

---

## Step 3: PowerShell - Apply Replacements

After reviewing the Excel audit in Step 2, save it and run this PowerShell script.

### Save this as: `Apply-Sanitization.ps1`

See the PowerShell script file at: `scripts/Apply-Sanitization.ps1`

### Usage:

```powershell
# Dry run (preview only, no changes)
.\Apply-Sanitization.ps1 -AuditFile "FRS_Sanitization_Audit.xlsx" -SourceDir "C:\path\to\FRS" -DryRun

# Apply changes
.\Apply-Sanitization.ps1 -AuditFile "FRS_Sanitization_Audit.xlsx" -SourceDir "C:\path\to\FRS"

# Apply with backup
.\Apply-Sanitization.ps1 -AuditFile "FRS_Sanitization_Audit.xlsx" -SourceDir "C:\path\to\FRS" -BackupFirst
```

---

## Step 4: M365 Copilot - Verification

After running the PowerShell script, upload the modified files back and verify.

### Prompt: Verify Clean

```
I just sanitized the ColdFusion source code files in /FRS. Please verify 
that ALL sensitive data has been properly replaced.

Scan every file and confirm:

1. NO real person names remain (should only see: Alex Thompson, Jordan 
   Rivera, Casey Williams, Pat Morgan, Sam Chen, or similar obviously 
   fake names)
2. NO real account numbers remain (should only see 000099xxx patterns)
3. NO real email addresses remain (should only see @example.com)
4. NO passwords or API keys remain (should only see P@ssw0rd_DEV or 
   FAKE-API-KEY)
5. NO internal server names remain (should only see localhost, devserver)
6. NO real dollar amounts remain in comments or display strings
7. NO real physical addresses remain

For any findings that STILL contain real data, list them with:
- File name
- Line number
- The value that needs to be fixed
- What it should be replaced with

If everything is clean, confirm with "SANITIZATION VERIFIED - ALL CLEAR"
and list the total number of files scanned.
```

### Prompt: Compare Before/After

```
Compare the original files in /FRS Original with the sanitized files 
in /FRS Sanitized.

Verify that:
1. All code logic is IDENTICAL (no business rules changed)
2. All function names are IDENTICAL
3. All SQL query structure is IDENTICAL
4. Only string values, comments, and hardcoded data were changed
5. No files were accidentally deleted or corrupted

Report any differences that affect code functionality (not just data 
replacements).
```

---

## Tips for M365 Copilot

- **Reference files with `/`**: Type `/` in the chat to browse your OneDrive/SharePoint
- **Process in batches**: If you have 50+ files, point Copilot at subfolders rather than the entire project
- **Export to Excel**: Always ask for Excel output so the PowerShell script can read it
- **Column order matters**: The PowerShell script expects columns A-G in the order specified above
- **Review before applying**: Always do a dry run first and review the changes
