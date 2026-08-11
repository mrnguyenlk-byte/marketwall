# BTrading Telegram news scheduler

This Cloudflare Worker is the only scheduler for the Telegram market-news flow.
It runs every minute and calls the authenticated BTrading API. Content
selection, translation, publication gates, Telegram delivery and R2
idempotency remain in the BTrading application.

Required Cloudflare secret (never commit its value):

```text
BTRADING_AUTOMATION_SECRET
```

Deploy from the repository root:

```powershell
npx wrangler deploy --config cloudflare/telegram-news-scheduler/wrangler.jsonc
```

The public Worker only exposes `GET /health`; it cannot manually trigger a
publication. Inspect executions in Cloudflare Workers Logs. A successful run
contains `event=completed`; skipped publication gates are normal and are
reported in `skippedReasons`.
