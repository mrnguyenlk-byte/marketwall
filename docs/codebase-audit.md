# Codebase audit — BTrading Market Insights

Audit date: 2026-06-15  
Branch focus: production beta stability  
Site: https://btrading.org

## Executive summary

The app is a Next.js 16 dashboard with a **server-rendered homepage** and **optional client SWR overlays**. Unstable features (symbol modal, watchlist, currency strength, dynamic market pages) are **disabled via `lib/config/features.ts`**. The homepage renders from SSR mock/live data with per-section error boundaries so one widget failure cannot crash the full page.

Prior stability work: server/client decoupling (`88719ef`, `e1a71df`, `4b35f52`), server-only guards, lazy modal, `/api/health`.

---

## Site structure (kept)

| Route | Status | Notes |
|-------|--------|-------|
| `/` | Stable | Dashboard — SSR + optional client fetch |
| `/brokers` | Stable | Platforms comparison (nav label: Platforms) |
| `/contact` | Stable | Contact form |
| `/legal/*` | Stable | 7 pages: terms, privacy, cookies, risk-disclosure, disclaimer, partner-disclosure |
| `/platforms` | Redirect | 301 → `/brokers` (`next.config.mjs`) |
| `/markets/[symbol]` | **Disabled** | Gated by `features.dynamicMarketPages=false`; excluded from sitemap |

---

## Feature flags (`lib/config/features.ts`)

| Flag | Value | Effect |
|------|-------|--------|
| `symbolModal` | `false` | No modal, noop symbol context, non-interactive ticker/heatmap/overview |
| `watchlist` | `false` | Sidebar watchlist hidden |
| `liveClientFetch` | `true` | SWR refresh via `/api/*`; falls back to SSR props on error |
| `currencyStrength` | `false` | Section hidden (uses static mock + lightweight-charts when enabled) |
| `dynamicMarketPages` | `false` | `/markets/*` returns 404; omitted from sitemap |

Dashboard must work with **all flags false** except SSR.

---

## Architecture

```
app/page.tsx (RSC)
  └─ buildDashboardData() → providers (server-only)
  └─ Client widgets: TickerBar, Sidebar/MarketOverview, Heatmap, Calendar, News
       └─ SWR → /api/crypto, /api/global-markets, /api/vietnam-markets, /api/news, /api/calendar
```

**Provider contract:** all providers return `ProviderResult<T>` with `source`, `fallback`, `error?`, `updatedAt`. Errors are caught; API routes always return JSON.

---

## Audit findings

### PASS — no client → server provider imports

Client components use `/api/*` and typed mocks only. `lib/market-data.ts` is `server-only` and not imported by client code.

### PASS — hydration rules

- Theme: `useSyncExternalStore` + inline pre-hydration script
- Watchlist store: disabled via feature flag; when enabled uses Zustand persist
- Sparklines: deterministic `spark()` from symbol seed
- No `Math.random` / `Date.now` in render paths

### FIXED — homepage crash vectors

1. **CurrencyStrength always rendered** — now gated by `features.currencyStrength`
2. **Symbol click handlers** — disabled when `symbolModal=false` (ticker, heatmap, overview)
3. **SymbolDetailProvider** — noop context when modal disabled
4. **Section error boundaries** — ticker, fear/greed, heatmap, calendar, news, brokers on homepage
5. **Sitemap** — `/markets/*` removed while unstable

### LOW RISK — duplicate / legacy files

| Path | Recommendation |
|------|----------------|
| `components/marketwall/watchlist-preview.tsx` | Deprecated alias of `watchlist.tsx`; keep until watchlist re-enabled |
| `components/marketwall/top-movers.tsx`, `market-breadth.tsx`, `currency-performance.tsx` | Not on dashboard; safe to remove in future cleanup |
| `lib/currency-strength/*` | Engine unused while flag off; mock-only path when re-enabled |
| `app/platforms/page.tsx` | Redundant with redirect; kept for direct static build |
| `scripts/capture-page-errors*.mjs` | Dev diagnostics; untracked |

### DATA sources

| Domain | Primary | Fallback |
|--------|---------|----------|
| Crypto | CoinGecko | Mock |
| Global | Yahoo | Mock |
| Vietnam | Rich mock + adapters | Mock |
| News | rss-parser | Mock |
| Calendar | Free economic API | Mock |
| Currency strength | Hidden | Static mock only |

---

## Header nav

Only: **Dashboard**, **Platforms** (`/brokers`), **Contact**. Markets, News, Events, Watchlist, Alerts removed.

---

## Banner copy (sidebar)

| Banner | Link | EN headline |
|--------|------|-------------|
| 1 | `/brokers` | Market Intelligence Starts Here |
| 2 | `/contact` | Partner With BTrading |

Images: `/ads/trade-smarter.png`, `/ads/pro-broker.png` with CSS gradient fallback.

---

## SEO

Sitemap at `https://btrading.org/sitemap.xml` lists only stable HTTP 200 routes. No `/markets/*` while `dynamicMarketPages=false`.

---

## Recommended next steps (post-beta)

1. Re-enable `dynamicMarketPages` after symbol detail pages are tested end-to-end
2. Re-enable `symbolModal` with shadcn Dialog + lazy chart
3. Re-enable `watchlist` with Zustand hydration guard
4. Wire reliable FX feed before `currencyStrength=true`
5. Add `public/ads/*` and `public/brand/*` assets for production CDN

See `docs/production-checklist.md` for release verification.
