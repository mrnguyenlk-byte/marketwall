[CmdletBinding()]
param(
  [string]$ConfigPath = "C:\btrading-code\.vps-daily-analysis.env",
  [string]$PublishTaskName = "BTrading Daily Analysis",
  [string]$UpdateTaskName = "BTrading Automation Update",
  [string]$ReadinessTaskName = "BTrading Morning Readiness"
)

$ErrorActionPreference = "Stop"
$failures = New-Object 'System.Collections.Generic.List[string]'

function Read-Config([string]$Path) {
  $values = @{}
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $values }
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $parts = $trimmed.Split("=", 2)
    if ($parts.Count -eq 2) { $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"') }
  }
  return $values
}

if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) { [void]$failures.Add("Missing config: $ConfigPath") }
$config = Read-Config $ConfigPath
foreach ($name in @("DAILY_ANALYSIS_ENDPOINT", "DAILY_AUTOMATION_SECRET", "VNINDEX_IMAGE_PATH", "GOLD_IMAGE_PATH")) {
  if (-not $config.ContainsKey($name) -or -not $config[$name]) { [void]$failures.Add("Missing config value: $name") }
}
foreach ($name in @($PublishTaskName, $UpdateTaskName, $ReadinessTaskName)) {
  if (-not (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue)) { [void]$failures.Add("Missing task: $name") }
}
if (-not $config["VNINDEX_CSV_PATH"]) { $config["VNINDEX_CSV_PATH"] = "C:\AmiBroker_AutoData\VNINDEX_D1_AB.csv" }
if (-not $config["GOLD_CSV_PATH"]) { $config["GOLD_CSV_PATH"] = "C:\AmiBroker_AutoData\XAUUSD_D1_AB.csv" }
if (-not $config["LOG_PATH"]) { $config["LOG_PATH"] = "C:\BTradingData\logs\daily-analysis-runner.log" }
foreach ($name in @("VNINDEX_CSV_PATH", "GOLD_CSV_PATH")) {
  if (-not (Test-Path -LiteralPath $config[$name] -PathType Leaf)) { [void]$failures.Add("Missing source file: $($config[$name])") }
}

$result = @{
  checkedAt = (Get-Date).ToString("o")
  ok = ($failures.Count -eq 0)
  failures = @($failures)
  publishTask = $PublishTaskName
  updateTask = $UpdateTaskName
  readinessTask = $ReadinessTaskName
  logPath = $config["LOG_PATH"]
}
$healthPath = if ($config["HEALTH_PATH"]) { $config["HEALTH_PATH"] } else { "C:\BTradingData\logs\daily-analysis-health.json" }
$directory = Split-Path -Parent $healthPath
if ($directory) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
$result | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $healthPath -Encoding UTF8
$result | ConvertTo-Json -Depth 3
if ($failures.Count -gt 0) { exit 1 }
exit 0
