#!/usr/bin/env python3
"""
sanitize.py — SAWS AquaCore Code Sanitizer

Scans source files for PII, credentials, and sensitive data, reports findings
in a colour-coded table, and optionally replaces them with safe placeholder
values. Writes a SANITIZATION_REPORT.md when finished.

Usage (run from the root of any project):
    python sanitize.py                   # scan everything, prompt before changes
    python sanitize.py --dry-run         # report only, no edits
    python sanitize.py --auto            # apply all without prompting
    python sanitize.py --risk high       # HIGH findings only
    python sanitize.py --risk medium     # HIGH + MEDIUM findings
"""

import argparse
import os
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

# Force UTF-8 output on Windows so box-drawing / emoji don't crash cp1252
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except AttributeError:
        pass

# ── ANSI colours (stripped when stdout is not a tty) ─────────────────────────
def _c(code): return f'\033[{code}m' if sys.stdout.isatty() else ''

RED    = _c('31'); YELLOW = _c('33'); GREEN  = _c('32')
CYAN   = _c('36'); DIM    = _c('2');  BOLD   = _c('1')
RESET  = _c('0')

RISK_COLOUR = {'HIGH': RED + BOLD, 'MEDIUM': YELLOW, 'LOW': DIM}
RISK_ORDER  = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}

# ── File extensions to scan ───────────────────────────────────────────────────
SCAN_EXT = {
    '.cfm', '.cfc',
    '.js', '.jsx', '.ts', '.tsx',
    '.py', '.cs',
    '.sql',
    '.json',
    '.env',
    '.md', '.txt',
    '.xml', '.config',
    '.css', '.html',
    '.yaml', '.yml',
}

SKIP_DIRS = {
    'node_modules', '.git', '__pycache__', '.venv', 'venv',
    'dist', 'build', '.next', '.nuxt', 'coverage', '.claude',
}

SKIP_FILES = {
    'SANITIZATION_REPORT.md',
    '.env.example', '.env.sample', '.env.template',
    'sanitize.py',   # don't scan ourselves
}

# ── Replacement pools (cycling counters) ─────────────────────────────────────
_pools = {
    'name':   ['Alex Thompson', 'Jordan Rivera', 'Casey Williams', 'Pat Morgan', 'Sam Chen'],
    'email':  ['testuser@example.com', 'admin@example.com', 'demo@example.com', 'user2@example.com'],
    'phone':  ['210-555-0100', '210-555-0101', '210-555-0102'],
    'emp_id': ['9900001', '9900002', '9900003', '9900004'],
    'addr':   ['100 Test Street, San Antonio TX 78201', '200 Sample Ave, San Antonio TX 78202'],
}
_counters: dict[str, int] = defaultdict(int)

def _next(key: str) -> str:
    pool = _pools[key]
    val  = pool[_counters[key] % len(pool)]
    _counters[key] += 1
    return val

# ── Data model ────────────────────────────────────────────────────────────────
@dataclass
class Finding:
    file:       Path
    line_num:   int
    risk:       str   # HIGH | MEDIUM | LOW
    type:       str
    found:      str
    suggestion: str
    pattern_id: str

@dataclass
class PatternDef:
    id:         str
    risk:       str
    type:       str
    regex:      str
    description:str
    suggest_fn: object        # Callable[[re.Match], str]
    flags:      int = re.IGNORECASE

