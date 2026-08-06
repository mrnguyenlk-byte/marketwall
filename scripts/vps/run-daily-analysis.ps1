[CmdletBinding()]
param(
  [string]$ConfigPath,
  [switch]$Force,
  [switch]$Publish,
  [switch]$SkipCapture,
  [switch]$SessionMarkerSelfTest
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$scriptPath = $MyInvocation.MyCommand.Path
if (-not $scriptPath) { throw "The runner script path could not be resolved." }
$scriptDirectory = Split-Path -Parent $scriptPath
if (-not $ConfigPath) {
  $ConfigPath = Join-Path $scriptDirectory "..\..\.vps-daily-analysis.env"
}

$script:LogPath = Join-Path $env:TEMP "btrading-daily-analysis-runner.log"

function Write-RunLog([string]$Message) {
  $line = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] $Message"
  Write-Host $line
  try {
    $directory = Split-Path -Parent $script:LogPath
    if ($directory) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
    Add-Content -LiteralPath $script:LogPath -Value $line -Encoding UTF8
  } catch {
    Write-Host "[log-fallback] $($_.Exception.Message)"
  }
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
  if (-not $Config.ContainsKey($Name) -or -not $Config[$Name]) { throw "Missing required config value: $Name" }
  return $Config[$Name]
}

function Test-FreshImage([string]$Path, [int]$MaximumAgeMinutes) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Chart image was not found: $Path" }
  $file = Get-Item -LiteralPath $Path
  if ($file.Length -lt 1024) { throw "Chart image is unexpectedly small ($($file.Length) bytes): $Path" }
  $age = (New-TimeSpan -Start $file.LastWriteTime -End (Get-Date)).TotalMinutes
  if ($age -gt $MaximumAgeMinutes) { throw "Chart image is stale ($([Math]::Round($age, 1)) minutes old): $Path" }
}

function Test-ChartImageQuality([string]$Path, [string]$Label) {
  $source = New-Object System.Drawing.Bitmap($Path)
  $sample = New-Object System.Drawing.Bitmap(32, 32)
  $graphics = [System.Drawing.Graphics]::FromImage($sample)
  try {
    $graphics.DrawImage($source, 0, 0, 32, 32)
    $brightness = New-Object 'System.Collections.Generic.List[double]'
    for ($x = 0; $x -lt 32; $x++) {
      for ($y = 0; $y -lt 32; $y++) {
        $pixel = $sample.GetPixel($x, $y)
        [void]$brightness.Add((0.2126 * $pixel.R) + (0.7152 * $pixel.G) + (0.0722 * $pixel.B))
      }
    }
    $mean = ($brightness | Measure-Object -Average).Average
    $sumSquaredDifference = 0.0
    foreach ($value in $brightness) { $sumSquaredDifference += [Math]::Pow($value - $mean, 2) }
    $variance = $sumSquaredDifference / $brightness.Count
    if ($mean -lt 3.0 -or $variance -lt 4.0) {
      throw "$Label PNG failed quality gate (mean=$([Math]::Round($mean, 2)), variance=$([Math]::Round($variance, 2))): $Path"
    }
  } finally {
    $graphics.Dispose()
    $sample.Dispose()
    $source.Dispose()
  }
}

