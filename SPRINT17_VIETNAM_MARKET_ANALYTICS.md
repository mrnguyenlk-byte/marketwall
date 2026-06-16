# Sprint 17 — Vietnam Market Analytics Tabs

## Summary

Four FireAnt-style analytics tabs added inside the Vietnam Market section, aggregating **HOSE + HNX + UPCOM** (no per-exchange split). Data extends `GET /api/vietnam-markets` with an `analytics` object. UI: `components/marketwall/vietnam-market-analytics.tsx`, placed below Vietnam Market Dashboard.

## Tabs

| Tab | VI | Status |
|-----|-----|--------|
| Breadth | Biến động | Live when VPS/KBS quotes available |
| Foreign | Nước ngoài | Live from KBS `foreignTotal` |
| Proprietary | Tự doanh | Empty state (no free provider) |
| Liquidity | Thanh khoản | Snapshot + top symbols; no fake intraday curve |

## API

**Route:** `GET /api/vietnam-markets` (extended, no new route)

```json
{
  "analytics": {
    "breadth": {
      "available": true,
      "advancingCount": 0,
      "decliningCount": 0,
      "unchangedCount": 0,
      "advancingValue": 0,
      "decliningValue": 0,
      "unchangedValue": 0
    },
    "foreignFlow": {
      "available": true,
      "historicalAvailable": false,
      "range": "today",
      "buyVolume": 0,
      "sellVolume": 0,
      "netVolume": 0,
      "buyValue": 0,
      "sellValue": 0,
      "netValue": 0,
      "topNetBuy": [{ "symbol": "...", "sector": "...", "netVolume": 0, "netValue": 0, "price": 0 }],
      "topNetSell": []
    },
    "proprietary": {
      "available": false,
      "buyValue": null,
      "sellValue": null,
      "netValue": null,
      "history": []
    },
    "liquidity": {
      "available": true,
      "totalValue": 0,
      "totalVolume": 0,
      "previousSessionValue": null,
      "previousSessionVolume": 0,
      "topLiquidity": [{ "symbol": "...", "sector": "...", "value": 0, "volume": 0 }],
      "intradayAvailable": false,
      "intradaySeries": { "today": [], "previous": [] }
    }
  }
}
```

## Data fields available (free providers)

| Field | Source | Notes |
|-------|--------|-------|
| Stock price, change%, volume | VPS (primary) → KBS price board | Aggregated across HOSE/HNX/UPCOM |
| Breadth counts & values | Computed from live symbols only | Seeds excluded from analytics |
| Foreign FB/FS per symbol | KBS `/rtranking/foreignTotal` | Also FB/FS on price board |
| Foreign buy/sell/net totals | Sum of `foreignTotal` rows | Value = shares × CP |
| Top net foreign buy/sell | Sort by `FB - FS` | Top 10 each |
| Total market value/volume | Sum live symbols `price × volume` | |
| Top liquidity symbols | Sort by trading value | Top 10 |
| VNINDEX previous session volume | KBS `index/VNINDEX/data_day` | 2nd-to-last bar `v` |

## Data fields unavailable

| Field | Reason |
|-------|--------|
| Proprietary buy/sell/net | No PT/PB/PS fields in VPS/KBS free APIs |
| 10-session proprietary history | No provider |
| Foreign flow 7D / 28D history | KBS only exposes daily snapshot |
| Intraday cumulative liquidity buckets | VPS/KBS lack time-series GTGD in session |
| Previous session total market value | No historical per-stock aggregate API |
| Area chart (today vs previous intraday) | `intradayAvailable: false`, empty series |

## Formulas

### Biến động (breadth)

For each **live** stock across HOSE + HNX + UPCOM:

```
if changePercent > 0  → advancing
if changePercent < 0  → declining
else                  → unchanged

tradingValue = price × volume  (or stock.value when set)
```

### Nước ngoài (foreign flow)

Per `foreignTotal` row:

