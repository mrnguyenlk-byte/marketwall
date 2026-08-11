# BTrading production architecture — source of truth

Last verified from repository code: 2026-08-11. This file is the canonical map
for operations. Do not infer a running workflow from the presence of an API or
script: a workflow is **active** only after its trigger, credentials, last run
and destination have all been verified.

## Production workflows

| Workflow | Source | Trigger/runtime | Destination | Idempotency/state | Operational log |
| --- | --- | --- | --- | --- | --- |
| Website and Dashboard | Next.js repository `marketwall` | Vercel deployment from GitHub `main` | `https://btrading.org` | Application/R2 caches | Vercel runtime/build logs |
| Proprietary EOD sync | Market data providers used by `/api/sync/proprietary-eod` | Vercel Cron, `10:30 UTC` weekdays (`17:30` Vietnam) | Dashboard/R2 | Provider sync state | Vercel runtime logs |
| Morning analysis 07:00 | MT5 + AmiBroker CSV and chart windows on VPS | Windows task `Btrading Daily Analysis`, `07:00` Vietnam weekdays | BTrading article plus the destinations implemented by `/api/automation/daily-analysis/run` | R2 daily run lock and article date | `C:\BTradingData\logs\daily-analysis-runner.log` plus R2/Vercel logs |
| Command Center 07:30 | The same validated chart inputs, read independently | Windows task `BTrading Command Center Briefing 0730`, `07:30` Vietnam weekdays | Command Center configured Telegram/Facebook destinations | Namespace `command-center-0730` and independent VPS marker | `C:\BTradingData\logs\command-center-briefing.log` plus Command Center logs |
| Telegram market news | Calendar, RSS, Gold quote and OpenAI editorial gate in BTrading | Cloudflare Worker `btrading-telegram-news-scheduler`, every 15 minutes | Telegram market-news channel | R2 claim per event and per Gold hour | Cloudflare Workers Logs plus endpoint result/reasons |

## Hard boundaries

- VPS is required only where Windows desktop applications are the data source:
  MT5, AmiBroker, chart capture, and the two chart-based morning flows.
- Telegram market news must not use Windows Task Scheduler, RDP state, MT5,
  AmiBroker, or any VPS file.
- The 07:00 and 07:30 morning flows may read the same validated charts, but
  their task, API, lock, success marker and log are independent.
- Chart-based publication fails closed when VNINDEX or Gold candle dates do not
  match the expected completed trading session.
- Secrets live only in Vercel, Cloudflare or the VPS-local ignored env file.
  Secret values must never appear in Git, documentation, command output or logs.

## Required verification before reporting “active”

1. Source code and production deployment are the intended commit.
2. The scheduler/trigger exists, is enabled and has the correct timezone.
3. Required credentials exist in the runtime secret store.
4. The destination identifier belongs to the intended channel/page.
5. Idempotency and freshness gates are enabled.
6. A real scheduled execution has a successful log entry.
7. The destination shows the expected result, or the log gives a valid
   publication-gate reason for intentionally publishing nothing.

## Recovery and migration

- Website: connect the GitHub repository to a new Vercel project and restore
  the documented environment variables/R2 credentials.
- Telegram news: deploy `cloudflare/telegram-news-scheduler` and set its single
  secret. No VPS migration is involved.
- Chart automation: clone the repository to a replacement Windows VPS, restore
  MT5/AmiBroker data paths and the ignored `.vps-daily-analysis.env`, then use
  the installers in `scripts/vps`. Validate both flows in dry-run mode before
  enabling publication.

If an obsolete VPS news task was ever installed, remove only that task:

```powershell
Unregister-ScheduledTask -TaskName "BTrading Telegram Market Alerts" -Confirm:$false
```
