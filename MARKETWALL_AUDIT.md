# MarketWall Project Inventory

**Audit date:** 2026-06-16  
**Repo:** `C:\Users\K2H\financial-market-dashboard`  
**Product:** BTrading Market Insights / MarketWall  
**Version:** 0.2.0-beta  
**Git HEAD:** `2a63b14e5e2465acfcbd6eaa863655b7d737a392` — *Sprint 1: Twelve Data market engine file structure*

> **Working tree note:** Sprint 2 broker module files (`lib/brokers/`, `/brokers/[slug]`, `/compare/[pair]`, broker APIs, `docs/PROJECT_SPEC.md`) are present on disk but **uncommitted** as of this audit.

---

## 1. Folder Tree (meaningful structure)

```
financial-market-dashboard/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard homepage (SSR)
│   ├── layout.tsx                # Root layout, providers, modals
│   ├── error.tsx, global-error.tsx
│   ├── globals.css, robots.ts, sitemap.ts
│   ├── brokers/
│   │   ├── page.tsx              # Platform listing
│   │   └── [slug]/page.tsx       # Broker detail (Sprint 2, uncommitted)
│   ├── compare/
│   │   └── [pair]/page.tsx       # Broker comparison slug-vs-slug (Sprint 2)
│   ├── contact/page.tsx
│   ├── legal/[slug]/page.tsx     # 6 legal pages (SSG)
│   ├── markets/[symbol]/page.tsx # Gated by feature flag → 404
│   ├── platforms/page.tsx        # Redirect → /brokers
│   └── api/                      # See §3
├── components/
│   ├── marketwall/               # Dashboard & site UI (30 files)
│   ├── heatmap/                  # FireAnt-style heatmap widgets (7 files)
│   └── ui/                       # Shadcn primitives (11 files)
├── config/
│   └── market-symbols.ts         # Twelve Data symbol registry
├── docs/                         # Audits, specs, roadmaps (15 .md files)
├── hooks/
│   ├── useQuotes.ts
│   └── useCurrencyStrength.ts
├── lib/
│   ├── adapters/vietnam/         # TCBS, Vietstock, FireAnt stubs
│   ├── api/                      # finnhub, tradingEconomics, twelveData, etc.
│   ├── brokers/                  # Sprint 2: registry, compare, affiliate, clicks
│   ├── config/features.ts        # Feature flags
│   ├── currency-strength/        # FX strength calculation engine
│   ├── market/                   # Twelve Data services (overview, heatmap, etc.)
│   ├── providers/                # Data providers + mock fallbacks
│   ├── store/watchlist-store.ts  # Zustand (gated off)
│   ├── swr/                      # SWR keys, fetcher, hooks
│   ├── twelvedata/               # Twelve Data HTTP client (server-only)
│   ├── broker-data.ts            # Static broker catalog
│   ├── broker-sync.ts            # Placeholder auto-sync
│   └── … (i18n, seo, theme, mocks, etc.)
├── public/
│   ├── brand/logo.png
│   ├── banners/                  # Promo images
│   └── icon.svg, placeholder*.svg
├── scripts/                      # Dev diagnostics (bundle scan, error capture)
├── types/
│   ├── market.ts
│   └── broker.ts                 # Prisma-ready broker types
├── .env.example                  # Partial env template (3 keys documented)
├── components.json
├── next.config.mjs
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── pnpm-lock.yaml
└── README.md
```

**Excluded:** `node_modules/`, `.next/`, `.git/`, `data/` (runtime click logs)

**No `prisma/` directory.** No `drizzle/` or ORM config found.

---

## 2. Implemented Pages (App Router)

