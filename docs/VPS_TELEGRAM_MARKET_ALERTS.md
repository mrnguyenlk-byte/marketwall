# BTrading Telegram market alerts

This monitor is independent from the 07:00 Website briefing and the 07:30
Command Center briefing. A failure here cannot stop either morning flow.

## Schedule

- Windows Task: `BTrading Telegram Market Alerts`
- Poll interval: every 15 minutes, `Asia/Ho_Chi_Minh`
- Gold update: at most once per local hour, including the US session after
  midnight Vietnam time, only when the Yahoo Finance `GC=F` quote is live and
  no older than 45 minutes. Closed/stale markets are skipped.
- Economic/news/Trump items: event-driven; only new, high-impact items pass
- Log: `C:\BTradingData\logs\telegram-market-alerts.log`

The task calls `GET https://btrading.org/api/cron/telegram-market-alerts` and
reuses the existing `DAILY_AUTOMATION_SECRET`. No new VPS secret is required.

## Editorial gates

- Economic releases cover the US, Euro area/Germany, UK, Japan, China, Canada,
  Australia, New Zealand and Switzerland. Published releases require impact
  `high`, Actual and Previous; Forecast is required except valid rate decisions.
- Trump monitoring uses the public Trump’s Truth archive. Only posts containing
  market-relevant topics enter AI review. The Telegram text explicitly treats
  the content as a statement by Trump, not independently verified fact.
- International reports use Tier-1 financial feeds. Sensitive conflict,
  casualty, sanctions or invasion headlines require a second independent
  Tier-1 source with a matching event before they can enter AI review.
- R2 claims every event before sending to Telegram. Retries and concurrent runs
  therefore cannot publish the same event or hourly gold slot twice.

## Portable installation

The normal 06:40 repository updater installs or repairs this task automatically.
For a new VPS, copy the repository and the VPS-local `.vps-daily-analysis.env`,
set Windows timezone to `SE Asia Standard Time`, then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\btrading-code\scripts\vps\install-telegram-market-alerts-task.ps1
```

The installer fails closed if the timezone or existing automation secret is
missing. This keeps migration to another VPS deterministic.

## Health check

```powershell
Get-ScheduledTaskInfo -TaskName "BTrading Telegram Market Alerts" | Format-List LastRunTime,LastTaskResult,NextRunTime
Get-Content C:\BTradingData\logs\telegram-market-alerts.log -Tail 30
```

`SUCCESS` can legitimately contain a `skipped` response: it means the endpoint
was healthy but no item passed the publication gates. Network/HTTP 5xx failures
are retried twice; HTTP 4xx configuration failures are logged without retry.