# ── Pattern catalogue ─────────────────────────────────────────────────────────
PATTERNS: list[PatternDef] = [

    # ── HIGH ─────────────────────────────────────────────────────────────────

    PatternDef(
        id='password_assign',
        risk='HIGH', type='Password / secret',
        regex=r'''(?:password|passwd|secret|client_secret|api_key|apikey)\s*[=:]\s*['"]([^'"]{4,})['"]''',
        description='Hardcoded credential in assignment',
        suggest_fn=lambda m: m.group(0).replace(m.group(1), 'P@ssw0rd_DEV'),
    ),
    PatternDef(
        id='bearer_token',
        risk='HIGH', type='Bearer token',
        regex=r'Bearer\s+[A-Za-z0-9\-._~+/]{20,}',
        description='Bearer auth token literal',
        suggest_fn=lambda m: 'Bearer FAKE-TOKEN-XXXXXXXXXXXXXXXX',
    ),
    PatternDef(
        id='connection_string',
        risk='HIGH', type='Connection string',
        regex=r'(?:Server|Data Source|Host)\s*=\s*(?!localhost|127\.0\.0\.1|devserver)[A-Za-z0-9\-_.\\]{4,}(?:;|\s)',
        description='DB connection string with real server name',
        suggest_fn=lambda m: re.sub(r'=\s*[A-Za-z0-9\-_.\\]+', '=localhost', m.group(0)),
    ),
    PatternDef(
        id='ssn',
        risk='HIGH', type='SSN',
        regex=r'\b\d{3}-\d{2}-\d{4}\b',
        description='Social Security Number pattern',
        suggest_fn=lambda m: '000-00-0000',
        flags=0,
    ),
    PatternDef(
        id='email_external',
        risk='HIGH', type='External email',
        regex=r'''['"]([A-Za-z0-9._%+\-]+@(?!example\.|test\.|fake\.|saws\.org)[A-Za-z0-9.\-]+\.[A-Za-z]{2,})['"]''',
        description='Non-SAWS real email in string literal',
        suggest_fn=lambda m: m.group(0).replace(m.group(1), _next('email')),
        flags=0,
    ),
    PatternDef(
        id='email_saws',
        risk='HIGH', type='SAWS employee email',
        regex=r'''['"]([A-Za-z0-9._%+\-]+@saws\.org)['"]''',
        description='SAWS staff email in string literal',
        suggest_fn=lambda m: m.group(0).replace(m.group(1), _next('email')),
        flags=0,
    ),
    PatternDef(
        id='api_key_raw',
        risk='HIGH', type='API / access key',
        regex=r'''(?:api[_\-]?key|access[_\-]?key|auth[_\-]?key|subscription[_\-]?key)\s*[=:]\s*['"]([A-Za-z0-9\-._~]{16,})['"]''',
        description='Raw API or access key in assignment',
        suggest_fn=lambda m: m.group(0).replace(m.group(1), 'FAKE-API-KEY-XXXXXXXXXXXXXXXX'),
    ),

    # ── MEDIUM ────────────────────────────────────────────────────────────────

    PatternDef(
        id='phone',
        risk='MEDIUM', type='Phone number',
        regex=r'\b\d{3}[-.)]\d{3}[-.)]\d{4}\b',
        description='US phone number',
        suggest_fn=lambda m: _next('phone'),
        flags=0,
    ),
    PatternDef(
        id='saws_account',
        risk='MEDIUM', type='SAWS account number',
        regex=r'\b\d{6,9}-\d{6,9}-\d{4}\b',
        description='SAWS-format account number',
        suggest_fn=lambda m: '000099001-0099002-0001',
        flags=0,
    ),
    PatternDef(
        id='dollar_large',
        risk='MEDIUM', type='Dollar amount (>$1k)',
        regex=r'\$[\d,]{4,}\.\d{2}',
        description='Dollar amount over $1,000',
        suggest_fn=lambda m: '$10,000.00',
        flags=0,
    ),
    PatternDef(
        id='street_address',
        risk='MEDIUM', type='Street address',
        regex=r'\b\d{2,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Pkwy|Ct)\b\.?',
        description='Physical street address',
        suggest_fn=lambda m: _next('addr'),
        flags=0,
    ),
    PatternDef(
        id='internal_host',
        risk='MEDIUM', type='Internal hostname',
        regex=r'''['"][A-Z]{2,}[-_](?:DB|APP|WEB|SQL|SRV|PROD|DEV|QA)\d*['"]''',
        description='Internal server / hostname pattern',
        suggest_fn=lambda m: m.group(0)[0] + 'devserver' + m.group(0)[-1],
        flags=0,
    ),
    PatternDef(
        id='unc_path',
        risk='MEDIUM', type='UNC network path',
        regex=r'\\\\[A-Za-z0-9\-]+\\[A-Za-z0-9\-\\]+',
        description='Windows UNC / network share path',
        suggest_fn=lambda m: r'\\devserver\share',
        flags=0,
    ),

    # ── LOW ──────────────────────────────────────────────────────────────────

    PatternDef(
        id='author_comment',
        risk='LOW', type='Author in comment',
        regex=r'(?:BY|Author|Created by|Modified by|Written by)\s*[:\-]?\s*([A-Z][a-z]+ [A-Z][a-z]+)',
        description='Person name in code comment',
        suggest_fn=lambda m: m.group(0).replace(m.group(1), _next('name')),
        flags=0,
    ),
    PatternDef(
        id='employee_id',
        risk='LOW', type='Employee ID',
        regex=r'''(?:emp(?:loyee)?[_\-]?(?:id|number))\s*[=:]\s*['"']?(\d{7,8})['"']?''',
        description='Employee ID number in assignment',
        suggest_fn=lambda m: m.group(0).replace(m.group(1), _next('emp_id')),
    ),
    PatternDef(
        id='intranet_url',
        risk='LOW', type='Internal URL',
        regex=r'https?://(?:intranet|internal|corp|itsm|sharepoint\.saws)\.[A-Za-z0-9.\-/]+',
        description='Internal / intranet URL',
        suggest_fn=lambda m: 'https://internal/app/path',
    ),
]