| Path | File | Type | Notes |
|------|------|------|-------|
| `/` | `app/page.tsx` | Dynamic (SSR) | Main dashboard |
| `/brokers` | `app/brokers/page.tsx` | Static | Platform listing |
| `/brokers/[slug]` | `app/brokers/[slug]/page.tsx` | SSG | Per-broker detail (Sprint 2) |
| `/compare/[pair]` | `app/compare/[pair]/page.tsx` | SSG | e.g. `ssi-vs-exness` (Sprint 2) |
| `/contact` | `app/contact/page.tsx` | Static | Contact page |
| `/legal/terms` | `app/legal/[slug]/page.tsx` | SSG | + privacy, cookies, risk-disclosure, disclaimer, partner-disclosure |
| `/legal/privacy` | ↑ | SSG | |
| `/legal/cookies` | ↑ | SSG | |
| `/legal/risk-disclosure` | ↑ | SSG | |
| `/legal/disclaimer` | ↑ | SSG | |
| `/legal/partner-disclosure` | ↑ | SSG | |
| `/markets/[symbol]` | `app/markets/[symbol]/page.tsx` | SSG (gated) | **404** when `features.dynamicMarketPages === false` |
| `/platforms` | `app/platforms/page.tsx` | Redirect | 308 → `/brokers` (`next.config.mjs`) |
| `/robots.txt` | `app/robots.ts` | Static | Disallows `/api/` |
| `/sitemap.xml` | `app/sitemap.ts` | Static | Home, brokers, contact, legal, broker slugs, compare pairs |

**Total `page.tsx` files:** 8

---

## 3. API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Probes crypto, global, Vietnam, calendar, news providers |
| `/api/crypto` | GET | CoinGecko crypto assets + heatmap tiles |
| `/api/global-markets` | GET | Yahoo Finance global quotes |
| `/api/vietnam-markets` | GET | Vietnam indices + heatmap (TCBS/Vietstock adapters) |
| `/api/news` | GET | RSS news feed |
| `/api/calendar` | GET | Economic calendar (Fair Economy chain) |
| `/api/events` | GET | Trading Economics calendar (newer route) |
| `/api/markets/overview` | GET | Twelve Data overview quotes (Sprint 1) |
| `/api/market/quotes` | GET | Legacy alias → same as markets/overview |
| `/api/markets/[symbol]` | GET | Symbol detail quote + time series (Twelve Data) |
| `/api/currency-strength` | GET | FX strength via Twelve Data pairs |
| `/api/heatmaps/[market]` | GET | Unified heatmap (`vn`/`us`/`crypto`) |
| `/api/heatmaps/vietnam` | GET | Legacy alias → `vn` |
| `/api/heatmaps/us` | GET | Legacy alias → `us` |
| `/api/heatmaps/crypto` | GET | Legacy alias → `crypto` |
| `/api/brokers/redirect` | GET | Log click + 302 to affiliate URL (Sprint 2) |
| `/api/brokers/clicks` | POST | Log broker click event (JSON body) (Sprint 2) |

**Total API route files:** 17 (16 GET, 1 POST). All data routes use mock fallback on provider failure.

---

## 4. Database Schema

**Not configured.** No Prisma, Drizzle, Supabase, or Mongoose in dependencies or repo.

Broker click analytics use **file-based JSONL** at `data/broker-clicks.jsonl` via `lib/brokers/click-store.ts` (append-only; graceful no-op on read-only filesystem).

---

## 5. Prisma Models

**Not configured** — no `prisma/schema.prisma`.

Types are **Prisma-ready** in `types/broker.ts`:

| Type | Purpose |
|------|---------|
| `BrokerRecord` | Canonical broker record for listings, detail, comparison |
| `BrokerClickLog` | Outbound click event shape |
| `BrokerComparisonResult` | Side-by-side comparison output |

---

## 6. Components

### `components/marketwall/` (30)

| Component | Role |
|-----------|------|
| `header.tsx`, `footer.tsx`, `sidebar.tsx` | Site chrome & nav |
| `ticker-bar.tsx` | Scrolling ticker |
| `market-overview.tsx` | Sidebar category tabs + sparklines |
| `fear-greed.tsx` | Fear & Greed gauge |
| `heatmap.tsx` | Heatmap section (VN/US/crypto tabs) |
| `currency-strength.tsx` | FX strength chart |
| `economic-calendar.tsx` | Calendar widget |
| `market-news.tsx` | Breaking news |
| `broker-highlights.tsx` | Homepage platform cards |
| `brokers-page.tsx` | `/brokers` listing |
| `broker-detail-page.tsx` | `/brokers/[slug]` (Sprint 2) |
| `broker-compare-page.tsx` | `/compare/[pair]` (Sprint 2) |
| `market-detail-page.tsx` | `/markets/[symbol]` (gated) |
| `symbol-detail-modal.tsx` + `-lazy.tsx` | Symbol modal (gated) |
| `watchlist.tsx` | Sidebar watchlist (gated) |
| `contact-page.tsx`, `contact-fab.tsx` | Contact |
| `legal-page.tsx` | Legal content renderer |
| `lightweight-chart.tsx` | TradingView Lightweight Charts wrapper |
| `data-skeletons.tsx`, `section-error-boundary.tsx` | Loading & isolation |
| `theme-toggle.tsx`, `language-switcher.tsx` | Theme + EN/VI |
| `brand-logo.tsx`, `symbol-logo.tsx`, `shared.tsx`, `risk-warning.tsx` | Utilities |

