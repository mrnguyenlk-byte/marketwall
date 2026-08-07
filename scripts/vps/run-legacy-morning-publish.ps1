[CmdletBinding()]
param(
  [string]$LegacyScriptPath = "C:\btrading\capture_and_publish.py",
  [string]$PythonCommand = "python",
  [string]$GoldLogPath = "C:\AmiBroker_AutoData\xauusd_task.log",
  [string]$VnindexLogPath = "C:\AmiBroker_AutoData\vnindex_update.log",
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

function Get-LatestClosedDate([string]$Path, [string]$Pattern, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Label log was not found: $Path"
  }

  $matches = Select-String -LiteralPath $Path -Pattern $Pattern -AllMatches
  if (-not $matches) {
    throw "$Label log has no closed-candle date: $Path"
  }

  $last = $matches[$matches.Count - 1]
  $match = [regex]::Match($last.Line, $Pattern)
  if (-not $match.Success) {
    throw "$Label date could not be parsed: $($last.Line)"
  }

  return [DateTime]::ParseExact($match.Groups[1].Value, "yyyy-MM-dd", $null).Date
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
  $vnindexDate = Get-LatestClosedDate $VnindexLogPath "VNINDEX_D1_LAST_CLOSED_DATE\s+(\d{4}-\d{2}-\d{2})" "VNINDEX"
  $goldDate = Get-LatestClosedDate $GoldLogPath "XAUUSD_D1_LAST_CLOSED_DATE\s+(\d{4}-\d{2}-\d{2})" "XAUUSD"

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
