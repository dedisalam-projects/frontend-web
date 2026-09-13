# SSR Verification Script
# Verifies that Angular 22 SSR servers for Landing (4001), Auth (4002), and Dashboard (4000)
# render valid HTML markup on initial server response.

$ErrorActionPreference = "Stop"

$endpoints = @(
    @{ Name = "Landing (SSR)"; Url = "http://localhost:4001/"; ExpectedMarker = "app-root" },
    @{ Name = "Auth (SSR)"; Url = "http://localhost:4002/"; ExpectedMarker = "app-root" },
    @{ Name = "Dashboard (SSR)"; Url = "http://localhost:4000/"; ExpectedMarker = "app-root" }
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Angular 22 SSR Verification Suite      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

foreach ($ep in $endpoints) {
    Write-Host "`nTesting $($ep.Name) at $($ep.Url)..." -NoNewline
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $ep.Url -UseBasicParsing -TimeoutSec 10 -Method Get
        $stopwatch.Stop()
        $latency = $stopwatch.ElapsedMilliseconds

        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            $hasMarker = $content -like "*$($ep.ExpectedMarker)*" -or $content -like "*<html*"

            if ($hasMarker) {
                Write-Host " [PASS]" -ForegroundColor Green -NoNewline
                Write-Host " (HTTP 200, Latency: ${latency}ms, Length: $($content.Length) bytes)"
                $passed++
            } else {
                Write-Host " [FAIL]" -ForegroundColor Red -NoNewline
                Write-Host " (HTTP 200 but marker '$($ep.ExpectedMarker)' not found in response)"
                $failed++
            }
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red -NoNewline
            Write-Host " (HTTP $($response.StatusCode))"
            $failed++
        }
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red -NoNewline
        Write-Host " (Exception: $($_.Exception.Message))"
        $failed++
    }
}

$resultColor = if ($passed -gt 0 -and $failed -eq 0) { "Green" } else { "Yellow" }
Write-Host "`n-----------------------------------------" -ForegroundColor Cyan
Write-Host "Results: Passed: $passed, Failed: $failed" -ForegroundColor $resultColor
Write-Host "-----------------------------------------" -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
} else {
    exit 0
}