### `components/heatmap/` (7)

| Component | Role |
|-----------|------|
| `MarketHeatmap.tsx` | FireAnt-style treemap |
| `HeatmapTile.tsx` | Individual tile |
| `StockDetailModal.tsx` + `stock-detail-modal-lazy.tsx` | Stock detail modal |
| `StockTabs.tsx`, `StockSummaryTable.tsx` | Detail tabs/table |
| `TradingViewChart.tsx` | Chart in modal |

### `components/ui/` (11)

Shadcn: `avatar`, `badge`, `button`, `card`, `dropdown-menu`, `input`, `scroll-area`, `separator`, `table`, `tabs`, `tooltip`

**Total component files:** 48

---

## 7. Environment Variables

**`.env.example` exists** (documents 3 keys). Additional variables referenced in code:

| Variable | Purpose | In `.env.example` |
|----------|---------|-------------------|
| `TWELVE_DATA_API_KEY` | Twelve Data market quotes, heatmaps, symbol detail, FX strength | ✅ |
| `FINNHUB_API_KEY` | Finnhub news API (`lib/api/finnhub.ts`) | ✅ |
| `TRADING_ECONOMICS_API_KEY` / `TRADING_ECONOMICS_KEY` | Economic calendar via Trading Economics | ✅ (primary key only) |
| `BROKER_AFFILIATE_ID` | Affiliate `ref` param on broker redirects (default: `marketwall`) | — |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO/sitemap | — |
| `NEWS_RSS_ENABLED` | Set `"false"` to disable RSS news | — |
| `COINGECKO_ENABLED` | Set `"false"` to disable CoinGecko | — |
| `CURRENCY_STRENGTH_ENABLED` | Set `"false"` to disable currency provider | — |
| `VIETNAM_MARKET_ENABLED` | Set `"false"` to disable Vietnam live data | — |
| `TCBS_ADAPTER_ENABLED` | Set `"false"` to disable TCBS adapter | — |
| `FIREANT_API_KEY` | Enables FireAnt Vietnam adapter (stub) | — |
| `VIETSTOCK_API_KEY` + `VIETSTOCK_API_URL` | Enables Vietstock adapter (stub) | — |
| `NODE_ENV` | Standard Next.js (`development` enables debug logging) | — |

---

## 8. Completed Features

### Feature flags (`lib/config/features.ts`)

| Flag | Value | Effect |
|------|-------|--------|
| `symbolModal` | `false` | No symbol detail modal on ticker/heatmap |
| `heatmapDetailModal` | `true` | FireAnt-style stock detail modal on heatmap tiles |
| `watchlist` | `false` | Watchlist hidden |
| `liveClientFetch` | `true` | SWR client refresh enabled |
| `currencyStrength` | `true` | FX strength section visible |
| `dynamicMarketPages` | `false` | `/markets/*` returns 404 |

### Sprint 1 — Twelve Data Market Engine ✅ (`docs/PROJECT_SPEC.md`)

| Item | Location |
|------|----------|
| Market types | `types/market.ts` |
| Symbol registry | `config/market-symbols.ts` |
| Twelve Data client (server-only, retry, cache) | `lib/twelvedata/client.ts` |
| Quote normalization | `lib/market/normalize.ts` |
| Currency strength engine | `lib/market/currency-strength.ts` |
| Markets overview API | `app/api/markets/overview/route.ts` |
| Symbol detail API | `app/api/markets/[symbol]/route.ts` |
| Currency strength API | `app/api/currency-strength/route.ts` |
| Heatmap APIs | `app/api/heatmaps/[market]/route.ts` (+ legacy per-market routes) |
| Dashboard wiring (ticker, overview, strength) | `components/marketwall/*`, `hooks/useQuotes.ts` |
| EN/VI unavailable message | `lib/i18n.tsx` → `error.marketDataUnavailable` |

