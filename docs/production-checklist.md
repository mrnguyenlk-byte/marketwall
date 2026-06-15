# Production checklist — BTrading Market Insights

Use before every production deploy to https://btrading.org.

## Pre-deploy

- [ ] `npm run build` completes with zero errors
- [ ] `npm run lint` passes (or only pre-existing warnings documented)
- [ ] Feature flags in `lib/config/features.ts` match release intent
- [ ] No secrets in git (`.env.local` not committed)
- [ ] Sitemap excludes unstable routes (`dynamicMarketPages` flag)

## Feature flag defaults (production beta)

```ts
symbolModal: false
watchlist: false
liveClientFetch: true
currencyStrength: false
dynamicMarketPages: false
```

## Build verification

```bash
npm run build
npm run start
```

Expected routes:

- `/` — dashboard loads, no client crash
- `/brokers` — platforms page
- `/contact` — contact page
- `/legal/terms` (+ 6 other legal slugs)
- `/markets/vnindex` — **404** (while dynamic pages disabled)
- `/platforms` — redirects to `/brokers`

## Runtime smoke tests

### Homepage (`/`)

- [ ] Header shows: Dashboard, Platforms, Contact
- [ ] Ticker bar scrolls with mock/ live data
- [ ] Sidebar: two banners + market overview (no watchlist)
- [ ] Main: Fear & Greed, Heatmap, Calendar, News, Top Platforms, Risk footer
- [ ] No currency strength section
- [ ] Clicking ticker/heatmap/overview symbols does nothing (modal off)
- [ ] Theme toggle works without hydration flash
- [ ] Language switch EN/VI works on banners and sections

### API health

```bash
curl -s http://localhost:3000/api/health | jq .
```

- [ ] Returns JSON with `status: "ok"`
- [ ] Each service reports `source` and `fallback` (mock fallback acceptable)

### API failure resilience

Stop external network or block API keys temporarily:

- [ ] Homepage still renders (SSR fallbacks)
- [ ] Calendar and news show mock items
- [ ] No uncaught client errors in browser console

### SEO

- [ ] `GET /robots.txt` — allows indexing
- [ ] `GET /sitemap.xml` — no `/markets/*` entries
- [ ] Canonical URLs use `https://btrading.org`

## Browser console

- [ ] No React hydration mismatch errors
- [ ] No uncaught exceptions after 30s on homepage
- [ ] No repeated failed fetch loops (SWR retries capped at 2)

## Brand & copy

- [ ] Site name: BTrading Market Insights
- [ ] Avoid: Forex, trading signals, buy/sell signal, guaranteed profit, risk free, safe investment
- [ ] Use: market data, insights, intelligence, platform comparison, overview, heatmap

## Post-deploy

- [ ] Verify production URL loads homepage
- [ ] Spot-check `/api/health` on production
- [ ] Confirm Vercel/hosting analytics if enabled
- [ ] Monitor error reporting for 24h

## Re-enabling features

See `docs/re-enable-client-features.md` for staged rollout:

1. `liveClientFetch` (already on)
2. `symbolModal` + test modal on all breakpoints
3. `watchlist` + localStorage hydration test
4. `dynamicMarketPages` + sitemap update
5. `currencyStrength` only after reliable data source

## Rollback

Set all feature flags to `false`, redeploy. Homepage must remain usable with SSR mocks only.
