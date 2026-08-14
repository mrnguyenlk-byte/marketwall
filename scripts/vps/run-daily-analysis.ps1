[CmdletBinding()]
param(
  [string]$ConfigPath,
  [switch]$Force,
  [switch]$Publish,
  [switch]$ReadinessCheck,
  [switch]$SkipCapture
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Net.Http
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$scriptPath = $MyInvocation.MyCommand.Path
if (-not $scriptPath) { throw "The runner script path could not be resolved." }
$scriptDirectory = Split-Path -Parent $scriptPath
if (-not $ConfigPath) {
  $ConfigPath = Join-Path $scriptDirectory "..\..\.vps-daily-analysis.env"
}

$script:LogPath = "C:\BTradingData\logs\daily-analysis-runner.log"
$script:Stage = "initializing"
$script:LastError = $null
$script:ExpectedSession = $null
$script:VnindexSession = $null
$script:GoldSession = $null
$config = $null
$reportDate = $null

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

function Rotate-RunLog([string]$Path) {
  if ((Test-Path -LiteralPath $Path -PathType Leaf) -and (Get-Item -LiteralPath $Path).Length -gt 5242880) {
    $archive = "$Path.1"
    Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
    Move-Item -LiteralPath $Path -Destination $archive -Force
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

function Get-ExpectedSessionDate([DateTime]$ReportDate) {
  $candidate = $ReportDate.Date.AddDays(-1)
  while ($candidate.DayOfWeek -eq [DayOfWeek]::Saturday -or $candidate.DayOfWeek -eq [DayOfWeek]::Sunday) {
    $candidate = $candidate.AddDays(-1)
  }
  return $candidate
}

function Get-LatestCsvDate([string]$Path, [string]$Market) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "$Market CSV was not found: $Path" }
  $latest = $null
  foreach ($row in @(Import-Csv -LiteralPath $Path)) {
    $raw = [string]$row.Date
    if (-not $raw) { continue }
    try {
      $parsed = [DateTime]::Parse($raw).Date
      if ($null -eq $latest -or $parsed -gt $latest) { $latest = $parsed }
    } catch { }
  }
  if ($null -eq $latest) { throw "$Market CSV has no valid Date values: $Path" }
  return $latest
}

function Send-ReadinessStatus($Config, [hashtable]$Payload) {
  if ($null -eq $Config) { return }
  $secret = $Config["DAILY_AUTOMATION_SECRET"]
  if (-not $secret) { return }
  $endpoint = $Config["DAILY_ANALYSIS_STATUS_ENDPOINT"]
  if (-not $endpoint -and $Config["DAILY_ANALYSIS_ENDPOINT"]) {
    $endpoint = $Config["DAILY_ANALYSIS_ENDPOINT"] -replace '/run$', '/status'
  }
  if (-not $endpoint) { return }

  $client = New-Object System.Net.Http.HttpClient
  $client.Timeout = [TimeSpan]::FromSeconds(30)
  try {
    $client.DefaultRequestHeaders.Add("x-btrading-secret", $secret)
    $content = New-Object System.Net.Http.StringContent(($Payload | ConvertTo-Json -Depth 3), [Text.Encoding]::UTF8, "application/json")
    $response = $client.PostAsync($endpoint, $content).GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) { throw "HTTP $([int]$response.StatusCode)" }
    Write-RunLog "STATUS_REPORTED mode=$($Payload.mode) stage=$($Payload.stage)"
  } finally {
    if ($content) { $content.Dispose() }
    $client.Dispose()
  }
}

