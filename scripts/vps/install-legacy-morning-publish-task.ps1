[CmdletBinding()]
param(
  [string]$TaskName = "BTrading Legacy Morning Publish",
  [string]$RunnerPath = "C:\btrading-code\scripts\vps\run-legacy-morning-publish.ps1"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $RunnerPath -PathType Leaf)) {
  throw "Legacy wrapper was not found: $RunnerPath"
}

$powerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $RunnerPath + '"'
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 7:00AM
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Runs the original BTrading publisher only after VNINDEX and XAUUSD logs confirm the expected closed session." -Force | Out-Null
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
