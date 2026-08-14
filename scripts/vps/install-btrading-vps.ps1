[CmdletBinding()]
param(
  [string]$RepositoryPath = "C:\btrading-code",
  [string]$ConfigPath = "C:\btrading-code\.vps-daily-analysis.env",
  [string]$PublishTaskName = "BTrading Daily Analysis",
  [string]$UpdateTaskName = "BTrading Automation Update",
  [string]$ReadinessTaskName = "BTrading Morning Readiness"
)

$ErrorActionPreference = "Stop"

$runner = Join-Path $RepositoryPath "scripts\vps\run-daily-analysis.ps1"
$updater = Join-Path $RepositoryPath "scripts\vps\update-runner.ps1"
$health = Join-Path $RepositoryPath "scripts\vps\test-btrading-vps-health.ps1"
$readinessInstaller = Join-Path $RepositoryPath "scripts\vps\install-morning-readiness-task.ps1"
foreach ($path in @($runner, $updater, $health, $readinessInstaller, $ConfigPath)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Required file was not found: $path" }
}

$dataDirectory = "C:\BTradingData\daily-analysis"
$logDirectory = "C:\BTradingData\logs"
New-Item -ItemType Directory -Path $dataDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$powerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$publishArguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $runner + '" -ConfigPath "' + $ConfigPath + '" -Publish'
$publishAction = New-ScheduledTaskAction -Execute $powerShell -Argument $publishArguments
$publishTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 7:00AM
$publishSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew -StartWhenAvailable
$publishPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest

$updateArguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $updater + '" -RepositoryPath "' + $RepositoryPath + '" -Branch main'
$updateAction = New-ScheduledTaskAction -Execute $powerShell -Argument $updateArguments
$updateTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 6:40AM
$updateSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew -StartWhenAvailable
$updatePrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest

Register-ScheduledTask -TaskName $UpdateTaskName -Action $updateAction -Trigger $updateTrigger -Settings $updateSettings -Principal $updatePrincipal -Description "Fast-forward BTrading VPS automation code at 06:40." -Force | Out-Null
Register-ScheduledTask -TaskName $PublishTaskName -Action $publishAction -Trigger $publishTrigger -Settings $publishSettings -Principal $publishPrincipal -Description "Validate candle dates, capture charts and publish at 07:00. Invalid dates never reach the API." -Force | Out-Null
& $readinessInstaller -RepositoryPath $RepositoryPath -ConfigPath $ConfigPath -TaskName $ReadinessTaskName

& $health -ConfigPath $ConfigPath -PublishTaskName $PublishTaskName -UpdateTaskName $UpdateTaskName -ReadinessTaskName $ReadinessTaskName
if ($LASTEXITCODE -ne 0) { throw "VPS health check failed after task installation." }

Get-ScheduledTask -TaskName $UpdateTaskName,$ReadinessTaskName,$PublishTaskName | Select-Object TaskName,State