$exitCode = 0
$mutex = $null
$lockPath = $null
$mutexHeld = $false
$healthPath = "C:\BTradingData\logs\daily-analysis-health.json"
try {
  $config = Read-Config $ConfigPath
  if ($config["LOG_PATH"]) { $script:LogPath = $config["LOG_PATH"] }
  Rotate-RunLog $script:LogPath
  Write-RunLog "START publish=$Publish readiness=$ReadinessCheck config=$ConfigPath"
  $script:Stage = "config-loaded"

  $vnindexImage = Require-Config $config "VNINDEX_IMAGE_PATH"
  $goldImage = Require-Config $config "GOLD_IMAGE_PATH"
  $vnindexCsv = if ($config["VNINDEX_CSV_PATH"]) { $config["VNINDEX_CSV_PATH"] } else { "C:\AmiBroker_AutoData\VNINDEX_D1_AB.csv" }
  $goldCsv = if ($config["GOLD_CSV_PATH"]) { $config["GOLD_CSV_PATH"] } else { "C:\AmiBroker_AutoData\XAUUSD_D1_AB.csv" }
  $healthPath = if ($config["HEALTH_PATH"]) { $config["HEALTH_PATH"] } else { "C:\BTradingData\logs\daily-analysis-health.json" }
  $timezoneId = if ($config["TIMEZONE_ID"]) { $config["TIMEZONE_ID"] } else { "SE Asia Standard Time" }
  $maxImageAgeMinutes = if ($config["MAX_IMAGE_AGE_MINUTES"]) { [int]$config["MAX_IMAGE_AGE_MINUTES"] } else { 90 }
  $dataRetryCount = if ($config["DATA_READY_RETRY_COUNT"]) { [int]$config["DATA_READY_RETRY_COUNT"] } else { 4 }
  $dataRetryDelaySeconds = if ($config["DATA_READY_RETRY_DELAY_SECONDS"]) { [int]$config["DATA_READY_RETRY_DELAY_SECONDS"] } else { 120 }
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
      $expectedSession = Get-ExpectedSessionDate $today
      $script:ExpectedSession = $expectedSession.ToString("yyyy-MM-dd")
      $script:Stage = "waiting-for-market-data"
      for ($attempt = 1; $attempt -le $dataRetryCount; $attempt++) {
        $vnindexSession = Get-LatestCsvDate $vnindexCsv "VNINDEX"
        $goldSession = Get-LatestCsvDate $goldCsv "XAUUSD"
        $script:VnindexSession = $vnindexSession.ToString("yyyy-MM-dd")
        $script:GoldSession = $goldSession.ToString("yyyy-MM-dd")
        if ($vnindexSession -eq $expectedSession -and $goldSession -eq $expectedSession) { break }
        if ($attempt -lt $dataRetryCount) {
          Write-RunLog "DATA_WAIT attempt=$attempt/$dataRetryCount expected=$script:ExpectedSession vnindex=$script:VnindexSession gold=$script:GoldSession retrySeconds=$dataRetryDelaySeconds"
          Start-Sleep -Seconds $dataRetryDelaySeconds
        }
      }
      if ($vnindexSession -ne $expectedSession -or $goldSession -ne $expectedSession) {
        throw "SESSION_BLOCKED expected=$($expectedSession.ToString('yyyy-MM-dd')) vnindex=$($vnindexSession.ToString('yyyy-MM-dd')) gold=$($goldSession.ToString('yyyy-MM-dd'))"
      }
      Write-RunLog "SESSION_OK expected=$($expectedSession.ToString('yyyy-MM-dd')) vnindex=$($vnindexSession.ToString('yyyy-MM-dd')) gold=$($goldSession.ToString('yyyy-MM-dd'))"
      $script:Stage = "capturing-charts"
      if (-not $SkipCapture) {
        & (Join-Path $scriptDirectory "capture-ami-broker-charts.ps1") -ConfigPath $ConfigPath
        if (-not $?) { throw "AmiBroker chart capture failed." }
      }
      Test-FreshImage $vnindexImage $maxImageAgeMinutes
      Test-FreshImage $goldImage $maxImageAgeMinutes
      Test-ChartImageQuality $vnindexImage "VNINDEX"
      Test-ChartImageQuality $goldImage "XAUUSD"
      $script:Stage = "charts-validated"

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
          $form.Add((New-Object System.Net.Http.StringContent($vnindexSession.ToString("yyyy-MM-dd"))), "vnindexSessionDate")
          $form.Add((New-Object System.Net.Http.StringContent($goldSession.ToString("yyyy-MM-dd"))), "goldSessionDate")
          foreach ($upload in @(@{ Name = "vnindexImage"; Path = $vnindexImage }, @{ Name = "goldImage"; Path = $goldImage })) {
            $stream = [System.IO.File]::OpenRead($upload.Path)
            $content = New-Object System.Net.Http.StreamContent($stream)
            $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
            $form.Add($content, $upload.Name, [System.IO.Path]::GetFileName($upload.Path))
          }
          Write-RunLog "POST_START date=$reportDate endpoint=$endpoint"
          $script:Stage = "uploading"
          $response = $client.PostAsync($endpoint, $form).GetAwaiter().GetResult()
          $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
          if (-not $response.IsSuccessStatusCode) { throw "Automation API HTTP $([int]$response.StatusCode): $body" }
          try { $result = $body | ConvertFrom-Json } catch { throw "Automation API returned invalid JSON: $body" }
          if (-not $result.success) { throw "Automation API did not confirm success: $body" }
          if ($result.status -eq "in_progress") { throw "Automation API is still in progress; no publish success was confirmed." }
          $status = if ($result.status) { $result.status } else { "processed" }
          Write-RunLog "PUBLISH_CONFIRMED date=$reportDate status=$status"
          $script:Stage = "published"
        } finally {
          $form.Dispose()
          $client.Dispose()
        }
      }
    }
  }
} catch {
  $exitCode = 1
  $script:LastError = $_.Exception.Message
  $script:Stage = "failed"
  Write-RunLog "FAILED $($_.Exception.Message)"
} finally {
  if ($lockPath -and (Test-Path -LiteralPath $lockPath)) { Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue }
  if ($mutex) {
    if ($mutexHeld) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
  }
  Write-RunLog "END exitCode=$exitCode"
  try {
    $healthDirectory = Split-Path -Parent $healthPath
    if ($healthDirectory) { New-Item -ItemType Directory -Path $healthDirectory -Force | Out-Null }
    $health = @{
      checkedAt = (Get-Date).ToString("o")
      reportDate = $reportDate
      exitCode = $exitCode
      stage = $script:Stage
      error = $script:LastError
      expectedSession = $script:ExpectedSession
      vnindexSession = $script:VnindexSession
      goldSession = $script:GoldSession
      logPath = $script:LogPath
      mode = if ($ReadinessCheck) { "readiness" } elseif ($Publish) { "publish" } else { "dry-run" }
    }
    $health | ConvertTo-Json | Set-Content -LiteralPath $healthPath -Encoding UTF8
    try { Send-ReadinessStatus $config $health } catch { Write-RunLog "STATUS_REPORT_FAILED $($_.Exception.Message)" }
  } catch { }
}

exit $exitCode
