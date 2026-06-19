# Codebase Cleanup Report

**Date:** 2026-06-15  
**Scope:** Safe hygiene only — no UI, runtime logic, Daily Analysis, or social publishing changes.

---

## Package manager

| Action | Detail |
|--------|--------|
| **Canonical manager** | **npm** (`package-lock.json` remains the single lockfile) |
| **Removed** | `pnpm-lock.yaml` (duplicate lockfile; not referenced in `package.json`) |

Install and CI should use:

```bash
npm ci
npm run build
```

---

## Removed files (from repository)

| File | Reason |
|------|--------|
| `pnpm-lock.yaml` | Duplicate lockfile; standardize on npm |
| `tsconfig.tsbuildinfo` | TypeScript incremental build cache (generated) |
| `.deploy-home-full.html` | Local deploy/debug HTML snapshot (generated) |
| `.deploy-home-snippet.html` | Local deploy/debug HTML snapshot (generated) |

These files are now listed in `.gitignore` so they are not re-committed.

---

## Updated files

| File | Change |
|------|--------|
| `.gitignore` | Added `tsconfig.tsbuildinfo`, `.deploy-*.html` |

---

## Kept files (intentionally not removed)

| Category | Files / notes |
|----------|----------------|
| **Lockfile** | `package-lock.json` |
| **Vietnam adapter stubs** | `lib/adapters/vietnam/fireant-adapter.ts`, `lib/adapters/vietnam/vietstock-adapter.ts` |
| **Adapter registry** | `lib/adapters/vietnam/registry.ts` (priority: VPS → KBS → TCBS → Vietstock → FireAnt) |
| **All domain providers** | `lib/providers/*-provider.ts` (unchanged) |
| **Daily Analysis** | `lib/daily-analysis/**`, automation routes — untouched |
| **Social publishers** | `lib/publishers/telegram.ts`, `lib/publishers/facebook.ts` — untouched |
| **UI / heatmap layout** | `components/**`, treemap builders — untouched |
| **Orphan / legacy components** | e.g. `components/heatmap/SectorTreemap.tsx` — kept to avoid behavior risk; remove in a dedicated refactor sprint |

---

## Active providers

### Vietnam market adapters (`lib/adapters/vietnam/`)

| ID | Status | Endpoint / notes |
|----|--------|------------------|
| **vps** | Active | `bgapidatafeed.vps.com.vn` — primary heatmap quotes |
| **kbs** | Active | `kbbuddywts.kbsec.com.vn` — enrichment, indices, leaderboards |
| **tcbs** | Active | `apipubaws.tcbs.com.vn` — public fallback |
| **vietstock** | Stub | Requires `VIETSTOCK_API_KEY` + `VIETSTOCK_API_URL` |
| **fireant** | Stub | Requires `FIREANT_API_KEY`; HTTP not wired |

### Domain providers (`lib/providers/`)

| Provider | Upstream | Used for |
|----------|----------|----------|
| `vietnam-market-provider` | Adapter chain + KBS | VN indices, heatmap stocks, analytics |
| `global-market-provider` | Yahoo → Stooq | Gold, DXY, Oil, US indices |
| `crypto-provider` | CoinGecko | Crypto heatmap / tickers |
| `market-provider` | Composite | Overview / ticker bar |
| `heatmap-provider` | Mock + mappers | Legacy heatmap tiles |
| `currency-provider` | Twelve Data / Alpha Vantage / Yahoo | FX strength |
| `fear-greed-provider` | Computed + Alternative.me | Dashboard gauges |
| `economic-provider` | Trading Economics / Fair Economy | Calendar data |
| `calendar-provider` | Finnhub | UI economic calendar API |
| `news-provider` | Finnhub / RSS | Market news |
| `vietnam-chart-provider` | KBS / adapters | VN symbol charts |

### Other data clients (kept)

| Module | Role |
|--------|------|
| `lib/providers/yahoo-finance.ts` | US heatmap quotes, FX |
| `lib/providers/proprietary/cafef-provider.ts` | Proprietary EOD (CafeF) |
| `lib/twelvedata/client.ts` | Twelve Data (optional realtime / FX) |
| `lib/alphavantage/client.ts` | Alpha Vantage FX fallback |
| `lib/fear-greed/crypto.ts` | Alternative.me crypto FNG |

---

## Stub providers (kept by design)

| Provider | File | Activation |
|----------|------|------------|
| **FireAnt** | `lib/adapters/vietnam/fireant-adapter.ts` | `FIREANT_API_KEY` — returns `not_connected` until HTTP layer is wired |
| **Vietstock** | `lib/adapters/vietnam/vietstock-adapter.ts` | `VIETSTOCK_API_KEY` + `VIETSTOCK_API_URL` — returns `not_connected` |

Both remain in `VIETNAM_ADAPTER_PRIORITY` for future paid-feed integration without registry changes.

---

## Cache limitation note

Server-side caching uses an **in-memory `Map`** in `lib/providers/cache.ts`:

- Cache is **per serverless instance** (Vercel) — not shared across instances or regions.
- Entries are **lost on cold start** — TTLs (e.g. heatmap 300s, crypto 45s) restart after each new instance.
- This is intentional for the current free-tier architecture; see `docs/DATA_AUDIT_REPORT.md` for upgrade paths (Redis/KV).

No cache implementation was changed in this cleanup.

---

## Validation

```bash
npm run build
```

Build must pass after cleanup. No application code paths were modified.

---

## Out of scope (future sprints)

- Removing dead UI paths (`LegacyHeatmapSection`, unused modals)
- Consolidating `vn` vs `vietnam` naming
- Adding CI / automated tests
- Shared Redis cache
