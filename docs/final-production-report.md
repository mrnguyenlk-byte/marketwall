# BTrading Market Insights — Production Beta Final Report

**Date:** 2026-06-15  
**Site:** https://btrading.org  
**Version:** 0.2.0-beta  
**Verdict:** **READY for Production Beta**

---

## Executive Summary

The homepage and all stable routes load without runtime crashes. Feature flags disable experimental UI. Data providers never throw — all API routes return JSON with `source`, `fallback`, and `updatedAt`. Production build (`npm run build`) completes successfully.

---

## Active Features

| Feature | Status | Notes |
|---------|--------|-------|
| Homepage dashboard | ✅ Active | SSR with full mock fallback |
| Header + navigation | ✅ Active | Dashboard, Platforms, Contact |
| Ticker bar | ✅ Active | Live overlay from Vietnam/global/crypto quotes |
| Market Overview (sidebar) | ✅ Active | Category tabs with sparklines |
| Fear & Greed | ✅ Active | Crypto value from CoinGecko |
| Vietnam Heatmap | ✅ Active | HOSE / HNX / UPCoM only (US/crypto tabs removed) |
| Economic Calendar | ✅ Active | Client fetch + SSR fallback |
| Breaking News | ✅ Active | RSS with mock fallback |
| Top Rated Platforms | ✅ Active | Static broker highlights |
| Banner 1 → `/brokers` | ✅ Active | `/banners/promo-trade-bg.png` + gradient fallback |
| Banner 2 → `/contact` | ✅ Active | `/banners/partner-platform-bg.png` + gradient fallback |
| Footer + legal links | ✅ Active | 6 legal pages |
| EN/VI language switch | ✅ Active | Banners and all sections |
| Section error boundaries | ✅ Active | Per-widget isolation |
| Zalo contact FAB | ✅ Active | External link, not a modal |
| `/platforms` redirect | ✅ Active | 308 → `/brokers` |

---

## Disabled Features (via `lib/config/features.ts`)

| Flag | Value | Effect |
|------|-------|--------|
| `symbolModal` | `false` | No symbol detail modal; heatmap tiles non-clickable |
| `watchlist` | `false` | Watchlist widget hidden from sidebar |
| `currencyStrength` | `false` | Currency strength section hidden |
| `dynamicMarketPages` | `false` | `/markets/[symbol]` returns 404; excluded from sitemap |
| `liveClientFetch` | `true` | Client SWR refresh enabled for calendar/news/heatmap |

**Also disabled (not feature-flagged):**
- US market heatmap tab
- Crypto heatmap tab
- FireAnt adapter (stub only; requires `FIREANT_API_KEY`)

---

## Stable Routes

| Route | Type | HTTP |
|-------|------|------|
| `/` | Dynamic (SSR) | 200 |
| `/brokers` | Static | 200 |
| `/contact` | Static | 200 |
| `/legal/terms` | SSG | 200 |
| `/legal/privacy` | SSG | 200 |
| `/legal/cookies` | SSG | 200 |
| `/legal/risk-disclosure` | SSG | 200 |
| `/legal/disclaimer` | SSG | 200 |
| `/legal/partner-disclosure` | SSG | 200 |
| `/platforms` | Redirect | 308 → `/brokers` |
| `/robots.txt` | Static | 200 |
| `/sitemap.xml` | Static | 200 |

**Excluded from sitemap:** `/markets/*`, `/platforms`, `/api/*`

---

## API Routes

All routes return JSON. Never throw — mock fallback on failure.

| Endpoint | Primary Source | Fallback |
|----------|----------------|----------|
| `/api/health` | Service probes | Always 200 with service status |
| `/api/crypto` | CoinGecko | Mock crypto assets + heatmap tiles |
| `/api/global-markets` | Yahoo Finance v8 | Mock global quotes |
| `/api/vietnam-markets` | Vietnam adapters (VietStock/TCBS) | Mock Vietnam indices + heatmap |
| `/api/news` | RSS feeds | Mock news items |
| `/api/calendar` | Fair Economy / Trading Economics | Mock calendar events |

**Response contract (all data APIs):**
```json
{
  "source": "live" | "mock",
  "fallback": boolean,
  "updatedAt": "ISO-8601",
  "...payload fields"
}
```

---

## Data Sources

| Domain | Provider | Used For |
|--------|----------|----------|
| Crypto | CoinGecko (`/coins/markets`) | Ticker, Fear&Greed crypto gauge, overview overlay |
| Global | Yahoo Finance v8 | Ticker, market overview overlay |
| Vietnam | VietStock / TCBS adapters | Vietnam heatmap, ticker VN indices |
| News | RSS (configurable feeds) | Breaking news section |
| Calendar | Fair Economy + Trading Economics chain | Economic calendar |
| Fear & Greed | Static base + CoinGecko-derived crypto | Fear & Greed widget |
| Brokers | Static `lib/broker-data.ts` | Platforms page + highlights |

---

## SEO

- **Canonical domain:** `https://btrading.org`
- **robots.txt:** Allows `/`, disallows `/api/`
- **sitemap.xml:** 9 stable URLs (home, brokers, contact, 6 legal)
- **OpenGraph / Twitter cards:** Configured in root layout

---

## Error Handling

1. **Homepage SSR:** `buildDashboardData()` wrapped in try/catch → full mock dashboard on failure
2. **Section boundaries:** Each widget isolated (`SectionErrorBoundary`)
3. **API routes:** try/catch → mock JSON response
4. **Providers:** `withFallback` / `chainProviders` — never throw upstream errors to UI
5. **Client SWR:** Disabled when `liveClientFetch: false`; error retry capped at 2

---

## Known Limitations

1. **Vietnam live data** depends on adapter availability; mock seeds used when adapters fail
2. **Yahoo global quotes** may rate-limit; mock quotes served as fallback
3. **Economic calendar** upstream APIs are unreliable; mock events common
4. **Heatmap timeframes (1D/7D/1M)** are UI-only — data is 1D change
5. **Search bar** in header is non-functional (placeholder)
6. **Login/Register** buttons are UI placeholders
7. **`/markets/[symbol]`** disabled — returns 404 until `dynamicMarketPages: true`
8. **Currency strength, watchlist, symbol modal** code retained but gated off

---

## Build Verification

```
npm run build  →  ✓ Compiled successfully
                 ✓ TypeScript passed
                 ✓ 14 static pages generated
```

**Local route verification (port 3010):**
- All 6 API routes → 200 JSON
- `/`, `/brokers`, `/contact` → 200
- `/robots.txt`, `/sitemap.xml` → 200
- `/platforms` → 308 redirect to `/brokers`

---

## Production Readiness Assessment

| Criterion | Status |
|-----------|--------|
| Homepage always loads | ✅ Pass |
| No hydration crashes | ✅ Pass |
| Feature flags gate experimental UI | ✅ Pass |
| APIs return JSON with fallbacks | ✅ Pass |
| SEO (robots + sitemap) | ✅ Pass |
| Production build clean | ✅ Pass |
| Banners use `/banners/` paths | ✅ Pass |
| Vietnam-only heatmap for stability | ✅ Pass |

### **Verdict: APPROVED for Production Beta**

Deploy to Vercel/production with `NEXT_PUBLIC_SITE_URL=https://btrading.org`. Monitor `/api/health` for upstream service degradation.

---

## Re-enabling Features (post-beta)

See `docs/re-enable-client-features.md` for flag changes to restore watchlist, symbol modal, currency strength, and dynamic market pages.
