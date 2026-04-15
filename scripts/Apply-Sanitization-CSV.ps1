<#
.SYNOPSIS
    Lightweight CSV version - no Excel COM dependency.
    Use this if you export the M365 Copilot audit as CSV instead of Excel.

.DESCRIPTION
    Expected CSV columns (header row required):
    FileName, LineNumber, FoundValue, DataType, RiskLevel, SuggestedReplacement, Context

.EXAMPLE
    .\Apply-Sanitization-CSV.ps1 -CsvFile "FRS_Audit.csv" -SourceDir "C:\FRS" -DryRun
    .\Apply-Sanitization-CSV.ps1 -CsvFile "FRS_Audit.csv" -SourceDir "C:\FRS" -BackupFirst
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$CsvFile,

    [Parameter(Mandatory=$true)]
    [string]$SourceDir,

    [switch]$DryRun,
    [switch]$BackupFirst,
    [switch]$SkipLow
)

if (-not (Test-Path $CsvFile)) { Write-Error "CSV not found: $CsvFile"; exit 1 }
if (-not (Test-Path $SourceDir)) { Write-Error "Source dir not found: $SourceDir"; exit 1 }

$CsvFile = Resolve-Path $CsvFile
$SourceDir = Resolve-Path $SourceDir

Write-Host "`n=== SAWS Code Sanitization (CSV) ===" -ForegroundColor Cyan
Write-Host "CSV file  : $CsvFile"
Write-Host "Source dir: $SourceDir"
Write-Host "Mode      : $(if ($DryRun) { 'DRY RUN' } else { 'APPLY' })`n"

# Backup
if ($BackupFirst -and -not $DryRun) {
    $backup = "$SourceDir`_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $SourceDir $backup -Recurse
    Write-Host "Backup: $backup`n" -ForegroundColor Yellow
}

# Read CSV
$data = Import-Csv $CsvFile | Where-Object {
    $_.FoundValue -and $_.SuggestedReplacement -and
    (-not $SkipLow -or $_.RiskLevel -ne 'LOW')
}

Write-Host "Loaded $($data.Count) replacements`n"

$modified = @{}
$total = 0
$errors = @()

foreach ($group in ($data | Group-Object FileName)) {
    $name = $group.Name
    $path = Join-Path $SourceDir $name

    if (-not (Test-Path $path)) {
        $found = Get-ChildItem $SourceDir -Recurse -Filter $name -EA SilentlyContinue | Select -First 1
        if ($found) { $path = $found.FullName } else { $errors += "Not found: $name"; continue }
    }

    $content = Get-Content $path -Raw
    $original = $content

    foreach ($r in $group.Group) {
        $from = $r.FoundValue.Trim()
        $to = $r.SuggestedReplacement.Trim()

        if ($content.Contains($from)) {
            if ($DryRun) {
                $color = switch ($r.RiskLevel) { 'HIGH' { 'Red' } 'MEDIUM' { 'Yellow' } default { 'Gray' } }
                Write-Host "  [$($r.RiskLevel)] $name" -ForegroundColor $color
                Write-Host "    $from -> $to"
            }
            $content = $content.Replace($from, $to)
            $total++
        }
    }

    if (-not $DryRun -and $content -ne $original) {
        Set-Content $path $content -NoNewline
        $modified[$name] = ($group.Group).Count
        Write-Host "  OK: $name" -ForegroundColor Green
    } elseif ($DryRun -and $content -ne $original) {
        $modified[$name] = ($group.Group).Count
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Replacements: $total | Files: $($modified.Count) | Errors: $($errors.Count)"
if ($errors) { $errors | ForEach-Object { Write-Host "  ERR: $_" -ForegroundColor Red } }
if ($DryRun) { Write-Host "`nDRY RUN - no files changed." -ForegroundColor Yellow }
