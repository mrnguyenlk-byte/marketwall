# Daily Analysis automation on the Windows VPS

This automation runs on the Windows VPS, posts the two current AmiBroker PNG exports to BTrading, and lets the server generate and publish the daily analysis. The API is idempotent: a second run for the same Vietnam date returns `already_processed` and does not publish again.

## 1. VPS prerequisites

On the VPS, keep the repository at `C:\btrading-code` (already cloned with its deploy key) and install a supported Node.js LTS only if other repository tooling needs it. The runner itself uses built-in Windows PowerShell 5.1 and does not need Node.js packages.

Create a private config file, which Git ignores:

```powershell
Copy-Item C:\btrading-code\scripts\vps\daily-analysis.env.example C:\btrading-code\.vps-daily-analysis.env
notepad C:\btrading-code\.vps-daily-analysis.env
```

Set `DAILY_AUTOMATION_SECRET` to the exact secret configured as `DAILY_AUTOMATION_SECRET` in the BTrading production environment. Do not commit this file.

Configure the AmiBroker-side export to write a fresh PNG for each chart before the scheduled task starts:

- `C:\BTradingData\daily-analysis\vnindex.png`
- `C:\BTradingData\daily-analysis\gold.png`

If your export paths differ, change only `VNINDEX_IMAGE_PATH` and `GOLD_IMAGE_PATH` in the private config.

## 2. First validation

Pull the committed runner and test it after the two images have been exported:

```powershell
Set-Location C:\btrading-code
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\vps\run-daily-analysis.ps1 -Force
```

The response must contain either `"success":true` or `"status":"already_processed"`. A stale/missing image deliberately causes a non-zero failure and no article is published.

## 3. Task Scheduler registration

Run this once in an elevated PowerShell session. The task runs at 17:45 Vietnam time on weekdays, after AmiBroker has exported both charts. Change the time if the data feed completes later.

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\run-daily-analysis.ps1"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 5:45PM
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName "BTrading Daily Analysis" -Action $action -Trigger $trigger -Settings $settings -Description "Uploads AmiBroker charts and runs BTrading Daily Analysis" -Force
```

Use an account that has access to both the export folder and the network. Verify it with:

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
$updateTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 5:25PM
$updateSettings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName "BTrading Automation Update" -Action $updateAction -Trigger $updateTrigger -Settings $updateSettings -Description "Fast-forward update of the BTrading VPS automation runner" -Force
```

This runs before the publishing task. Keep it separate: a failed code update must not prevent a known-good publishing task from completing.

## Failure behavior

- Missing or stale chart: the run fails before any HTTP request.
- API/network failure: Task Scheduler records a failure; retry only after confirming the images and production endpoint.
- Duplicate trigger: the local mutex prevents overlap, and the API prevents duplicate publication for the same date.
- Weekend: the runner exits successfully without doing anything unless launched with `-Force`.