function Test-SessionMarker([string]$Path, [string]$Market, [string]$ReportDate, [int]$MaximumAgeMinutes) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Market session marker is unavailable: $Path"
  }
  try { $marker = (Get-Content -LiteralPath $Path -Raw) | ConvertFrom-Json } catch { throw "$Market session marker is invalid JSON: $Path" }
  foreach ($field in @("schemaVersion", "market", "reportDate", "latestCompletedSessionDate", "expectedLatestCompletedSessionDate", "updatedAtUtc", "status")) {
    if (-not $marker.PSObject.Properties[$field] -or -not $marker.$field) { throw "$Market session marker is missing '$field': $Path" }
  }
  if ($marker.schemaVersion -ne 1 -or $marker.market -ne $Market) { throw "$Market session marker identity is invalid: $Path" }
  if ($marker.status -ne "verified") { throw "$Market session marker is not verified: $Path" }
  if ($marker.reportDate -ne $ReportDate) { throw "$Market session marker is for $($marker.reportDate), not report date ${ReportDate}: $Path" }
  try {
    $latest = [DateTime]::ParseExact([string]$marker.latestCompletedSessionDate, "yyyy-MM-dd", $null)
    $expected = [DateTime]::ParseExact([string]$marker.expectedLatestCompletedSessionDate, "yyyy-MM-dd", $null)
    $report = [DateTime]::ParseExact($ReportDate, "yyyy-MM-dd", $null)
    $updatedAt = [DateTime]::Parse([string]$marker.updatedAtUtc).ToUniversalTime()
  } catch { throw "$Market session marker contains an invalid date: $Path" }
  if ($latest -ne $expected) { throw "$Market latest candle $($latest.ToString('yyyy-MM-dd')) is older than expected completed session $($expected.ToString('yyyy-MM-dd'))" }
  if ($latest -ge $report) { throw "$Market latest completed candle must be before report date $ReportDate" }
  $age = (New-TimeSpan -Start $updatedAt -End ([DateTime]::UtcNow)).TotalMinutes
  if ($age -lt -5 -or $age -gt $MaximumAgeMinutes) { throw "$Market session marker is stale ($([Math]::Round($age, 1)) minutes): $Path" }
  Write-RunLog "SESSION_OK market=$Market session=$($latest.ToString('yyyy-MM-dd')) reportDate=$ReportDate"
}

function Invoke-SessionMarkerSelfTest {
  $directory = Join-Path $env:TEMP "btrading-session-marker-selftest"
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  $path = Join-Path $directory "marker.json"
  try {
    @{ schemaVersion = 1; market = "VNINDEX"; reportDate = "2026-08-10"; latestCompletedSessionDate = "2026-08-08"; expectedLatestCompletedSessionDate = "2026-08-08"; updatedAtUtc = [DateTime]::UtcNow.ToString("o"); status = "verified" } | ConvertTo-Json | Set-Content -LiteralPath $path -Encoding UTF8
    Test-SessionMarker $path "VNINDEX" "2026-08-10" 5
    $bad = @{ schemaVersion = 1; market = "VNINDEX"; reportDate = "2026-08-10"; latestCompletedSessionDate = "2026-08-07"; expectedLatestCompletedSessionDate = "2026-08-08"; updatedAtUtc = [DateTime]::UtcNow.ToString("o"); status = "verified" } | ConvertTo-Json
    Set-Content -LiteralPath $path -Value $bad -Encoding UTF8
    try { Test-SessionMarker $path "VNINDEX" "2026-08-10" 5; throw "Self-test accepted stale session" } catch { if ($_.Exception.Message -eq "Self-test accepted stale session") { throw } }
    Write-Host "SESSION_MARKER_SELF_TEST ok"
  } finally { Remove-Item -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue }
}

if ($SessionMarkerSelfTest) { Invoke-SessionMarkerSelfTest; exit 0 }

