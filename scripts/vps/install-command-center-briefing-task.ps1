[CmdletBinding()]
param(
  [string]$TaskName = "BTrading Command Center Briefing 0730",
  [string]$RunnerPath = "C:\btrading-code\scripts\vps\run-command-center-briefing.ps1",
  [string]$ConfigPath = "C:\btrading-code\.vps-daily-analysis.env"
)

$ErrorActionPreference = "Stop"
foreach ($path in @($RunnerPath, $ConfigPath)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Required file was not found: $path" }
}
$expectedTimezoneId = "SE Asia Standard Time"
$currentTimezoneId = [TimeZoneInfo]::Local.Id
if ($currentTimezoneId -ne $expectedTimezoneId) {
  throw "Refusing to install 07:30 task: Windows timezone is '$currentTimezoneId', expected '$expectedTimezoneId' (Asia/Ho_Chi_Minh, UTC+7)."
}
$powerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $RunnerPath + '" -ConfigPath "' + $ConfigPath + '"'
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments
$triggerTime = [DateTime]::Today.AddHours(7).AddMinutes(30)
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At $triggerTime
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Independent 07:30 Asia/Ho_Chi_Minh Command Center briefing (00:30 UTC). Does not modify the 07:00 publisher." -Force | Out-Null
$taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName,State,@{Name="TimezoneId";Expression={$currentTimezoneId}},@{Name="NextRunTime";Expression={$taskInfo.NextRunTime}}
