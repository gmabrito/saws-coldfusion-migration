<#
.SYNOPSIS
    Scans and sanitizes source code files locally. No AI tools needed.

.DESCRIPTION
    Scans ColdFusion (.cfm, .cfc), SQL, JavaScript, config, and other source
    files for PII, credentials, and sensitive data. Replaces with fake values.

    Modes:
      -Scan     : Report only, no changes (default)
      -Apply    : Replace sensitive data in files
      -DryRun   : Show what would change without modifying files

.EXAMPLE
    # Scan and report
    .\Sanitize-Code.ps1 -SourceDir "C:\CF Code\FRS"

    # Preview changes
    .\Sanitize-Code.ps1 -SourceDir "C:\CF Code\FRS" -DryRun

    # Apply with backup
    .\Sanitize-Code.ps1 -SourceDir "C:\CF Code\FRS" -Apply -BackupFirst

    # Delete junk files (reports, logs, backups)
    .\Sanitize-Code.ps1 -SourceDir "C:\CF Code\FRS" -DeleteJunk

    # Full pipeline: delete junk, sanitize, generate report
    .\Sanitize-Code.ps1 -SourceDir "C:\CF Code\FRS" -DeleteJunk -Apply -BackupFirst
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDir,

    [switch]$Apply,
    [switch]$DryRun,
    [switch]$BackupFirst,
    [switch]$DeleteJunk,
    [switch]$SkipLow
)

# ============================================================
# CONFIGURATION - Add your own patterns here
# ============================================================

# Real names to replace (add names found in your codebase)
$NameReplacements = @{
    # Format: 'Real Name' = 'Fake Name'
    # Add actual employee/customer names found during scanning
    'Debbie Cruz'       = 'Alex Thompson'
    'John Smith'        = 'Jordan Rivera'
    'Mary Johnson'      = 'Casey Williams'
    'Robert Garcia'     = 'Pat Morgan'
    'Jennifer Martinez' = 'Sam Chen'
    'David Wilson'      = 'Riley Brooks'
    'Lisa Anderson'     = 'Morgan Davis'
    'Michael Thomas'    = 'Quinn Foster'
    'Sarah Jackson'     = 'Avery Grant'
    'James White'       = 'Drew Harper'
}

# Server names to replace
$ServerReplacements = @{
    'INTRADB'           = 'devserver'
    'PRODSERVER'        = 'devserver'
    'SAWSDB'            = 'devserver'
    'intradb.saws.local'= 'localhost'
    'saws.local'        = 'localhost'
}

# Email domain replacements
$EmailDomains = @{
    '@saws.org'         = '@example.com'
    '@sawsmail.org'     = '@example.com'
}

# File extensions to scan
$ScanExtensions = @('.cfm', '.cfc', '.js', '.jsx', '.ts', '.tsx', '.sql',
                     '.json', '.xml', '.config', '.properties', '.ini',
                     '.env', '.txt', '.html', '.htm', '.css', '.md')

# File extensions/patterns to flag for deletion
$JunkPatterns = @('*.pdf', '*.log', '*.bak', '*.tmp', '*.cache')

# Backup file name patterns to flag for deletion
$BackupPatterns = @('*_backup*', '*_old*', '*_copy*', '*_2024*', '*_2025*', '*_2026*', '*_202?????*')

# ============================================================
# REGEX PATTERNS FOR DETECTION
# ============================================================

