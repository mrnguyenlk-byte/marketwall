[CmdletBinding()]
param(
  [string]$RepositoryPath = "C:\btrading-code",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath (Join-Path $RepositoryPath ".git"))) {
  throw "Not a Git working tree: $RepositoryPath"
}

Set-Location -LiteralPath $RepositoryPath

# Never overwrite VPS-local configuration or an operator's uncommitted work.
$changes = git status --porcelain
if ($LASTEXITCODE -ne 0) { throw "Could not inspect Git working tree." }
if ($changes) {
  throw "Refusing update: the VPS working tree has local changes. Resolve them manually before retrying."
}

git fetch --prune origin $Branch
if ($LASTEXITCODE -ne 0) { throw "git fetch failed." }

git merge --ff-only "origin/$Branch"
if ($LASTEXITCODE -ne 0) { throw "Fast-forward update failed." }

Write-Host "Updated BTrading runner to $(git rev-parse --short HEAD)"

# The user explicitly requested an independent 07:30 flow. Install/update it
# only when its VPS-local access token is present; never disturb the 07:00 task.
$configPath = Join-Path $RepositoryPath ".vps-daily-analysis.env"
$installerPath = Join-Path $RepositoryPath "scripts\vps\install-command-center-briefing-task.ps1"
if ((Test-Path -LiteralPath $configPath) -and (Test-Path -LiteralPath $installerPath)) {
  $hasAccessToken = $false
  foreach ($line in Get-Content -LiteralPath $configPath) {
    if ($line -match '^COMMAND_CENTER_ACCESS_TOKEN=(.+)$' -and $matches[1].Trim()) {
      $hasAccessToken = $true
      break
    }
  }
  if ($hasAccessToken) {
    & $installerPath -ConfigPath $configPath
    if (-not $?) { throw "Could not install the independent 07:30 task." }
    Write-Host "Verified BTrading Command Center Briefing 0730 task."
  } else {
    Write-Warning "07:30 task not installed: COMMAND_CENTER_ACCESS_TOKEN is missing from $configPath"
  }
}

# Keep the Telegram market-news monitor independently scheduled. It reuses the
# existing daily automation secret and does not modify either morning flow.
$telegramInstallerPath = Join-Path $RepositoryPath "scripts\vps\install-telegram-market-alerts-task.ps1"
if ((Test-Path -LiteralPath $configPath) -and (Test-Path -LiteralPath $telegramInstallerPath)) {
  $hasDailySecret = $false
  foreach ($line in Get-Content -LiteralPath $configPath) {
    if ($line -match '^DAILY_AUTOMATION_SECRET=(.+)$' -and $matches[1].Trim()) {
      $hasDailySecret = $true
      break
    }
  }
  if ($hasDailySecret) {
    & $telegramInstallerPath -RepositoryPath $RepositoryPath -ConfigPath $configPath
    if (-not $?) { throw "Could not install Telegram market alerts task." }
    Write-Host "Verified BTrading Telegram Market Alerts task."
  } else {
    Write-Warning "Telegram alerts task not installed: DAILY_AUTOMATION_SECRET is missing from $configPath"
  }
}
