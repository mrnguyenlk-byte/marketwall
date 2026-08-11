[CmdletBinding()]
param(
  [string]$ConfigPath
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $scriptPath = $MyInvocation.MyCommand.Path
  if ([string]::IsNullOrWhiteSpace($scriptPath)) { throw "Cannot resolve runner path." }
  $ConfigPath = Join-Path (Split-Path (Split-Path (Split-Path $scriptPath -Parent) -Parent) -Parent) ".vps-daily-analysis.env"
}

function Read-EnvFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "Config file not found: $Path" }
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $parts = $trimmed.Split(@("="), 2)
    if ($parts.Count -eq 2) { $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"') }
  }
  return $values
}

function Write-RunLog([string]$Message) {
  $directory = Split-Path -Parent $script:LogPath
  if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  Add-Content -LiteralPath $script:LogPath -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
}

$config = Read-EnvFile $ConfigPath
$endpoint = if ($config["TELEGRAM_MARKET_ALERT_ENDPOINT"]) {
  $config["TELEGRAM_MARKET_ALERT_ENDPOINT"]
} else {
  "https://btrading.org/api/cron/telegram-market-alerts"
}
$secret = $config["DAILY_AUTOMATION_SECRET"]
if ([string]::IsNullOrWhiteSpace($secret)) { throw "DAILY_AUTOMATION_SECRET is required." }
$script:LogPath = if ($config["TELEGRAM_MARKET_ALERT_LOG_PATH"]) {
  $config["TELEGRAM_MARKET_ALERT_LOG_PATH"]
} else {
  "C:\BTradingData\logs\telegram-market-alerts.log"
}

$mutex = New-Object -TypeName System.Threading.Mutex -ArgumentList @($false, "BTradingTelegramMarketAlerts")
$ownsMutex = $false
try {
  $ownsMutex = $mutex.WaitOne(0)
  if (-not $ownsMutex) {
    Write-RunLog "SKIPPED reason=previous-run-still-active"
    exit 0
  }

  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
      $client = New-Object System.Net.WebClient
      $client.Headers.Add("Authorization", "Bearer $secret")
      $client.Headers.Add("Accept", "application/json")
      $body = $client.DownloadString($endpoint)
      Write-RunLog "SUCCESS attempt=$attempt response=$body"
      exit 0
    } catch [System.Net.WebException] {
      $status = 0
      if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
      $retryable = ($status -eq 0 -or $status -ge 500)
      Write-RunLog "FAILED attempt=$attempt http=$status retryable=$retryable error=$($_.Exception.Message)"
      if (-not $retryable -or $attempt -eq 3) { throw }
      Start-Sleep -Seconds 20
    }
  }
} catch {
  Write-RunLog "END status=failed error=$($_.Exception.Message)"
  exit 1
} finally {
  if ($ownsMutex) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}

