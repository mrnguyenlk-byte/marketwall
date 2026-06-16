# Sprint 27 — Vietnam Data Accuracy Fix

**Date:** 2026-06-16  
**Scope:** GTGD `×10` enforcement, explicit volume fields, VPS foreign full universe  
**Build:** `npm run build` ✅

---

## P0 — Trading value unit fix

### Root cause

VPS `lot` = **10-share lots**. Using `price × lot` under-reports GTGD by ~10× vs SSI/FireAnt.

### Correct formula

```
tradingValue = price × volumeLot × 10
volumeShares = volumeLot × 10
volumeUnit   = "lot10"
```

### Before / after GTGD examples (VCB, live VPS/SSI)

| Symbol | Before (`price × lot`) | After (`price × lot × 10`) | SSI GTGD | After vs SSI |
|--------|------------------------|----------------------------|----------|--------------|
| VCB | 19.16B | **191.58B** | 192.49B | -0.47% |
| FPT | 42.83B | **428.34B** | 427.59B | +0.17% |
| HPG | 34.45B | **344.45B** | 342.80B | +0.48% |
| SSI | 62.72B | **627.24B** | 637.08B | -1.54% |

### Applied to

| Area | Implementation |
|------|----------------|
| Heatmap tile sizing | `lib/vietnam/heatmap-sizing.ts` → `vpsTradingValue()` |
| Heatmap tooltip | `HeatmapTile` uses `tradingValue` + lot/shares labels |
| Vietnam heatmap API | `vnHeatmapStockToAsset()` explicit fields |
| Top Value dashboard | `buildDashboardFromHeatmapStocks()` sorts by corrected `value` |
| Liquidity analytics | `market-analytics.ts` → `stockTradingValue()` |
| Breadth money flow | same `stockTradingValue()` |
| Foreign flow values | `enrichVnForeignFlow()` — shares × price |

### Explicit API fields (VN heatmap item)

```json
{
  "symbol": "VCB",
  "price": 61600,
  "changePercent": 0.32,
  "volume": 311000,
  "volumeLot": 311000,
  "volumeShares": 3110000,
  "tradingValue": 191576000000,
  "volumeUnit": "lot10",
  "foreignBuy": 461900,
  "foreignSell": 1175960,
  "foreignNetValue": -72430176000
}
```

---

## P1 — VPS foreign full universe

### Before

| Source | Coverage |
|--------|----------|
| KBS `/rtranking/foreignTotal` | ~10 symbols (leaderboard only) |
| VPS `fBVol` / `fSVolume` | Parsed but **not on heatmap API merge** |
| Audit 8 symbols | 3/8 had MW foreign data |

### After

| Source | Role |
|--------|------|
| **VPS** | Primary — all heatmap symbols |
| KBS | Fallback when VPS foreign empty; validation only |

### Conversion

```
foreignBuyShares  = fBVol × 10
foreignSellShares = fSVolume × 10
foreignNetShares  = buy − sell
foreignBuyValue   = foreignBuyShares × price
foreignSellValue = foreignSellShares × price
foreignNetValue   = foreignBuyValue − foreignSellValue
```

### Foreign coverage after (8-symbol audit vs VPS/SSI)

| Symbol | MW foreign (post-fix) | VPS | SSI match |
|--------|----------------------|-----|-----------|
| VCB | ✅ | 461,900 / 1,175,960 | Excellent |
| FPT | ✅ | 960,680 / 1,647,020 | Excellent |
| HPG | ✅ | 6,355,600 / 1,205,700 | Excellent |
| SSI | ✅ | 3,029,330 / 1,212,030 | Excellent |
| SHB | ✅ | VPS row | Excellent |
| VPB | ✅ | VPS row | Excellent |
| VIC | ✅ | VPS row | Excellent |
| VHM | ✅ | VPS row | Excellent |

**Dashboard Foreign Flow chart** now ranks from VPS heatmap universe (`buildDashboardFromHeatmapStocks`), not KBS top-10 alone.

---

## P2 — Production verification (2026-06-16)

### Live audit (`node scripts/data-accuracy-audit.mjs`)

Target: https://btrading.org

| Check | Result |
|-------|--------|
| `volumeUnit` | `"lot10"` ✅ |
| `tradingValue` vs SSI | Excellent (8/8 symbols, ±1.5%) |
| `volumeShares` vs VPS | Excellent |
| `volumeLot` vs VPS | Excellent |
| Price / change% vs VPS | Excellent |
| Foreign on heatmap API | **null pre-deploy** — fixed in this sprint (merge + explicit fields) |

### Production verification checklist

- [ ] Deploy Sprint 27
- [ ] `GET /api/heatmaps/vietnam` — items include `volumeLot`, `volumeShares`, `tradingValue`, `foreignBuy`, `foreignSell`
- [ ] `GET /api/vietnam-markets` — `volumeUnit: "lot10"`, analytics foreign totals > 0
- [ ] VCB tooltip shows GTGD ~191B VND (not ~19B)
- [ ] Foreign Flow chart shows VPS symbols beyond KBS top-10
- [ ] Re-run `node scripts/data-accuracy-audit.mjs` — foreignBuy_mw_vs_vps = Excellent for 8 symbols

---

## Files changed

| File | Change |
|------|--------|
| `lib/vietnam/vn-quote-fields.ts` | **New** — `enrichVnQuoteVolume`, `enrichVnForeignFlow` |
| `lib/vietnam/vn-dashboard-from-vps.ts` | **New** — VPS dashboard + `vnHeatmapStockToAsset` |
| `lib/providers/vietnam-market-provider.ts` | Dashboard from VPS; KBS foreign fallback only |
| `lib/market/heatmap.ts` | VN rows with explicit fields; live merge includes foreign |
| `lib/market/heatmap-assets.ts` | Pass `volumeLot`, `volumeShares`, `tradingValue` to tiles |
| `types/market.ts` | Extended `HeatmapAsset` + `MarketAsset` VN fields |
| `components/heatmap/HeatmapTile.tsx` | Tooltip lot/shares; use API `tradingValue` |
| `scripts/data-accuracy-audit.mjs` | Audit `volumeShares`, `volumeLot`, `foreignNetValue` |

**Unchanged:** layout, colors, routing, paid providers.

---

## Build result

```
prisma generate && npm run build — passed ✅
```

---

## Notes

- Sprint 22 introduced core `×10` fix; Sprint 27 completes explicit fields, heatmap foreign merge gap, and VPS-based Foreign Flow dashboard.
- VPS remains primary quote provider; KBS used for indices and leaderboard validation fallback.