$Patterns = @(
    # HIGH RISK
    @{ Name='PASSWORD';     Risk='HIGH';   Regex='(?i)(password|passwd|pwd)\s*[=:]\s*[''"]([^''"]{3,})[''"]'; Group=2 }
    @{ Name='API_KEY';      Risk='HIGH';   Regex='(?i)(api[_-]?key|apikey|secret[_-]?key|token)\s*[=:]\s*[''"]([^''"]{8,})[''"]'; Group=2 }
    @{ Name='CONN_STRING';  Risk='HIGH';   Regex='(?i)(server|data source)\s*=\s*([^;''"]+)'; Group=2 }

    # MEDIUM RISK - Account Numbers (SAWS format: 9+ digits with dashes)
    @{ Name='ACCOUNT_NUM';  Risk='MEDIUM'; Regex='\b(\d{6,9}-\d{6,9}-\d{3,4})\b'; Group=1 }

    # MEDIUM RISK - Dollar amounts over $100 in strings/comments
    @{ Name='FINANCIAL';    Risk='MEDIUM'; Regex='\$[\s]?([\d,]{4,}\.?\d{0,2})'; Group=0 }

    # MEDIUM RISK - Email addresses (not @example.com)
    @{ Name='EMAIL';        Risk='MEDIUM'; Regex='[a-zA-Z0-9._%+-]+@(?!example\.com|test\.|fake\.|localhost)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'; Group=0 }

    # MEDIUM RISK - Phone numbers
    @{ Name='PHONE';        Risk='MEDIUM'; Regex='\b(\d{3}[-.)]\s?\d{3}[-.)]\s?\d{4})\b'; Group=1 }

    # MEDIUM RISK - Street addresses
    @{ Name='ADDRESS';      Risk='MEDIUM'; Regex='\b\d{1,5}\s+[A-Z][a-zA-Z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place)\b'; Group=0 }

    # LOW RISK - Employee IDs (7-8 digit numbers near employee context)
    @{ Name='EMPLOYEE_ID';  Risk='LOW';    Regex='(?i)(emp[_-]?id|employee[_-]?id|staff[_-]?id)\s*[=:]\s*[''"]?(\d{5,8})[''"]?'; Group=2 }

    # LOW RISK - Internal URLs
    @{ Name='INTERNAL_URL'; Risk='LOW';    Regex='(?i)(https?://[a-zA-Z0-9.-]*(?:intra|internal|local|saws\.local)[a-zA-Z0-9./-]*)'; Group=1 }
)

# ============================================================
# REPLACEMENT FUNCTIONS
# ============================================================

$script:accountCounter = 1
$script:empIdCounter = 1

function Get-Replacement {
    param([string]$Type, [string]$Value)

    switch ($Type) {
        'PASSWORD'    { return 'P@ssw0rd_DEV' }
        'API_KEY'     { return 'FAKE-API-KEY-XXXXXXXX' }
        'CONN_STRING' {
            foreach ($server in $ServerReplacements.Keys) {
                if ($Value -match [regex]::Escape($server)) { return $ServerReplacements[$server] }
            }
            return 'localhost'
        }
        'ACCOUNT_NUM' {
            $num = $script:accountCounter++
            # Keep same format, use 000099xxx pattern
            $parts = $Value -split '-'
            if ($parts.Count -eq 3) {
                return "000099{0:D3}-0099{1:D3}-{2}" -f $num, ($num+1), $parts[2]
            }
            return "000099001-0099002-0001"
        }
        'FINANCIAL'   {
            # Round to nearest 1000
            $clean = $Value -replace '[\$,\s]', ''
            $amount = [math]::Round([double]$clean / 1000) * 1000
            if ($amount -lt 1000) { $amount = 1000 }
            return ('${0:N2}' -f $amount)
        }
        'EMAIL'       { return 'testuser@example.com' }
        'PHONE'       {
            $num = $script:empIdCounter++ % 100
            return "210-555-{0:D4}" -f (100 + $num)
        }
        'ADDRESS'     { return '100 Test Street' }
        'EMPLOYEE_ID' {
            $num = $script:empIdCounter++
            return "990{0:D4}" -f $num
        }
        'INTERNAL_URL'{ return 'https://internal/app/path' }
        default       { return 'SANITIZED' }
    }
}

# ============================================================
# MAIN LOGIC
# ============================================================

if (-not (Test-Path $SourceDir)) {
    Write-Error "Source directory not found: $SourceDir"
    exit 1
}

$SourceDir = Resolve-Path $SourceDir

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SAWS Code Sanitization Scanner" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $SourceDir"
Write-Host "Mode  : $(if ($Apply) {'APPLY CHANGES'} elseif ($DryRun) {'DRY RUN'} else {'SCAN ONLY'})"
Write-Host ""

