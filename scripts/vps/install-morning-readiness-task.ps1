[CmdletBinding()]
param(
  [string]$RepositoryPath = "C:\btrading-code",
  [string]$ConfigPath = "C:\btrading-code\.vps-daily-analysis.env",
  [string]$TaskName = "BTrading Morning Readiness"
)

$ErrorActionPreference = "Stop"
$runner = Join-Path $RepositoryPath "scripts\vps\run-daily-analysis.ps1"
foreach ($path in @($runner, $ConfigPath)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Required file was not found: $path" }
}

$powerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $runner + '" -ConfigPath "' + $ConfigPath + '" -ReadinessCheck'
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 6:45AM
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew -StartWhenAvailable
# Use the same desktop session as the 07:00 publisher so readiness can verify
# the actual AmiBroker windows, rather than reporting a false ready state.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Private 06:45 market-data and chart readiness check. Never publishes to Telegram or Facebook." -Force | Out-Null
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName,State
