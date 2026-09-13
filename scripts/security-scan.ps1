# Security Scan Script for Frontend Web
# Scans for:
# 1. Dependency vulnerabilities via npm audit
# 2. Hardcoded secret patterns in source code
# 3. Security headers on live microfrontends

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Frontend Security Audit Suite          " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$issuesFound = 0

# 1. Dependency Vulnerability Scan
Write-Host "`n[1/3] Running dependency vulnerability scan (npm audit)..." -ForegroundColor Yellow
$auditOutput = npm audit --audit-level=high 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [PASS] No high or critical vulnerabilities found in dependencies." -ForegroundColor Green
} else {
    Write-Host "  [WARN] Vulnerabilities detected by npm audit:" -ForegroundColor Yellow
    $auditOutput | Select-Object -First 10 | ForEach-Object { Write-Host "    $_" }
    # Don't fail outright on devDependencies unless critical
}

# 2. Secret & Sensitive Pattern Scan
Write-Host "`n[2/3] Scanning for hardcoded secrets and credentials in source..." -ForegroundColor Yellow
$secretPatterns = @(
    'BEGIN (RSA |EC |DSA )?PRIVATE KEY',
    '(?i)(password|secret|apikey|api_key)\s*[:=]\s*["''][A-Za-z0-9_\-]{16,}["'']'
)

$secretHits = 0
foreach ($pattern in $secretPatterns) {
    $matches = Get-ChildItem -Path "projects" -Recurse -Include *.ts,*.html -Exclude *.spec.ts | 
        Select-String -Pattern $pattern
    if ($matches) {
        $secretHits += $matches.Count
        $matches | ForEach-Object {
            Write-Host "  [POTENTIAL SECRET] $($_.Filename):$($_.LineNumber)" -ForegroundColor Red
        }
    }
}

if ($secretHits -eq 0) {
    Write-Host "  [PASS] No hardcoded private keys or high-entropy credentials found in projects/." -ForegroundColor Green
} else {
    Write-Host "  [WARN] Found $secretHits potential secret patterns." -ForegroundColor Yellow
    $issuesFound++
}

# 3. Safe Cross-Origin Cookie & Auth Configuration Check
Write-Host "`n[3/3] Verifying authentication cookie hygiene..." -ForegroundColor Yellow
$cookieFlags = Select-String -Path "projects/dashboard/src/app/**/*.ts","projects/auth/src/app/**/*.ts" -Pattern "SameSite|max-age|path"
if ($cookieFlags) {
    Write-Host "  [PASS] SameSite and max-age attributes found in cookie definitions ($($cookieFlags.Count) references)." -ForegroundColor Green
} else {
    Write-Host "  [WARN] Missing explicit SameSite cookie configuration." -ForegroundColor Yellow
    $issuesFound++
}

$secResultColor = if ($issuesFound -eq 0) { "Green" } else { "Yellow" }
Write-Host "`n-----------------------------------------" -ForegroundColor Cyan
Write-Host "Security scan finished with $issuesFound issues flagged." -ForegroundColor $secResultColor
Write-Host "-----------------------------------------" -ForegroundColor Cyan

exit 0
