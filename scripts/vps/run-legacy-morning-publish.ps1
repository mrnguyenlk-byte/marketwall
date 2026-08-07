[CmdletBinding()]
param(
  [string]$LegacyScriptPath = "C:\btrading\capture_and_publish.py",
  [string]$PythonCommand = "python",
  [string]$GoldCsvPath = "C:\AmiBroker_AutoData\XAUUSD_D1_AB.csv",
  [string]$VnindexCsvPath = "C:\AmiBroker_AutoData\VNINDEX_D1_AB.csv",
  [string]$LogPath = "C:\BTradingData\daily-analysis\legacy-morning-publish.log"
)

$ErrorActionPreference = "Stop"

function Write-RunLog([string]$Message) {
  $line = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] $Message"
  Write-Host $line
  $directory = Split-Path -Parent $LogPath
  if ($directory) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
  Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
}

function Get-LatestImportedDate([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Label imported CSV was not found: $Path"
  }

  $rows = @(Import-Csv -LiteralPath $Path)
  if ($rows.Count -eq 0) {
    throw "$Label imported CSV has no data rows: $Path"
  }

  $dates = @()
  foreach ($row in $rows) {
    $rawDate = [string]$row.Date
    if (-not $rawDate) { continue }
    try { $dates += [DateTime]::Parse($rawDate).Date } catch { }
  }

  if ($dates.Count -eq 0) {
    throw "$Label imported CSV has no valid Date values: $Path"
  }

  return ($dates | Sort-Object -Descending | Select-Object -First 1)
}

function Get-ExpectedSessionDate([DateTime]$ReportDate) {
  $candidate = $ReportDate.Date.AddDays(-1)
  while ($candidate.DayOfWeek -eq [DayOfWeek]::Saturday -or $candidate.DayOfWeek -eq [DayOfWeek]::Sunday) {
    $candidate = $candidate.AddDays(-1)
  }
  return $candidate
}

try {
  $now = Get-Date
  if ($now.DayOfWeek -eq [DayOfWeek]::Saturday -or $now.DayOfWeek -eq [DayOfWeek]::Sunday) {
    Write-RunLog "SKIPPED weekend."
    exit 0
  }

  $expected = Get-ExpectedSessionDate $now
  $vnindexDate = Get-LatestImportedDate $VnindexCsvPath "VNINDEX"
  $goldDate = Get-LatestImportedDate $GoldCsvPath "XAUUSD"

  if ($vnindexDate -ne $expected -or $goldDate -ne $expected) {
    Write-RunLog "BLOCKED expected=$($expected.ToString('yyyy-MM-dd')) vnindex=$($vnindexDate.ToString('yyyy-MM-dd')) gold=$($goldDate.ToString('yyyy-MM-dd'))"
    exit 2
  }

  if (-not (Test-Path -LiteralPath $LegacyScriptPath -PathType Leaf)) {
    throw "Legacy publisher was not found: $LegacyScriptPath"
  }

  Write-RunLog "START legacy publisher expectedSession=$($expected.ToString('yyyy-MM-dd'))"
  & $PythonCommand $LegacyScriptPath
  if ($LASTEXITCODE -ne 0) {
    throw "Legacy publisher exited with code $LASTEXITCODE"
  }
  Write-RunLog "LEGACY_PROCESS_OK exitCode=0; verify the published article separately."
  exit 0
} catch {
  Write-RunLog "FAILED $($_.Exception.Message)"
  exit 1
}
