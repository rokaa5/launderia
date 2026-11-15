param()

# Stop any old instances
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue

# Ensure node server is running on 8105
$conn = Get-NetTCPConnection -LocalPort 8105 -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
    Start-Process node -ArgumentList 'serve-mobile.mjs' -WorkingDirectory 'C:\T3 Projects\Projects\launderia' -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

$logFile = 'C:\T3 Projects\Projects\launderia\cf_daemon.log'
if (Test-Path $logFile) { Remove-Item $logFile -Force }

# Launch cloudflared detached
Start-Process 'C:\T3 Projects\Projects\launderia\cloudflared.exe' `
    -ArgumentList 'tunnel --url http://127.0.0.1:8105' `
    -WorkingDirectory 'C:\T3 Projects\Projects\launderia' `
    -RedirectStandardError $logFile `
    -WindowStyle Hidden

# Wait for URL to appear in log
$url = $null
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logFile) {
        $match = Select-String -Path $logFile -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com'
        if ($match) {
            $url = $match.Matches[0].Value
            break
        }
    }
}

if ($url) {
    Set-Content -Path 'C:\T3 Projects\Projects\launderia\current-tunnel-url.txt' -Value $url -Force
    Write-Output "TUNNEL_URL: $url"
} else {
    Write-Error "Failed to extract tunnel URL within 20s"
}
