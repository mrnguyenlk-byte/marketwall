# Independent BTrading morning flows

The two flows intentionally share the validated VNINDEX and XAUUSD source data, but they do not share a Scheduled Task, local mutex, success marker, log, or publishing API.

| Flow | Time | Runner/API | Log |
| --- | --- | --- | --- |
| Original | 07:00 weekdays | Existing `Btrading Daily Analysis` task | `C:\BTradingData\logs\daily-analysis-runner.log` |
| Command Center | 07:30 weekdays | `run-command-center-briefing.ps1` → `/api/briefings/auto-publish` | `C:\BTradingData\logs\command-center-briefing.log` |

All times above are **Asia/Ho_Chi_Minh (UTC+7)**. Windows must report the
timezone ID `SE Asia Standard Time`; the 07:30 installer fails closed when it
does not. The Task Scheduler trigger is created at exactly `07:30:00` local
time, equivalent to `00:30 UTC`. There is no separate UTC cron for this flow.

Both flows validate the latest CSV candle dates before publishing. A failure in the 07:30 flow cannot stop, retry, modify or mark the 07:00 flow. The Command Center keeps its own per-date idempotency, and the VPS writes a separate confirmation marker under `C:\BTradingData\command-center`.

Telegram and Facebook destinations are currently the same because they remain configured in each application's own environment. To split audiences later, change only the destination credentials for the selected flow; no schedule or chart-data logic needs to change.

Install only the independent 07:30 task after the Command Center endpoint is reachable from the VPS:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\install-command-center-briefing-task.ps1
```

The installer never changes the existing 07:00 task. It also refuses to create
the 07:30 task when the VPS timezone is not Vietnam time. Validate without publishing:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\run-command-center-briefing.ps1 -DryRun
```