$exitCode = 0
$mutex = $null
$lockPath = $null
$mutexHeld = $false
try {
  $config = Read-Config $ConfigPath
  if ($config["LOG_PATH"]) { $script:LogPath = $config["LOG_PATH"] }
  Write-RunLog "START publish=$Publish config=$ConfigPath"

  $vnindexImage = Require-Config $config "VNINDEX_IMAGE_PATH"
  $goldImage = Require-Config $config "GOLD_IMAGE_PATH"
  $vnindexMarker = Require-Config $config "VNINDEX_SESSION_MARKER_PATH"
  $goldMarker = Require-Config $config "GOLD_SESSION_MARKER_PATH"
  $timezoneId = if ($config["TIMEZONE_ID"]) { $config["TIMEZONE_ID"] } else { "SE Asia Standard Time" }
  $maxImageAgeMinutes = if ($config["MAX_IMAGE_AGE_MINUTES"]) { [int]$config["MAX_IMAGE_AGE_MINUTES"] } else { 90 }
  $lockPath = if ($config["LOCK_PATH"]) { $config["LOCK_PATH"] } else { Join-Path $env:TEMP "btrading-daily-analysis.lock" }

  $mutex = New-Object -TypeName System.Threading.Mutex -ArgumentList @($false, "BTradingDailyAnalysis")
  $mutexHeld = $mutex.WaitOne(0)
  if (-not $mutexHeld) {
    Write-RunLog "SKIPPED another runner is active."
  } else {
    if (Test-Path -LiteralPath $lockPath) {
      $lockAgeMinutes = (New-TimeSpan -Start (Get-Item -LiteralPath $lockPath).LastWriteTime -End (Get-Date)).TotalMinutes
      if ($lockAgeMinutes -lt 30) { throw "Recent runner lock exists ($([Math]::Round($lockAgeMinutes, 1)) minutes): $lockPath" }
      Remove-Item -LiteralPath $lockPath -Force
    }
    New-Item -ItemType File -Path $lockPath -Force | Out-Null

    $timezone = [TimeZoneInfo]::FindSystemTimeZoneById($timezoneId)
    $today = [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $timezone)
    if (-not $Force -and ($today.DayOfWeek -eq [DayOfWeek]::Saturday -or $today.DayOfWeek -eq [DayOfWeek]::Sunday)) {
      Write-RunLog "SKIPPED weekend in $timezoneId."
    } else {
      $reportDate = $today.ToString("yyyy-MM-dd")
      Test-SessionMarker $vnindexMarker "VNINDEX" $reportDate 120
      Test-SessionMarker $goldMarker "XAUUSD" $reportDate 120
      if (-not $SkipCapture) {
        & (Join-Path $scriptDirectory "capture-ami-broker-charts.ps1") -ConfigPath $ConfigPath
        if (-not $?) { throw "AmiBroker chart capture failed." }
      }
      Test-FreshImage $vnindexImage $maxImageAgeMinutes
      Test-FreshImage $goldImage $maxImageAgeMinutes
      Test-ChartImageQuality $vnindexImage "VNINDEX"
      Test-ChartImageQuality $goldImage "XAUUSD"

      if (-not $Publish) {
        Write-RunLog "DRY_RUN_OK charts captured and validated; no HTTP request was made."
      } else {
        $endpoint = Require-Config $config "DAILY_ANALYSIS_ENDPOINT"
        $secret = Require-Config $config "DAILY_AUTOMATION_SECRET"
        $client = New-Object System.Net.Http.HttpClient
        $client.Timeout = [TimeSpan]::FromMinutes(5)
        $form = New-Object System.Net.Http.MultipartFormDataContent
        try {
          $form.Add((New-Object System.Net.Http.StringContent($secret)), "secret")
          $form.Add((New-Object System.Net.Http.StringContent($reportDate)), "date")
          foreach ($upload in @(@{ Name = "vnindexImage"; Path = $vnindexImage }, @{ Name = "goldImage"; Path = $goldImage })) {
            $stream = [System.IO.File]::OpenRead($upload.Path)
            $content = New-Object System.Net.Http.StreamContent($stream)
            $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
            $form.Add($content, $upload.Name, [System.IO.Path]::GetFileName($upload.Path))
          }
          Write-RunLog "POST_START date=$reportDate endpoint=$endpoint"
          $response = $client.PostAsync($endpoint, $form).GetAwaiter().GetResult()
          $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
          if (-not $response.IsSuccessStatusCode) { throw "Automation API HTTP $([int]$response.StatusCode): $body" }
          try { $result = $body | ConvertFrom-Json } catch { throw "Automation API returned invalid JSON: $body" }
          if (-not $result.success) { throw "Automation API did not confirm success: $body" }
          if ($result.status -eq "in_progress") { throw "Automation API is still in progress; no publish success was confirmed." }
          $status = if ($result.status) { $result.status } else { "processed" }
          Write-RunLog "PUBLISH_CONFIRMED date=$reportDate status=$status"
        } finally {
          $form.Dispose()
          $client.Dispose()
        }
      }
    }
  }
} catch {
  $exitCode = 1
  Write-RunLog "FAILED $($_.Exception.Message)"
} finally {
  if ($lockPath -and (Test-Path -LiteralPath $lockPath)) { Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue }
  if ($mutex) {
    if ($mutexHeld) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
  }
  Write-RunLog "END exitCode=$exitCode"
}

exit $exitCode
