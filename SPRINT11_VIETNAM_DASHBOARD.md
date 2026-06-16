# Sprint 11 — Vietnam Market Dashboard

**Date:** 2026-06-16  
**Status:** Implemented  
**Constraint:** No new API routes · No paid providers

---

## Goal

Add a **Vietnam Market Dashboard** with KBS/Vnstock leaderboards while keeping **VPS as the primary heatmap quote provider**.

---

## Architecture

```
Adapter chain (heatmap quotes):
  VPS (primary) → KBS (secondary fallback) → TCBS → Vietstock → FireAnt

Live enrichment (always when market is live):
  KBS rankings + indices via fetchKbsMarketDashboard() / fetchKbsIndexSnapshot()

API (unchanged route):
  GET /api/vietnam-markets
    └── dashboard: { topVolume, topValue, topForeignBuy, topForeignSell }

UI:
  app/page.tsx → VietnamMarketDashboard (below heatmap)
    └── useVietnamMarkets() — existing SWR key
```

---

## Provider changes

| Layer | Change |
|-------|--------|
| `lib/providers/kbs-client.ts` | **New** — KBS HTTP client (price board, rankings, indices) |
| `lib/adapters/vietnam/kbs-adapter.ts` | **New** — Secondary adapter (batch `stock/iss`, index OHLCV) |
| `lib/adapters/vietnam/registry.ts` | Priority: `vps` → **`kbs`** → `tcbs` → … |
| `lib/providers/vietnam-market-provider.ts` | Adds `dashboard`, `heatmapProvider`, `enrichmentProvider` |
| `app/api/vietnam-markets/route.ts` | Extended response (same route) |

### VPS remains primary

- Registry still tries **VPS first** for `fetchMarketSnapshot()`.
- Heatmap tiles merge VPS live prices into seed layout (unchanged).
- KBS only replaces heatmap quotes if VPS fails (secondary fallback).

### KBS secondary roles

1. **Dashboard leaderboards** (always fetched in parallel when live):
   - `/rtranking/volume` → Top Volume
   - `/rtranking/value` → Top Value
   - `/rtranking/foreignTotal` → Top Foreign Buy (`FB` desc) / Top Foreign Sell (`FS` desc)

2. **Index enrichment** when primary adapter returns no indices (VPS has no indices):
   - `/index/{VNINDEX,VN30,HNX,UPCOM}/data_day`

3. **Foreign flow fields** on price board (`FB`, `FS`) available via `parseKbsPriceBoardRow` for future symbol-detail use.

---

## Dashboard UI

**Component:** `components/marketwall/vietnam-market-dashboard.tsx`  
**Placement:** Home page main column, directly under Vietnam heatmap.

| Section | Data field | KBS source |
|---------|------------|------------|
| Top Volume | `dashboard.topVolume` | `rtranking/volume` |
| Top Value | `dashboard.topValue` | `rtranking/value` |
| Top Foreign Buy | `dashboard.topForeignBuy` | `foreignTotal` sorted by `FB` |
| Top Foreign Sell | `dashboard.topForeignSell` | `foreignTotal` sorted by `FS` |

Each card shows: rank, symbol, last price, % change pill, metric column.

---

## API response shape (extended)

```json
{
  "source": "live",
  "heatmapProvider": "vps",
  "enrichmentProvider": "kbs",
  "indices": [ ... ],
  "heatmapMarket": { ... },
  "heatmapStocks": { ... },
  "dashboard": {
    "source": "live",
    "updatedAt": "2026-06-16T...",
    "topVolume": [{ "rank": 1, "symbol": "SHB", "price": 13900, "volume": 47856000, ... }],
    "topValue": [ ... ],
    "topForeignBuy": [{ "symbol": "HPG", "foreignBuy": 6355600, ... }],
    "topForeignSell": [{ "symbol": "...", "foreignSell": ..., ... }]
  }
}
```

**No new routes** — clients keep using `GET /api/vietnam-markets` and `useVietnamMarkets()`.

---

## Configuration

| Env var | Default | Effect |
|---------|---------|--------|
| `KBS_ADAPTER_ENABLED` | enabled | Set `false` to disable KBS adapter + dashboard fetch |
| `VNSTOCK_API_KEY` | optional | Python vnstock tier only; **not** sent to KBS HTTP |
| `VIETNAM_MARKET_ENABLED` | enabled | Master switch for live Vietnam data |

---

## Verification

```bash
npm run build   # ✅ passes

# Local
curl -s http://localhost:3000/api/vietnam-markets | jq '{
  source,
  heatmapProvider,
  enrichmentProvider,
  dashboard: {
    source: .dashboard.source,
    topVolume: .dashboard.topVolume[0],
    topForeignBuy: .dashboard.topForeignBuy[0]
  }
}'
```

**UI:** Open home → scroll below Vietnam heatmap → four leaderboard cards with live KBS badge.

---

## Files touched

| File | Action |
|------|--------|
| `lib/providers/kbs-client.ts` | Added |
| `lib/adapters/vietnam/kbs-adapter.ts` | Added |
| `lib/adapters/vietnam/types.ts` | `kbs` id + foreign volume fields |
| `lib/adapters/vietnam/registry.ts` | KBS in priority chain |
| `lib/adapters/vietnam/normalize.ts` | `normalizeKbsIndex` |
| `lib/providers/vietnam-market-provider.ts` | Dashboard + enrichment |
| `app/api/vietnam-markets/route.ts` | Extended payload |
| `lib/swr/use-market-apis.ts` | Response types |
| `components/marketwall/vietnam-market-dashboard.tsx` | Added |
| `app/page.tsx` | Mount dashboard |
| `lib/i18n.tsx` | Dashboard strings |

---

## Out of scope (Sprint 11)

- Market breadth (no KBS endpoint)
- New `/api/vietnam/*` routes
- Replacing Entrade chart provider (Sprint 10B)
- Paid FireAnt / Vietstock adapters
- Heatmap tile foreign-flow overlay (future sprint)

---

## Related docs

- `VNSTOCK_CAPABILITY_AUDIT.md` — KBS field audit (Sprint VNSTOCK)
- `SPRINT10B_VN_NATIVE_CHART.md` — Entrade OHLCV charts
- `SPRINT9_PROVIDER_REPLACEMENT_AUDIT.md` — VPS primary cutover
