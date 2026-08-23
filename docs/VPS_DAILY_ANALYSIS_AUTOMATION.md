# Daily Analysis automation on the Windows VPS

This automation publishes the Daily Analysis at 07:00. Gold capture at 06:00/06:32 and VNINDEX capture at 06:30 remain capture-only inputs. The runner does not inspect, disable, or otherwise modify unrelated Scheduled Tasks or legacy programs.

## 1. VPS prerequisites

On the VPS, keep the repository at `C:\btrading-code` (already cloned with its deploy key) and install a supported Node.js LTS only if other repository tooling needs it. The runner itself uses built-in Windows PowerShell 5.1 and does not need Node.js packages.

Create a private config file, which Git ignores:

```powershell
Copy-Item C:\btrading-code\scripts\vps\daily-analysis.env.example C:\btrading-code\.vps-daily-analysis.env
notepad C:\btrading-code\.vps-daily-analysis.env
```

Set `DAILY_AUTOMATION_SECRET` to the exact secret configured as `DAILY_AUTOMATION_SECRET` in the BTrading production environment. Do not commit this file.

Open the VN-Index and XAUUSD charts in the AmiBroker application. The runner enumerates the application's **child windows** with `EnumChildWindows`, then captures them directly with Win32 `PrintWindow`. Set `VNINDEX_WINDOW_TITLE` and `GOLD_WINDOW_TITLE` to the complete, exact title displayed by AmiBroker (not a symbol fragment). It rejects a missing or duplicate match before any upload.

- `C:\BTradingData\daily-analysis\vnindex.png`
- `C:\BTradingData\daily-analysis\gold.png`

The scheduled task must use **Run only when user is logged on** and the VPS display must remain unlocked; Windows cannot safely capture a desktop from a non-interactive session. If your paths differ, change the two image paths in the private config.

## 2. First validation

Pull the committed runner and run its safe default test. It captures and validates PNG files but never contacts production or publishes:

```powershell
Set-Location C:\btrading-code
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\vps\run-daily-analysis.ps1 -ConfigPath C:\btrading-code\.vps-daily-analysis.env -Force
```

The command must finish with `DRY_RUN_OK`. Only the scheduled task adds `-Publish`; this legacy switch now means **upload the two verified charts to R2 only**. It never creates a web article or sends Telegram/Facebook posts. The relay uses `marketwall.vercel.app` instead of the public website domain, so rebuilding `btrading.org` cannot break it. A missing, ambiguous, stale, nearly black, or visually uniform/empty PNG deliberately fails before any production request. Every execution writes `START`, `DRY_RUN_OK`/`CHART_UPLOAD_CONFIRMED`/`FAILED`, and `END exitCode=…` to `C:\BTradingData\logs\daily-analysis-runner.log`. Command Center consumes `daily-analysis/charts/latest.json` (and the date manifest) after the relay succeeds.

Before capture, the runner reads the latest `Date` value directly from `VNINDEX_CSV_PATH` and `GOLD_CSV_PATH`. Both must equal the latest completed weekday before the report date (Friday for a Monday report). A missing, invalid or mismatched CSV logs `SESSION_BLOCKED`/`FAILED` and exits before creating an HTTP client. The same two dates are included in the upload, and the website validates them again before any image is written to R2.

## 3. Task Scheduler registration

Lịch chuẩn gồm kiểm tra kín lúc 06:45 và xuất bản lúc 07:00 (giờ Việt Nam):

- `BTrading Morning Readiness` kiểm tra ngày nến, CSV, cửa sổ AmiBroker, độ mới và chất lượng hai ảnh; kết quả chỉ được lưu vào health JSON/log và endpoint trạng thái, không đăng Telegram/Facebook.
- `BTrading Daily Analysis` xác minh lại toàn bộ điều kiện lúc 07:00 rồi mới xuất bản; dữ liệu sai hoặc thiếu ngày bị chặn trước mọi upload và bài đăng.

Run this once in an elevated PowerShell session. The task runs at 07:00 Vietnam time on weekdays. It creates both PNGs, validates them, then sends one authenticated request.

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\run-daily-analysis.ps1 -ConfigPath C:\btrading-code\.vps-daily-analysis.env -Publish"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 7:00AM
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
Register-ScheduledTask -TaskName "BTrading Daily Analysis" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Uploads AmiBroker charts and runs BTrading Daily Analysis" -Force
```

Use an account that can access both the export folder and the network. Keep that account signed in with AmiBroker open; disconnecting RDP is fine, but do not sign out because Windows then has no AmiBroker desktop to capture.

```powershell
Start-ScheduledTask -TaskName "BTrading Daily Analysis"
Get-ScheduledTaskInfo -TaskName "BTrading Daily Analysis"
```

## 4. Updating after a GitHub change

The deploy key lets this VPS pull updates without a password. Before changing the scheduler or when updating the runner, use:

```powershell
Set-Location C:\btrading-code
git pull --ff-only origin main
```

For automatic code updates, register a separate lightweight scheduled task. The provided updater refuses to overwrite any local VPS changes and only performs a fast-forward merge:

```powershell
$updateAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\update-runner.ps1"
$updateTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 6:40AM
$updateSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName "BTrading Automation Update" -Action $updateAction -Trigger $updateTrigger -Settings $updateSettings -Description "Fast-forward update of the BTrading VPS automation runner" -Force
```

This runs before the publishing task. Keep it separate: a failed code update must not prevent a known-good publishing task from completing.

## Moving to another VPS

Keep application code in Git and keep only `.vps-daily-analysis.env` outside Git. On a replacement VPS:

1. Install Git, Python/MT5/AmiBroker and clone the repository to `C:\btrading-code`.
2. Copy only `.vps-daily-analysis.env` and the existing AmiBroker/MT5 data configuration.
3. Run the idempotent installer once as Administrator:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\install-btrading-vps.ps1
```

The installer creates the 06:40 updater and 07:00 publisher and runs a read-only health check. It never publishes during installation. The health result is stored at `C:\BTradingData\logs\daily-analysis-health.json`; the persistent runner log is `C:\BTradingData\logs\daily-analysis-runner.log` and rotates at 5 MB.

## Failure behavior

- Missing or stale chart: the run fails before any HTTP request.
- API/network failure: Task Scheduler records a failure; retry only after confirming the images and production endpoint.
- Duplicate trigger: the local mutex prevents overlap, and the API prevents duplicate publication for the same date.
- Weekend: the runner exits successfully without doing anything unless launched with `-Force`.
