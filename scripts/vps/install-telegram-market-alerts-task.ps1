[CmdletBinding()]
param(
  [string]$RepositoryPath = "C:\btrading-code",
  [string]$ConfigPath = "C:\btrading-code\.vps-daily-analysis.env",
  [string]$TaskName = "BTrading Telegram Market Alerts"
)

$ErrorActionPreference = "Stop"

if ([TimeZoneInfo]::Local.Id -ne "SE Asia Standard Time") {
  throw "VPS timezone must be SE Asia Standard Time before installing Telegram alerts."
}

$runner = Join-Path $RepositoryPath "scripts\vps\run-telegram-market-alerts.ps1"
if (-not (Test-Path -LiteralPath $runner)) { throw "Runner not found: $runner" }
if (-not (Test-Path -LiteralPath $ConfigPath)) { throw "Config not found: $ConfigPath" }

$secretFound = $false
foreach ($line in Get-Content -LiteralPath $ConfigPath) {
  if ($line -match '^DAILY_AUTOMATION_SECRET=(.+)$' -and $matches[1].Trim()) {
    $secretFound = $true
    break
  }
}
if (-not $secretFound) { throw "DAILY_AUTOMATION_SECRET is missing from the VPS config." }

$now = Get-Date
$minutesToNextQuarter = 15 - ($now.Minute % 15)
$firstRun = $now.AddMinutes($minutesToNextQuarter).AddSeconds(-$now.Second).AddMilliseconds(-$now.Millisecond)
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -ConfigPath `"$ConfigPath`""
$trigger = New-ScheduledTaskTrigger -Once -At $firstRun -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration (New-TimeSpan -Days 3650)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Checks BTrading Telegram gold/news lanes every 15 minutes; gold publishes at most once per Asia/Ho_Chi_Minh hour when the live quote is fresh." -Force | Out-Null
$info = Get-ScheduledTaskInfo -TaskName $TaskName
[PSCustomObject]@{
  TaskName = $TaskName
  State = (Get-ScheduledTask -TaskName $TaskName).State
  TimezoneId = [TimeZoneInfo]::Local.Id
  NextRunTime = $info.NextRunTime
}