# ── Scan ──────────────────────────────────────────────────────────────────────
def _should_skip(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return True
    if path.suffix.lower() not in SCAN_EXT:
        return True
    # Skip .env.* variant names that are example/sample templates
    if re.search(r'\.env\.(example|sample|template)', path.name, re.I):
        return True
    return False

def scan_file(path: Path, risk_filter: set[str]) -> list[Finding]:
    findings: list[Finding] = []
    try:
        text = path.read_text(encoding='utf-8', errors='ignore')
    except (PermissionError, OSError):
        return findings

    for line_num, line in enumerate(text.splitlines(), 1):
        for pat in PATTERNS:
            if pat.risk not in risk_filter:
                continue
            try:
                compiled = re.compile(pat.regex, pat.flags)
                for m in compiled.finditer(line):
                    findings.append(Finding(
                        file=path,
                        line_num=line_num,
                        risk=pat.risk,
                        type=pat.type,
                        found=m.group(0)[:60],
                        suggestion=pat.suggest_fn(m)[:60],
                        pattern_id=pat.id,
                    ))
            except re.error:
                pass
    return findings

def scan_path(target: Path, risk_filter: set[str]) -> tuple[list[Finding], int]:
    findings: list[Finding] = []
    scanned = 0
    if target.is_file():
        if not _should_skip(target):
            findings = scan_file(target, risk_filter)
            scanned = 1
    else:
        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for fname in files:
                fpath = Path(root) / fname
                if not _should_skip(fpath):
                    findings.extend(scan_file(fpath, risk_filter))
                    scanned += 1
    return findings, scanned

# ── Display ───────────────────────────────────────────────────────────────────
def _rel(path: Path, base: Path) -> str:
    try:
        s = str(path.relative_to(base))
    except ValueError:
        s = str(path)
    return ('…' + s[-(45-1):]) if len(s) > 45 else s

def print_summary(findings: list[Finding], scanned: int):
    high = sum(1 for f in findings if f.risk == 'HIGH')
    med  = sum(1 for f in findings if f.risk == 'MEDIUM')
    low  = sum(1 for f in findings if f.risk == 'LOW')
    print(f'{BOLD}Files scanned:{RESET} {scanned}    '
          f'{BOLD}Findings:{RESET}  '
          f'{RED}{BOLD}{high} HIGH{RESET}  '
          f'{YELLOW}{med} MEDIUM{RESET}  '
          f'{DIM}{low} LOW{RESET}')
    print()

def print_table(findings: list[Finding], base: Path):
    if not findings:
        print(f'{GREEN}✓  No findings — code looks clean.{RESET}\n')
        return

    idx = 1
    for risk in ('HIGH', 'MEDIUM', 'LOW'):
        group = [f for f in findings if f.risk == risk]
        if not group:
            continue
        rc = RISK_COLOUR[risk]
        bar = '=' * 120
        print(f'{rc}{bar}{RESET}')
        print(f'{rc}  {risk} -- {len(group)} finding{"s" if len(group) != 1 else ""}{RESET}')
        print(f'{rc}{bar}{RESET}')
        print(f'  {"#":<4} {"File":<46} {"Ln":<5} {"Type":<24} {"Found":<36} Suggestion')
        print(f'  {"─"*4} {"─"*46} {"─"*5} {"─"*24} {"─"*36} {"─"*36}')
        for f in group:
            print(f'  {idx:<4} {_rel(f.file, base):<46} {f.line_num:<5} {f.type:<24} {f.found:<36} {f.suggestion}')
            idx += 1
        print()

# ── Apply replacements ────────────────────────────────────────────────────────
def apply_replacements(findings: list[Finding]) -> int:
    by_file: dict[Path, list[Finding]] = defaultdict(list)
    for f in findings:
        by_file[f.file].append(f)

    replaced = 0
    for fpath, file_findings in by_file.items():
        try:
            lines = fpath.read_text(encoding='utf-8', errors='ignore').splitlines(keepends=True)
        except (PermissionError, OSError) as e:
            print(f'  {YELLOW}✗ Cannot read {fpath}: {e}{RESET}')
            continue

        changed = False
        for finding in file_findings:
            ln = finding.line_num - 1
            if ln >= len(lines):
                continue
            pat = next((p for p in PATTERNS if p.id == finding.pattern_id), None)
            if not pat:
                continue
            try:
                compiled  = re.compile(pat.regex, pat.flags)
                new_line, n = compiled.subn(lambda m, p=pat: p.suggest_fn(m), lines[ln], count=1)
                if n:
                    lines[ln] = new_line
                    changed   = True
                    replaced += 1
            except re.error:
                pass

        if changed:
            try:
                fpath.write_text(''.join(lines), encoding='utf-8')
                print(f'  {GREEN}✓{RESET} {fpath}')
            except (PermissionError, OSError) as e:
                print(f'  {YELLOW}✗ Cannot write {fpath}: {e}{RESET}')
    return replaced

# ── Report ────────────────────────────────────────────────────────────────────
def write_report(findings: list[Finding], replaced: int, scanned: int,
                 target: Path, output_dir: Path, dry_run: bool) -> Path:
    now      = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    high     = [f for f in findings if f.risk == 'HIGH']
    med      = [f for f in findings if f.risk == 'MEDIUM']
    low      = [f for f in findings if f.risk == 'LOW']

    lines = [
        '# Sanitization Report\n\n',
        f'**Date:** {now}  \n',
        f'**Target:** `{target}`  \n',
        f'**Files scanned:** {scanned}  \n',
        f'**Mode:** {"Dry run — no changes made" if dry_run else "Live — replacements applied"}  \n\n',
        '## Summary\n\n',
        '| Risk | Findings | Replaced |\n',
        '|------|:--------:|:--------:|\n',
        f'| 🔴 HIGH   | {len(high)} | {"—" if dry_run else len(high)} |\n',
        f'| 🟡 MEDIUM | {len(med)}  | {"—" if dry_run else len(med)} |\n',
        f'| ⚪ LOW    | {len(low)}  | {"—" if dry_run else len(low)} |\n',
        f'| **Total** | **{len(findings)}** | **{"—" if dry_run else replaced}** |\n\n',
    ]

    for risk, group, emoji in (('HIGH', high, '🔴'), ('MEDIUM', med, '🟡'), ('LOW', low, '⚪')):
        if not group:
            continue
        lines += [
            f'## {emoji} {risk} Findings\n\n',
            '| File | Line | Type | Found | Replacement |\n',
            '|------|-----:|------|-------|-------------|\n',
        ]
        for f in group:
            lines.append(
                f'| `{f.file.name}` | {f.line_num} | {f.type} '
                f'| `{f.found}` | `{f.suggestion}` |\n'
            )
        lines.append('\n')

    if not findings:
        lines.append('## ✅ All Clear\n\nNo sensitive data found.\n\n')

    lines.append('---\n*Generated by sanitize.py — SAWS AquaCore Code Sanitizer*\n')

    report_path = output_dir / 'SANITIZATION_REPORT.md'
    report_path.write_text(''.join(lines), encoding='utf-8')
    return report_path

# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        prog='sanitize.py',
        description='Scan source files for PII and credentials, starting from the current directory.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''\
Run from the root of any project — no path argument needed:

  python sanitize.py                    scan everything, prompt before changes
  python sanitize.py --dry-run          report findings only, no edits
  python sanitize.py --risk high        HIGH findings only
  python sanitize.py --auto             apply all replacements without prompting
  python sanitize.py --risk high --auto auto-fix HIGH findings only
        ''',
    )
    parser.add_argument(
        '--dry-run', action='store_true',
        help='Report findings without making any changes',
    )
    parser.add_argument(
        '--auto', action='store_true',
        help='Apply all replacements without prompting',
    )
    parser.add_argument(
        '--risk', choices=['high', 'medium', 'low', 'all'], default='all',
        help='Minimum risk level to include (default: all)',
    )
    parser.add_argument(
        '--no-report', action='store_true',
        help='Skip writing SANITIZATION_REPORT.md',
    )
    args = parser.parse_args()

    target = Path.cwd()

    risk_filter: set[str] = {'HIGH', 'MEDIUM', 'LOW'}
    if args.risk == 'high':
        risk_filter = {'HIGH'}
    elif args.risk == 'medium':
        risk_filter = {'HIGH', 'MEDIUM'}

    # ── Header ────────────────────────────────────────────────────────────────
    print(f'\n{BOLD}SAWS AquaCore — Code Sanitizer{RESET}')
    print(f'{DIM}Target : {target}{RESET}')
    print(f'{DIM}Risk   : {", ".join(sorted(risk_filter, key=lambda r: RISK_ORDER[r]))}{RESET}')
    if args.dry_run:
        print(f'{YELLOW}Mode   : DRY RUN — no files will be modified{RESET}')
    print()

    # ── Scan ──────────────────────────────────────────────────────────────────
    print(f'{DIM}Scanning...{RESET}', end='\r')
    findings, scanned = scan_path(target, risk_filter)
    print(' ' * 14, end='\r')

    base = target if target.is_dir() else target.parent
    print_summary(findings, scanned)
    print_table(findings, base)

    # ── Report output dir ─────────────────────────────────────────────────────
    report_dir = base if target.is_dir() else target.parent

    # ── No findings ───────────────────────────────────────────────────────────
    if not findings:
        if not args.no_report:
            rp = write_report(findings, 0, scanned, target, report_dir, dry_run=True)
            print(f'{DIM}Report: {rp}{RESET}')
        return

    # ── Dry run ───────────────────────────────────────────────────────────────
    if args.dry_run:
        if not args.no_report:
            rp = write_report(findings, 0, scanned, target, report_dir, dry_run=True)
            print(f'{DIM}Report: {rp}{RESET}')
        return

    # ── Prompt ────────────────────────────────────────────────────────────────
    if not args.auto:
        high_count = sum(1 for f in findings if f.risk == 'HIGH')
        print(f'Apply replacements?  '
              f'[{BOLD}y{RESET}] all ({len(findings)})  '
              f'[{BOLD}h{RESET}] HIGH only ({high_count})  '
              f'[{BOLD}n{RESET}] cancel  › ', end='')
        try:
            choice = input().strip().lower()
        except (KeyboardInterrupt, EOFError):
            print(f'\n{DIM}Cancelled.{RESET}')
            return

        if choice in ('n', 'no', 'q', ''):
            print(f'{DIM}No changes made.{RESET}')
            return
        elif choice in ('h', 'high'):
            findings = [f for f in findings if f.risk == 'HIGH']
            print(f'{DIM}Applying {len(findings)} HIGH-risk replacement(s)...{RESET}')
        else:
            print(f'{DIM}Applying {len(findings)} replacement(s)...{RESET}')
    else:
        print(f'{DIM}--auto: applying {len(findings)} replacement(s)...{RESET}')

    # ── Apply ─────────────────────────────────────────────────────────────────
    replaced = apply_replacements(findings)
    print(f'\n{GREEN}✓  {replaced} replacement{"s" if replaced != 1 else ""} applied.{RESET}\n')

    if not args.no_report:
        rp = write_report(findings, replaced, scanned, target, report_dir, dry_run=False)
        print(f'{DIM}Report: {rp}{RESET}')


if __name__ == '__main__':
    main()
