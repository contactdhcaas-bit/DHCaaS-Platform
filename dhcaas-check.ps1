$ErrorActionPreference = "Stop"

$logDir = "C:\Users\Data Health Check Intercafe\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path $logDir "dhcaas-check_$ts.log"

function Test-Url($url) {
  try {
    $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 10
    return "OK  $($r.StatusCode)  $url  $($r.Content)"
  } catch {
    return "ERR $url  $($_.Exception.Message)"
  }
}

$lines = @()
$lines += "=== DHCaaS Check $(Get-Date -Format o) ==="
$lines += Test-Url "http://127.0.0.1:8001/health"
$lines += Test-Url "http://127.0.0.1:3003/"
$lines += Test-Url "http://127.0.0.1:3003/api/health"

$lines | Out-File -FilePath $logFile -Encoding UTF8
$lines -join "`n"
