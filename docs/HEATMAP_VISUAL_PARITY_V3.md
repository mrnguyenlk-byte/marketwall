# Heatmap Visual Parity V3

**Branch:** `main`  
**Generated:** 2026-06-17  
**Production:** https://btrading.org

## Summary

V3 aligns MarketWall heatmap visual hierarchy with FireAnt / TradingView references:

| Area | Change |
|------|--------|
| **VN sector root** | Power `0.85 → 0.90`, cap stays **25%** |
| **VN stock-in-sector / flat flow** | Power `0.75 → 0.85`, cap `18% → 25%` |
| **VN flat cap** (`VN_MAX_ITEM_AREA_SHARE`) | `18% → 25%` |
| **US dollar volume** | Linear (`power 1.0`), **no cap** (`maxShare 1`) |
| **Crypto 24h volume** | Linear (`power 1.0`), **no cap** (`maxShare 1`) |
| **VN leaders (top 10)** | +15% symbol/change font, 2px white ring, `z-index: 25` |

**Out of scope (unchanged):** resize handle, squarify algorithm, sector ordering, dashboard chrome outside tiles.

## Sector weight formula (verified)

Sector root weight uses **one** normalization pass on **raw** trading-value sums — not compressed inner stock weights.

```
sectorMetric(s) = Σ vnTradingValueMetric(stock)   for all stocks in sector s

rawShare(s)     = sectorMetric(s) / Σ sectorMetric(all sectors)

compressed(s)   = rawShare(s) ^ 0.90

sectorWeight(s) = compressed(s) / Σ compressed(*)
                  then cap at 25% with excess redistribution
```

**Inner stocks (within sector):**

```
stockWeight(i)  = (metric(i) / Σ metric in sector) ^ 0.85
                  then cap at 25% with excess redistribution
```

**Audit result:** `buildSectorGroupedTreemap` and `buildGroupedSectorTreemap` both compute root metrics as `Σ itemMetric(stock)` before a single `normalizeTreemapWeights` call. No double compression on sector root.

## Leader emphasis (top 10 VN)

Symbols: **VCB, VHM, VIC, FPT, TCB, HPG, MBB, ACB, SSI, VPB**

| Property | Value |
|----------|-------|
| Font | +15% vs tier base (e.g. large `13px → 15px`, medium `11px → 13px`) |
| Border | `border-2 border-white ring-2 ring-white/70` |
| Stacking | `z-index: 25` on absolute tile rect |
| Weights | **None** — visual only |

## US / Crypto cap removal

| Market | Path | Power | maxShare | Top tile share (live debug) |
|--------|------|-------|----------|----------------------------|
| US | `buildFlatMarketHeatmapLayout(..., "us", "dollarVolume")` | **1.0** | **1** | NVDA **12.09%** (= 3.25K / 26.88K) |
| Crypto | `buildFlatMarketHeatmapLayout(..., "crypto", "volume")` | **1.0** | **1** | BTC **98.43%** (= 1623.83T / 1649.72T) |

Previously both were capped at 18% with power 0.75 compression.

## Debug weight stats (`npm run heatmap:debug`)

### VN sector-volume (grouped)

| Metric | V2 (prior) | V3 |
|--------|------------|-----|
| maxRootSectorShare | 25% | **25%** (banking hits cap) |
| Banking top stock (SHB) inner share | ~6% | **8.81%** |
| maxInnerTileShare (layout) | — | **37.50%** (single-stock sector edge case) |
| maxSectorAspect | — | **8.15** (utilities) |
| maxStockAspect | — | **5.80** (NBB, realEstate) |

Top root sector shares: banking **25.00%**, realEstate **22.67%**, industrial **18.70%**.

### VN flat modes

| Mode | maxTileShare V3 |
|------|-----------------|
| market-cap | 4.79% (VCB) |
| foreign-flow | 25.00% (VIC, capped) |
| proprietary-flow | 25.00% (TCB, capped) |

### US / Crypto

| Mode | maxTileShare V3 | Notes |
|------|-----------------|-------|
| US dollar volume | 12.09% | Linear, uncapped |
| Crypto volume | 98.43% | Linear, uncapped; BTC dominates |

## Aspect ratio table

| Mode | layoutMaxAspectRatio | ≥ 10? |
|------|---------------------|-------|
| VN sector-volume | 8.150 | No (warn threshold) |
| VN market-cap | 6.790 | No |
| VN foreign-flow | 5.497 | No |
| VN proprietary-flow | 6.086 | No |
| US dollar volume | 3.043 | No |
| Crypto volume | **2593.143** | **Yes** — tiny tail coin (CRO); squarify/weighted-grid artifact; hierarchy prioritized over aspect |

## Screenshots

| File | Source |
|------|--------|
| `docs/marketwall-v3-parity.png` | Local dev (http://127.0.0.1:3000) — VN sector treemap with V3 weights |
| `docs/fireant-reference-v3.png` | Copy of `docs/fireant-vn-sector-reference.png` |
| `docs/tradingview-reference-v3.png` | TradingView S&P 500 sector heatmap capture |

## Files changed

- `lib/treemap/treemap-builders.ts` — VN powers/caps, US/Crypto power 1.0
- `lib/treemap/heatmap-engine.ts` — US/Crypto linear + uncapped layout
- `lib/vietnam/vietnam-sector-grid-layout.ts` — doc comment
- `lib/heatmap/leader-symbols.ts` — top 10 leaders
- `components/heatmap/HeatmapTile.tsx` — leader styling
- `scripts/heatmap-debug-report.ts` — accurate VN/US/Crypto reporting params
- `docs/HEATMAP_VISUAL_PARITY_V3.md` — this report
- `docs/marketwall-v3-parity.png`, `docs/fireant-reference-v3.png`, `docs/tradingview-reference-v3.png`