```
buyVolume  += FB
sellVolume += FS
buyValue   += FB × CP
sellValue  += FS × CP
netVolume  = buyVolume - sellVolume
netValue   = buyValue - sellValue

topNetBuy:  sort (FB - FS) > 0 by netValue desc
topNetSell: sort (FB - FS) < 0 by |netValue| desc
```

### Thanh khoản (liquidity)

```
totalValue  = Σ (price × volume) for live symbols
totalVolume = Σ volume for live symbols
topLiquidity = top 10 by trading value

intradaySeries: empty (no fake curve)
previousSessionVolume = VNINDEX data_day[-2].v when available
```

### Tự doanh (proprietary)

```
available = false always (audited: no free KBS/VPS/VNStock field)
```

## Providers used (priority)

| Analytics | Priority |
|-----------|----------|
| Quotes (breadth, liquidity) | 1. VPS 2. KBS 3. TCBS adapter chain |
| Foreign flow | 1. KBS `foreignTotal` 2. KBS board FB/FS |
| Session volume compare | KBS VNINDEX `data_day` |
| Proprietary | None |
| Intraday liquidity | None |

**Seed data:** used for heatmap layout only; **excluded** from breadth/liquidity via `liveSymbols` filter.

## Files changed

| File | Change |
|------|--------|
| `lib/vietnam/market-analytics.ts` | Types + compute functions |
| `lib/providers/kbs-client.ts` | `fetchKbsForeignTotalRows`, `fetchKbsIndexDailyBars`, `parseKbsForeignTotalRow` |
| `lib/providers/vietnam-market-provider.ts` | Attach `analytics` to `VietnamMarketData` |
| `app/api/vietnam-markets/route.ts` | Return `analytics` |
| `lib/swr/use-market-apis.ts` | `VietnamMarketsResponse.analytics` |
| `components/marketwall/vietnam-market-analytics.tsx` | 4-tab UI |
| `app/page.tsx` | Place panel below VN dashboard |
| `lib/i18n.tsx` | Tab labels + empty states |

**Not touched:** brokers, auth, database, heatmap layout, existing VN dashboard tables.

## Validation checklist

- [x] No fake proprietary data (`available: false`, empty state UI)
- [x] No fake intraday liquidity curve (`intradayAvailable: false`, empty `intradaySeries`)
- [x] Breadth aggregates HOSE + HNX + UPCOM (no exchange split in UI)
- [x] Foreign buy/sell sums all KBS `foreignTotal` rows
- [x] 7D/28D foreign range disabled with tooltip when `historicalAvailable: false`
- [x] Mock/fallback mode returns `analytics` with `available: false` sections
- [x] Works when some providers fail (partial live data still computes)

## Manual verification

```bash
# Build
npm run build

# API shape
curl -s http://localhost:3000/api/vietnam-markets | node -e "
const d=require('fs').readFileSync(0,'utf8'); const j=JSON.parse(d);
console.log(JSON.stringify({
  source: j.source,
  breadth: j.analytics?.breadth?.available,
  foreign: j.analytics?.foreignFlow?.available,
  proprietary: j.analytics?.proprietary?.available,
  liquidity: j.analytics?.liquidity?.available,
  intraday: j.analytics?.liquidity?.intradayAvailable,
}, null, 2));
"
```

### UI checklist

- [ ] Open dashboard → Vietnam section shows 4 tabs below VN dashboard
- [ ] **Biến động:** pie + bar charts, counts match advancing/declining/unchanged
- [ ] **Nước ngoài:** totals + diverging top net buy/sell; 7D/28D disabled with tooltip
- [ ] **Tự doanh:** empty state message (no numbers)
- [ ] **Thanh khoản:** total value/volume + top table; no area chart; note about snapshot mode
- [ ] Heatmap and existing VN dashboard unchanged

## Screenshots

_Add browser screenshots after local `npm run dev` review:_
1. Biến động tab with live data
2. Nước ngoài tab with diverging chart
3. Tự doanh empty state
4. Thanh khoản snapshot view
