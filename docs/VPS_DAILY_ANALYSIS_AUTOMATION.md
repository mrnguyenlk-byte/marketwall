# Daily Analysis automation on the Windows VPS

This automation has one publisher: `BTrading Daily Analysis` at 07:00. At the start of every run it finds any Windows scheduled task whose action invokes `C:\btrading\capture_and_publish.py`, disables it, and refuses to publish if that legacy task cannot be disabled or verified. Gold capture at 06:00/06:32 and VNINDEX capture at 06:30 remain capture-only inputs.

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

The command must finish with `DRY_RUN_OK`. Only the scheduled task adds `-Publish`. A missing, ambiguous, stale, nearly black, or visually uniform/empty PNG deliberately fails before any production request; the same quality gate runs during a publish. Every execution writes `START`, `DRY_RUN_OK`/`PUBLISH_CONFIRMED`/`FAILED`, and `END exitCode=…` to `C:\btrading-code\logs\daily-analysis-runner.log`.

## 3. Task Scheduler registration

Run this once in an elevated PowerShell session. The task runs at 07:00 Vietnam time on weekdays. It creates both PNGs, validates them, then sends one authenticated request.

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\run-daily-analysis.ps1 -ConfigPath C:\btrading-code\.vps-daily-analysis.env -Publish"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 7:00AM
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName "BTrading Daily Analysis" -Action $action -Trigger $trigger -Settings $settings -Description "Uploads AmiBroker charts and runs BTrading Daily Analysis" -Force
```

Use an account that can disable scheduled tasks and access both the export folder and the network. The runner handles the legacy publisher itself; do not separately schedule `capture_and_publish.py`.

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

## Failure behavior

- Missing or stale chart: the run fails before any HTTP request.
- API/network failure: Task Scheduler records a failure; retry only after confirming the images and production endpoint.
- Duplicate trigger: the local mutex prevents overlap, and the API prevents duplicate publication for the same date.
- Weekend: the runner exits successfully without doing anything unless launched with `-Force`.
