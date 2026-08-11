[CmdletBinding()]
param(
  [string]$ConfigPath = "C:\btrading-code\.vps-daily-analysis.env",
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Read-Config([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Missing config: $Path" }
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $parts = $trimmed.Split("=", 2)
    if ($parts.Count -eq 2) { $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"') }
  }
  return $values
}

function Get-ExpectedSessionDate([DateTime]$ReportDate) {
  $candidate = $ReportDate.Date.AddDays(-1)
  while ($candidate.DayOfWeek -eq [DayOfWeek]::Saturday -or $candidate.DayOfWeek -eq [DayOfWeek]::Sunday) { $candidate = $candidate.AddDays(-1) }
  return $candidate
}

function Get-LatestCsvDate([string]$Path, [string]$Market) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "$Market CSV was not found: $Path" }
  $latest = $null
  foreach ($row in @(Import-Csv -LiteralPath $Path)) {
    try {
      $parsed = [DateTime]::Parse([string]$row.Date).Date
      if ($null -eq $latest -or $parsed -gt $latest) { $latest = $parsed }
    } catch { }
  }
  if ($null -eq $latest) { throw "$Market CSV has no valid Date values: $Path" }
  return $latest
}

$config = Read-Config $ConfigPath
$logPath = if ($config["COMMAND_CENTER_LOG_PATH"]) { $config["COMMAND_CENTER_LOG_PATH"] } else { "C:\BTradingData\logs\command-center-briefing.log" }
$statePath = if ($config["COMMAND_CENTER_STATE_PATH"]) { $config["COMMAND_CENTER_STATE_PATH"] } else { "C:\BTradingData\command-center" }
$endpoint = if ($config["COMMAND_CENTER_AUTO_PUBLISH_ENDPOINT"]) { $config["COMMAND_CENTER_AUTO_PUBLISH_ENDPOINT"] } else { "https://btrading-command-center.binh-nguyen-1597.chatgpt.site/api/briefings/auto-publish" }
$secret = [string]$config["DAILY_AUTOMATION_SECRET"]
if (-not $secret) { throw "DAILY_AUTOMATION_SECRET is missing from $ConfigPath" }
$vnCsv = if ($config["VNINDEX_CSV_PATH"]) { $config["VNINDEX_CSV_PATH"] } else { "C:\AmiBroker_AutoData\VNINDEX_D1_AB.csv" }
$goldCsv = if ($config["GOLD_CSV_PATH"]) { $config["GOLD_CSV_PATH"] } else { "C:\AmiBroker_AutoData\XAUUSD_D1_AB.csv" }
$timezoneId = if ($config["TIMEZONE_ID"]) { $config["TIMEZONE_ID"] } else { "SE Asia Standard Time" }

function Write-RunLog([string]$Message) {
  $line = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] $Message"
  Write-Host $line
  $directory = Split-Path -Parent $logPath
  if ($directory) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
  Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
}

$exitCode = 0
$mutex = New-Object -TypeName System.Threading.Mutex -ArgumentList @($false, "BTradingCommandCenter0730")
$held = $false
try {
  $held = $mutex.WaitOne(0)
  if (-not $held) { Write-RunLog "SKIPPED another 07:30 run is active."; exit 0 }
  $timezone = [TimeZoneInfo]::FindSystemTimeZoneById($timezoneId)
  $now = [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $timezone)
  if (-not $Force -and ($now.DayOfWeek -eq [DayOfWeek]::Saturday -or $now.DayOfWeek -eq [DayOfWeek]::Sunday)) { Write-RunLog "SKIPPED weekend."; exit 0 }

  $date = $now.ToString("yyyy-MM-dd")
  New-Item -ItemType Directory -Path $statePath -Force | Out-Null
  $successMarker = Join-Path $statePath "published-$date.ok"
  if ((Test-Path -LiteralPath $successMarker) -and -not $Force) { Write-RunLog "SKIPPED already confirmed for $date."; exit 0 }

  $expected = Get-ExpectedSessionDate $now
  $vnDate = Get-LatestCsvDate $vnCsv "VNINDEX"
  $goldDate = Get-LatestCsvDate $goldCsv "XAUUSD"
  if ($vnDate -ne $expected -or $goldDate -ne $expected) {
    throw "SESSION_BLOCKED expected=$($expected.ToString('yyyy-MM-dd')) vnindex=$($vnDate.ToString('yyyy-MM-dd')) gold=$($goldDate.ToString('yyyy-MM-dd'))"
  }
  Write-RunLog "SESSION_OK reportDate=$date session=$($expected.ToString('yyyy-MM-dd')) flow=command-center-0730"
  if ($DryRun) { Write-RunLog "DRY_RUN_OK flow=command-center-0730; no HTTP request was made."; exit 0 }

  $client = New-Object System.Net.Http.HttpClient
  $client.Timeout = [TimeSpan]::FromMinutes(10)
  try {
    $client.DefaultRequestHeaders.Add("x-btrading-secret", $secret)
    if ($config["COMMAND_CENTER_ACCESS_TOKEN"]) { $client.DefaultRequestHeaders.Add("OAI-Sites-Authorization", "Bearer $($config['COMMAND_CENTER_ACCESS_TOKEN'])") }
    $payload = New-Object -TypeName System.Net.Http.StringContent -ArgumentList @('{"source":"command-center-0730"}', [Text.Encoding]::UTF8, "application/json")
    Write-RunLog "POST_START flow=command-center-0730 endpoint=$endpoint"
    $response = $client.PostAsync($endpoint, $payload).GetAwaiter().GetResult()
    $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) { throw "Command Center HTTP $([int]$response.StatusCode): $($body.Substring(0, [Math]::Min(500, $body.Length)))" }
    try { $result = $body | ConvertFrom-Json } catch { throw "Command Center returned invalid JSON." }
    if ($result.status -ne "published" -and $result.reason -ne "already_published") { throw "Command Center did not confirm publication: $body" }
    "confirmed=$((Get-Date).ToString('o')) status=$($result.status) reason=$($result.reason)" | Set-Content -LiteralPath $successMarker -Encoding UTF8
    Write-RunLog "PUBLISH_CONFIRMED flow=command-center-0730 status=$($result.status) reason=$($result.reason)"
  } finally { $client.Dispose() }
} catch {
  $exitCode = 1
  Write-RunLog "FAILED flow=command-center-0730 error=$($_.Exception.Message)"
} finally {
  if ($held) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
  Write-RunLog "END flow=command-center-0730 exitCode=$exitCode"
}
exit $exitCode
