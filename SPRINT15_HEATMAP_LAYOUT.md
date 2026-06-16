# Sprint 15 — Vietnam Heatmap Professional Layout

## Summary

Professional Vietnam heatmap layout: sector grouping, tiered tiles, expanded VN150 universe, right-column news order fix, and removal of the legacy “Cap weighted” badge.

---

## Tasks completed

| # | Task | Status |
|---|------|--------|
| 1 | Breaking News above Economic Calendar | Done |
| 2 | Remove “Cap weighted” label | Done |
| 3 | Heatmap grouping: By Sector (default) / By Market Cap | Done |
| 4 | Ten sector groups | Done |
| 5 | Tile tiers: Large / Medium / Small / Tiny | Done |
| 6 | Universe: VN100 minimum, 150 preferred | Done (150 seeds) |
| 7 | This document | Done |

---

## Layout changes

### Right column order

**Before:** Economic Calendar → Breaking News  
**After:** Breaking News → Economic Calendar  

File: `app/page.tsx`

### “Cap weighted” badge

Removed from `HeatmapDetailSection` and `LegacyHeatmapSection` headers in `components/marketwall/heatmap.tsx`. Grouping toggle replaces it for Vietnam.

---

## Heatmap grouping

### Modes (Vietnam only)

| Mode | Default | Behavior |
|------|---------|----------|
| **By Sector** | Yes | Assets grouped into sector sections with headers; sorted by market cap within each group |
| **By Market Cap** | No | Single dense grid, sorted by market cap (prior behavior) |

Toggle appears in heatmap header when Vietnam tab is active.

### Sector groups

Defined in `lib/vietnam/sector-groups.ts`:

| Group ID | Display | Source sectors mapped |
|----------|---------|------------------------|
| `banking` | Banking | Banking |
| `realEstate` | Real Estate | Real Estate |
| `securities` | Securities | Brokerage, Securities |
| `steel` | Steel | Steel |
| `oilGas` | Oil & Gas | Energy, Oil & Gas |
| `retail` | Retail | Retail |
| `technology` | Technology | Technology |
| `utilities` | Utilities | Utilities |
| `industrial` | Industrial | Industrial |
| `other` | Other | Consumer, Materials, Healthcare, Transport, etc. |

Unmapped / `Equity` / `—` → **Other**.

---

## Tile rendering tiers

Implemented in `components/heatmap/HeatmapTile.tsx`. Size assigned by market-cap rank within each group (or full grid in cap mode):

| Tier | Rank slice | Visible content | Grid span |
|------|------------|-----------------|-----------|
| **Large** | Top ~8% | Ticker, %, price | 2×2 |
| **Medium** | Next ~14% | Ticker, % | 2×1 |
| **Small** | Next ~23% | Ticker only | 1×1 |
| **Tiny** | Remainder | Color only | 1×1 |

All tiers: **tooltip on hover** (symbol, name, price, %, volume, sector).

---

## Universe expansion

| Metric | Before | After |
|--------|--------|-------|
| HOSE seeds | 50 | **87** |
| HNX seeds | 32 | 32 |
| UPCOM seeds | 31 | 31 |
| **Total** | ~113 | **150** |
| API target (`VN_HEATMAP_SIZE`) | 100 | **150** |
| Minimum floor (`VN_HEATMAP_MIN_ITEMS`) | — | **100** |

New HOSE symbols include: EIB, OCB, HSG, NKG, HCM, MBS, VIX, GEX, NT2, OIL, PVD, VHC, DGW, SAM, YEG, and others.

`lib/market/heatmap.ts` now builds rows from `heatmapStocks` (sector + volume preserved) instead of flat tiles with `sector: "Equity"`.

---

## Files changed

| File | Change |
|------|--------|
| `app/page.tsx` | News above calendar in right column |
| `components/marketwall/heatmap.tsx` | Remove cap badge; sector/cap grouping toggle |
| `components/heatmap/MarketHeatmap.tsx` | Sector sections + grouping mode |
| `components/heatmap/HeatmapTile.tsx` | Four tile tiers + tiny color-only cells |
| `lib/vietnam/sector-groups.ts` | **New** — sector normalization |
| `lib/vietnam-heatmap-seeds.ts` | +37 HOSE symbols → 150 total |
| `lib/market/heatmap.ts` | VN150 target, stock-based rows with sector |
| `lib/i18n.tsx` | Grouping + sector label keys |

---

## Responsive / UX notes

- Sector mode scrolls vertically inside heatmap container (`overflow-y-auto`) so all groups remain reachable without widening the grid.
- Grouping toggle wraps on narrow headers alongside timeframe pills.
- US / Crypto heatmaps unchanged (market-cap flat grid only).
- Theme, colors, and data providers unchanged.

---

## Screenshot checklist

- [ ] Right column: Breaking News card appears **above** Economic Calendar
- [ ] No “Cap weighted” badge on heatmap header
- [ ] Vietnam heatmap: **By Sector** selected by default
- [ ] Sector headers visible (Banking, Real Estate, Securities, …)
- [ ] Toggle **By Market Cap** shows single sorted grid
- [ ] Large tiles: ticker + % + price
- [ ] Medium tiles: ticker + %
- [ ] Small tiles: ticker only
- [ ] Tiny tiles: color block; tooltip on hover
- [ ] ~150 symbols visible across sector groups (scroll if needed)
- [ ] US/Crypto tabs: no sector toggle; flat heatmap still works

---

## Build

```
npm run build  → passed
```

---

## Unchanged (per scope)

- API route shapes (`/api/heatmaps/vietnam`)
- Provider chain (VPS → KBS → TCBS)
- Heatmap color scale (`heatStyle`)
- Stock detail modal / TradingView paths
