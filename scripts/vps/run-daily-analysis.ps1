[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path $PSScriptRoot "..\..\.vps-daily-analysis.env"),
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-RunLog([string]$Message) {
  $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
  Write-Host "[$timestamp] $Message"
}

function Read-Config([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing VPS config: $Path. Copy scripts/vps/daily-analysis.env.example and fill in its values."
  }

  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $parts = $trimmed.Split("=", 2)
    if ($parts.Count -ne 2) { throw "Invalid config line: $line" }
    $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"')
  }
  return $values
}

function Require-Config($Config, [string]$Name) {
  if (-not $Config.ContainsKey($Name) -or -not $Config[$Name]) {
    throw "Missing required config value: $Name"
  }
  return $Config[$Name]
}

function Test-FreshImage([string]$Path, [int]$MaximumAgeMinutes) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Chart image was not found: $Path"
  }
  $age = (New-TimeSpan -Start (Get-Item -LiteralPath $Path).LastWriteTime -End (Get-Date)).TotalMinutes
  if ($age -gt $MaximumAgeMinutes) {
    throw "Chart image is stale ($([Math]::Round($age, 1)) minutes old): $Path"
  }
}

$config = Read-Config $ConfigPath
$endpoint = Require-Config $config "DAILY_ANALYSIS_ENDPOINT"
$secret = Require-Config $config "DAILY_AUTOMATION_SECRET"
$vnindexImage = Require-Config $config "VNINDEX_IMAGE_PATH"
$goldImage = Require-Config $config "GOLD_IMAGE_PATH"
$timezoneId = if ($config["TIMEZONE_ID"]) { $config["TIMEZONE_ID"] } else { "SE Asia Standard Time" }
$maxImageAgeMinutes = if ($config["MAX_IMAGE_AGE_MINUTES"]) { [int]$config["MAX_IMAGE_AGE_MINUTES"] } else { 180 }
$lockPath = if ($config["LOCK_PATH"]) { $config["LOCK_PATH"] } else { Join-Path $env:TEMP "btrading-daily-analysis.lock" }

$mutex = New-Object System.Threading.Mutex($false, "Global\\BTradingDailyAnalysis")
if (-not $mutex.WaitOne(0)) {
  Write-RunLog "Another Daily Analysis run is already in progress; exiting."
  exit 0
}

try {
  if (Test-Path -LiteralPath $lockPath) {
    $lockAgeMinutes = (New-TimeSpan -Start (Get-Item -LiteralPath $lockPath).LastWriteTime -End (Get-Date)).TotalMinutes
    if ($lockAgeMinutes -lt 30) {
      Write-RunLog "Recent lock file exists; exiting."
      exit 0
    }
    Remove-Item -LiteralPath $lockPath -Force
  }
  New-Item -ItemType File -Path $lockPath -Force | Out-Null

  $timezone = [TimeZoneInfo]::FindSystemTimeZoneById($timezoneId)
  $today = [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $timezone)
  if (-not $Force -and ($today.DayOfWeek -eq [DayOfWeek]::Saturday -or $today.DayOfWeek -eq [DayOfWeek]::Sunday)) {
    Write-RunLog "Weekend in $timezoneId; exiting. Use -Force for a manual run."
    exit 0
  }

  Test-FreshImage $vnindexImage $maxImageAgeMinutes
  Test-FreshImage $goldImage $maxImageAgeMinutes

  $client = New-Object System.Net.Http.HttpClient
  $client.Timeout = [TimeSpan]::FromMinutes(5)
  $form = New-Object System.Net.Http.MultipartFormDataContent
  try {
    $form.Add((New-Object System.Net.Http.StringContent($secret)), "secret")
    $form.Add((New-Object System.Net.Http.StringContent($today.ToString("yyyy-MM-dd"))), "date")

    foreach ($upload in @(@{ Name = "vnindexImage"; Path = $vnindexImage }, @{ Name = "goldImage"; Path = $goldImage })) {
      $stream = [System.IO.File]::OpenRead($upload.Path)
      $content = New-Object System.Net.Http.StreamContent($stream)
      $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
      $form.Add($content, $upload.Name, [System.IO.Path]::GetFileName($upload.Path))
    }

    Write-RunLog "Uploading charts for $($today.ToString('yyyy-MM-dd'))..."
    $response = $client.PostAsync($endpoint, $form).GetAwaiter().GetResult()
    $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      throw "Automation API returned HTTP $([int]$response.StatusCode): $body"
    }
    Write-RunLog "Completed: $body"
  } finally {
    $form.Dispose()
    $client.Dispose()
  }
} finally {
  if (Test-Path -LiteralPath $lockPath) { Remove-Item -LiteralPath $lockPath -Force }
  $mutex.ReleaseMutex()
  $mutex.Dispose()
}
