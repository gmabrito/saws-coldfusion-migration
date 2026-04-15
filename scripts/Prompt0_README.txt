SAWS CODE SANITIZATION - M365 COPILOT PROMPTS
=============================================

Use these prompts in M365 Copilot (copilot.microsoft.com or Teams) to
sanitize ColdFusion source code before sharing with AI migration tools.

WORKFLOW:
  Step 1: Upload your CF source folder to OneDrive
  Step 2: Open M365 Copilot and reference the folder with /
  Step 3: Use the prompts below in order

PROMPTS (use in this order):

  Prompt5_DeleteRecommendations.txt
    Run FIRST. Identifies files to delete entirely (reports, logs,
    backups, binaries). Review the list and delete those files from
    your OneDrive folder before proceeding.

  Prompt1_Audit.txt  (OR  Prompt2_QuickScan.txt for a faster scan)
    Full PII audit. Generates a CSV with every finding and suggested
    replacement. Download the CSV when done.
    Use Prompt4 instead if scanning ColdFusion .cfm/.cfc files.

  Prompt4_ColdFusion_Specific.txt
    ColdFusion-aware version of the audit. Understands cfquery, cfmail,
    cfdatasource, Application.cfc patterns. Use this instead of
    Prompt1 for .cfm/.cfc files.

  Apply the CSV results using PowerShell:
    .\Apply-Sanitization-CSV.ps1 -CsvFile "audit.csv" -SourceDir "C:\path" -DryRun
    .\Apply-Sanitization-CSV.ps1 -CsvFile "audit.csv" -SourceDir "C:\path" -BackupFirst

  Prompt3_Verify.txt
    Run LAST. Upload the sanitized files back to OneDrive and run this
    to confirm all PII has been removed. Should report SANITIZATION VERIFIED.

TIPS:
  - Reference your OneDrive folder with / in M365 Copilot chat
  - If a folder has 50+ files, process subfolders one at a time
  - Always ask for CSV output so the PowerShell script can read it
  - Always do a DryRun first before applying changes
  - Keep backups of originals until verification passes