# --- Phase 1: Delete Junk Files ---
if ($DeleteJunk) {
    Write-Host "--- Phase 1: Deleting Junk Files ---" -ForegroundColor Yellow
    Write-Host ""

    $junkFiles = @()

    foreach ($pattern in $JunkPatterns) {
        $found = Get-ChildItem -Path $SourceDir -Recurse -Filter $pattern -File -EA SilentlyContinue
        $junkFiles += $found
    }

    foreach ($pattern in $BackupPatterns) {
        $found = Get-ChildItem -Path $SourceDir -Recurse -Filter $pattern -File -EA SilentlyContinue
        $junkFiles += $found
    }

    $junkFiles = $junkFiles | Sort-Object FullName -Unique

    if ($junkFiles.Count -eq 0) {
        Write-Host "  No junk files found." -ForegroundColor Green
    } else {
        Write-Host "  Found $($junkFiles.Count) junk files:" -ForegroundColor Yellow

        $totalSize = 0
        foreach ($file in $junkFiles) {
            $totalSize += $file.Length
            $sizeKB = [math]::Round($file.Length / 1KB)
            $relPath = $file.FullName.Replace($SourceDir, '').TrimStart('\')

            if ($Apply) {
                Remove-Item -LiteralPath $file.FullName -Force
                Write-Host "  DELETED: $relPath ($sizeKB KB)" -ForegroundColor Red
            } else {
                Write-Host "  WOULD DELETE: $relPath ($sizeKB KB)" -ForegroundColor DarkYellow
            }
        }

        $totalMB = [math]::Round($totalSize / 1MB, 1)
        Write-Host ""
        Write-Host "  Total: $($junkFiles.Count) files, $totalMB MB" -ForegroundColor $(if ($Apply) {'Green'} else {'Yellow'})
        if (-not $Apply) {
            Write-Host "  Run with -Apply to delete these files." -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# --- Phase 2: Backup ---
if ($BackupFirst -and $Apply) {
    $backupDir = "$SourceDir`_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "Creating backup: $backupDir" -ForegroundColor Yellow
    Copy-Item -Path $SourceDir -Destination $backupDir -Recurse
    Write-Host "Backup complete.`n" -ForegroundColor Green
}

# --- Phase 3: Scan and Sanitize ---
Write-Host "--- Phase $(if ($DeleteJunk) {'2'} else {'1'}): Scanning for Sensitive Data ---" -ForegroundColor Yellow
Write-Host ""

$allFiles = Get-ChildItem -Path $SourceDir -Recurse -File | Where-Object {
    $ScanExtensions -contains $_.Extension.ToLower()
}

Write-Host "  Scanning $($allFiles.Count) files...`n"

$findings = @()
$filesModified = 0
$totalReplacements = 0

foreach ($file in $allFiles) {
    $relPath = $file.FullName.Replace($SourceDir, '').TrimStart('\')
    $content = Get-Content $file.FullName -Raw -EA SilentlyContinue
    if (-not $content) { continue }

    $originalContent = $content
    $fileFindings = @()
    $lineNum = 0
    $lines = $content -split "`n"

    # Check regex patterns
    foreach ($pattern in $Patterns) {
        if ($SkipLow -and $pattern.Risk -eq 'LOW') { continue }

        $matches = [regex]::Matches($content, $pattern.Regex)
        foreach ($match in $matches) {
            $value = $match.Groups[$pattern.Group].Value.Trim()
            if (-not $value -or $value.Length -lt 3) { continue }

            # Skip obvious false positives
            if ($pattern.Name -eq 'FINANCIAL' -and $value -match '^\$\d{1,2}\.\d{2}$') { continue }  # Small amounts
            if ($pattern.Name -eq 'ADDRESS' -and $value -match '(?i)Test|Sample|Fake|Example') { continue }
            if ($pattern.Name -eq 'EMAIL' -and $value -match '(?i)example\.com|test\.|fake\.') { continue }

            # Find line number
            $pos = $match.Index
            $lineNum = ($content.Substring(0, [math]::Min($pos, $content.Length)) -split "`n").Count

            $replacement = Get-Replacement -Type $pattern.Name -Value $value

            $fileFindings += [PSCustomObject]@{
                File        = $relPath
                Line        = $lineNum
                Type        = $pattern.Name
                Risk        = $pattern.Risk
                Found       = $value
                Replacement = $replacement
            }

            if ($Apply -or $DryRun) {
                $content = $content.Replace($match.Value, $match.Value.Replace($value, $replacement))
            }
        }
    }

    # Check known name replacements
    foreach ($realName in $NameReplacements.Keys) {
        if ($content -match [regex]::Escape($realName)) {
            $matches = [regex]::Matches($content, [regex]::Escape($realName))
            foreach ($match in $matches) {
                $lineNum = ($content.Substring(0, [math]::Min($match.Index, $content.Length)) -split "`n").Count
                $fileFindings += [PSCustomObject]@{
                    File        = $relPath
                    Line        = $lineNum
                    Type        = 'PERSON_NAME'
                    Risk        = 'MEDIUM'
                    Found       = $realName
                    Replacement = $NameReplacements[$realName]
                }
            }
            if ($Apply -or $DryRun) {
                $content = $content.Replace($realName, $NameReplacements[$realName])
            }
        }
    }

    # Check known server replacements
    foreach ($server in $ServerReplacements.Keys) {
        if ($content -match [regex]::Escape($server)) {
            $matches = [regex]::Matches($content, [regex]::Escape($server))
            foreach ($match in $matches) {
                $lineNum = ($content.Substring(0, [math]::Min($match.Index, $content.Length)) -split "`n").Count
                $fileFindings += [PSCustomObject]@{
                    File        = $relPath
                    Line        = $lineNum
                    Type        = 'SERVER_NAME'
                    Risk        = 'HIGH'
                    Found       = $server
                    Replacement = $ServerReplacements[$server]
                }
            }
            if ($Apply -or $DryRun) {
                $content = $content.Replace($server, $ServerReplacements[$server])
            }
        }
    }

    # Check email domains
    foreach ($domain in $EmailDomains.Keys) {
        if ($content -match [regex]::Escape($domain)) {
            if ($Apply -or $DryRun) {
                $content = $content.Replace($domain, $EmailDomains[$domain])
            }
        }
    }

    # Report findings for this file
    if ($fileFindings.Count -gt 0) {
        $findings += $fileFindings

        $color = if ($fileFindings | Where-Object { $_.Risk -eq 'HIGH' }) { 'Red' }
                 elseif ($fileFindings | Where-Object { $_.Risk -eq 'MEDIUM' }) { 'Yellow' }
                 else { 'Gray' }

        Write-Host "  $relPath - $($fileFindings.Count) findings" -ForegroundColor $color

        if ($DryRun) {
            foreach ($f in $fileFindings) {
                $rc = switch ($f.Risk) { 'HIGH' { 'Red' } 'MEDIUM' { 'Yellow' } default { 'Gray' } }
                Write-Host "    [$($f.Risk)] $($f.Type): $($f.Found) -> $($f.Replacement)" -ForegroundColor $rc
            }
        }
    }

    # Write modified content
    if ($Apply -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesModified++
        $totalReplacements += $fileFindings.Count
    }
}

# --- Summary ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Results" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Files scanned    : $($allFiles.Count)"
Write-Host "  Total findings   : $($findings.Count)"

$high = ($findings | Where-Object { $_.Risk -eq 'HIGH' }).Count
$med  = ($findings | Where-Object { $_.Risk -eq 'MEDIUM' }).Count
$low  = ($findings | Where-Object { $_.Risk -eq 'LOW' }).Count

Write-Host "    HIGH risk      : $high" -ForegroundColor $(if ($high -gt 0) {'Red'} else {'Green'})
Write-Host "    MEDIUM risk    : $med" -ForegroundColor $(if ($med -gt 0) {'Yellow'} else {'Green'})
Write-Host "    LOW risk       : $low" -ForegroundColor Gray
Write-Host ""

if ($Apply) {
    Write-Host "  Files modified   : $filesModified" -ForegroundColor Green
    Write-Host "  Replacements     : $totalReplacements" -ForegroundColor Green
} elseif ($DryRun) {
    Write-Host "  DRY RUN - no files were modified." -ForegroundColor Yellow
    Write-Host "  Run with -Apply to make changes." -ForegroundColor Yellow
} else {
    Write-Host "  SCAN ONLY - no files were modified." -ForegroundColor Yellow
    Write-Host "  Run with -DryRun to preview or -Apply to fix." -ForegroundColor Yellow
}

# --- Export CSV Report ---
$reportDir = Split-Path $SourceDir
$csvPath = Join-Path $reportDir "Sanitization_Report_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"

if ($findings.Count -gt 0) {
    $findings | Export-Csv -Path $csvPath -NoTypeInformation
    Write-Host ""
    Write-Host "  Report saved: $csvPath" -ForegroundColor Cyan
}

# --- Type breakdown ---
if ($findings.Count -gt 0) {
    Write-Host ""
    Write-Host "  Findings by type:" -ForegroundColor Cyan
    $findings | Group-Object Type | Sort-Object Count -Descending | ForEach-Object {
        Write-Host "    $($_.Name): $($_.Count)" -ForegroundColor White
    }
}

Write-Host ""

# --- Add custom names instruction ---
if ($findings | Where-Object { $_.Type -eq 'PERSON_NAME' }) {
    Write-Host "  TIP: Add more names to the `$NameReplacements hashtable" -ForegroundColor DarkCyan
    Write-Host "  at the top of this script for names specific to your codebase." -ForegroundColor DarkCyan
    Write-Host ""
}