### Sprint 2 — Broker Module ✅ (`docs/PROJECT_SPEC.md`, uncommitted)

| Item | Location |
|------|----------|
| Broker types | `types/broker.ts` |
| Registry + slugs | `lib/brokers/registry.ts` |
| Affiliate URLs | `lib/brokers/affiliate.ts` |
| Click logging | `lib/brokers/click-store.ts`, `/api/brokers/clicks` |
| Redirect service | `/api/brokers/redirect` |
| Comparison engine | `lib/brokers/compare.ts` |
| Pages | `/brokers`, `/brokers/[slug]`, `/compare/[pair]` |

### Additional shipped features (production docs / git history)

- Homepage SSR + per-section error boundaries
- Vietnam heatmap (TCBS), ticker, fear & greed, calendar, news
- EN/VI i18n, theme toggle, Zalo contact FAB
- SEO (robots, sitemap, OpenGraph)
- FireAnt-style heatmap detail modal
- Finnhub + Trading Economics API integration

---

## 9. Missing / Incomplete vs `docs/PROJECT_SPEC.md`

### Explicitly future in PROJECT_SPEC

| Item | Status |
|------|--------|
| PostgreSQL + Prisma for brokers & click analytics | Not started |
| Real-time WebSocket quotes | Not started |

### Feature flags still off (`docs/re-enable-client-features.md`)

| Feature | Status |
|---------|--------|
| Symbol detail modal (`symbolModal`) | Off |
| Watchlist (`watchlist`) | Off |
| Dynamic market pages (`dynamicMarketPages`) | Off |

### Doc drift (older docs vs current code)

| Doc says | Current code |
|----------|--------------|
| `currencyStrength: false` (`final-production-report.md`, `currency-strength-data-source.md`) | **`true`** in `features.ts` |
| US/crypto heatmap tabs removed for stability | Heatmap UI has VN/US/crypto tabs; APIs exist |
| 6 API routes in production report | **17** routes now (Sprint 1 + 2 additions) |
| Sitemap excludes `/markets/*` only | Now includes broker slugs + compare pairs |

### Other known gaps (from audits & code)

| Gap | Notes |
|-----|-------|
| Header search bar | Non-functional placeholder |
| Login / Register buttons | UI placeholders only |
| Broker auto-sync | `lib/broker-sync.ts` returns `null` (stub) |
| FireAnt / Vietstock adapters | Stubs; need API keys |
| VN100 full coverage | Partial (~19 stocks via TCBS) |
| Heatmap timeframes 1D/7D/1M | UI-only; data is 1D change |
| `/api/health` | Does not probe Twelve Data, Finnhub, or broker services |
| Legacy duplicate layers | `lib/markets/*` vs `lib/market/*`, `lib/broker-data.ts` vs `lib/brokers/*` |
| `.env.example` incomplete | Missing broker, SEO, and provider toggle vars |
| Sprint 2 uncommitted | Broker module on disk but not in git HEAD |

---

## Key Library Areas

| Path | Purpose |
|------|---------|
| `lib/twelvedata/` | Server-only Twelve Data HTTP client with retry |
| `lib/market/` | Overview, heatmap, currency-strength, symbol resolver |
| `lib/brokers/` | Registry, compare, affiliate URLs, click store (Sprint 2) |
| `config/market-symbols.ts` | GOLD, DXY, EUR/USD, indices, crypto symbols |
| `types/market.ts` | Shared market API types |
| `types/broker.ts` | Broker domain types (Prisma-ready) |

---

## Summary Stats

| Metric | Count |
|--------|-------|
| App Router pages (`page.tsx`) | 8 |
| API routes | 17 |
| Components (marketwall + heatmap + ui) | 48 |
| Prisma models | 0 (not configured) |
| Feature flags off | 3 (`symbolModal`, `watchlist`, `dynamicMarketPages`) |
| Docs in `docs/` | 15 markdown files |
| Spec reference | `docs/PROJECT_SPEC.md` ✅ |
