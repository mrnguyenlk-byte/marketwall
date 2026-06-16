# Sprint 36B — Two-Level Squarified Vietnam Heatmap

**Date:** 2026-06-16  
**Scope:** VN heatmap layout engine only (no providers, APIs, tables, sidebars, CSS shell changes)  
**Build:** `npm run build` ✅  
**Server QA:** `http://localhost:3015` (production build)

## Problem (checkpoint 4c2ab6c)

The Vietnam heatmap used a **fixed two-row band** outer layout (`VN_SECTOR_GRID_ROW_1` / `ROW_2` + horizontal `splitHorizontal`). Sectors were forced into two horizontal strips, producing **long sector columns/strips** — especially for banking, securities, and stacked right-side bands. Inner stock layout used squarify, but the outer frame dictated strip geometry before inner layout ran.

## New architecture

Two-level squarified treemap (Finviz / FireAnt intent):

```
Root container {0,0,1,1}
  └─ squarify(sectors) with sectorGap=0.002
       └─ for each sector rect:
            header = clamp(5% height, 16–24px normalized)
            inner = rect minus header
            └─ squarify(stocks) with sqrt(metric) weights
                 └─ aspect guard → 8% cap retry → oriented balanced grid fallback
```

### Root sector weights

```
sectorMetric   = Σ stock metric (GTGD / tradingValue)
sectorWeight   = 0.70 × normalized(√sectorMetric) + 0.30 × fixedImportance
root squarify value = √(blended normalized weight)
```

Fixed importance: banking 1.25, securities 1.10, realEstate 1.05, steel 1.00, oilGas 0.95, technology 0.95, retail 0.90, industrial 0.85, utilities 0.80, other 0.70.

Root layout picks the lowest max-aspect squarify among flatten attempts `[0, 0.15, 0.3, 0.45]`. Balanced 4×N grid root fallback only if max sector aspect > 10.

### Inner stock layout

- `stockWeight = √(metric)` with 12% soft cap (8% on retry)
- Tiles below 2% weight → **Khác** bucket
- Always squarify (even few stocks)
- **Aspect guard:** target tile aspect ≤ 3:1
  1. Squarify attempts (orientation + weight flatten)
  2. Retry with 8% cap
  3. Oriented balanced grid fallback (minimizes cell aspect for sector shape)

### Text tiers (sector-local area share)

| Tier   | Share threshold | Content              |
|--------|-----------------|----------------------|
| large  | ≥ 4.5%          | symbol + change% + price |
| medium | ≥ 2.0%          | symbol + change%     |
| small  | ≥ 0.8%          | symbol               |
| tiny   | < 0.8%          | tooltip only         |

## Tile counts (live API, GTGD sizing, limit 200)

| Sector      | Tiles (+ Khác) | Notes |
|-------------|----------------|-------|
| banking     | 19 (18 + Khác) | ✅ ≥ 15 |
| securities  | 15             | ✅ ≥ 10 |
| realEstate  | 13 (12 + Khác) | ⚠️ 13 in top-200 universe (not 15+) |
| industrial  | 15             | |
| other       | 18             | |
| oilGas      | 10             | |
| steel       | 7              | |
| retail      | 5              | |
| technology  | 5              | |
| utilities   | 4              | |
| **total visible** | **103** | 200 input assets |

Run: `npx tsx scripts/sprint36-layout-count.ts http://localhost:3015`

## Aspect ratio report

| Metric | Value | Target |
|--------|-------|--------|
| Max tile aspect | **1.95:1** | ≤ 3:1 ✅ |
| Max sector aspect (root squarify) | **8.25:1** | weighted sectors; inner guard keeps tiles square |
| Max tile area share (sector inner) | 24.7% | 12% weight cap; grid fallback uses equal cells |

Banking/securities tall columns use oriented balanced grid inner fallback when inner aspect > 3, producing ~square cells instead of vertical strips.

## Files changed

| File | Change |
|------|--------|
| `lib/vietnam/vietnam-sector-grid-layout.ts` | Two-level squarify root + inner; removed row-band placement; new types `VnSectorTreemapLayout`, `buildVietnamSectorTreemapLayout`, `analyzeVnSectorTreemapLayout` |
| `components/heatmap/VietnamSectorGridHeatmap.tsx` | Uses treemap builder; tooltip delay 175ms; `data-grouping="sector-treemap"` |
| `scripts/sprint36-layout-count.ts` | Layout metrics script for docs/CI |
| `scripts/sprint36b-screenshots.mjs` | Playwright viewport capture helper |

## Screenshots

### Before (Sprint 35 fixed two-row bands)

`docs/sprint36b/before-fixed-bands.png`

### After (Sprint 36B two-level squarify)

| Viewport | Path |
|----------|------|
| 1440×936 | `docs/sprint36b/after-1440.png` |
| 1920×1248 | `docs/sprint36b/after-1920.png` |
| 2560×1664 | `docs/sprint36b/after-2560.png` |

Visual intent: sector-weighted squarify at root (banking/securities get larger regions), square-ish stock tiles within each sector — closer to FireAnt/Finviz sector treemap than fixed horizontal bands.

## Build result

```
npm run build  →  exit 0 (Next.js 16.2.6, TypeScript clean)
```

## Blockers / follow-ups

- **realEstate tile count (13)** below 15+ target is a **universe/data** issue in the current top-200 GTGD slice, not a layout cap.
- **Root sector aspects** can still exceed 3:1 under pure weighted squarify with 10 sectors; inner oriented grid fallback ensures **tile** aspects stay ≤ 3. Root balanced grid activates only for extreme layouts (aspect > 10).
- Browser MCP tab was unavailable in agent environment; screenshots captured via `npx playwright screenshot`.

## Verification checklist

- [x] Local build passed
- [x] Two-level squarify replaces row-band outer layout
- [x] Max tile aspect ≤ 3:1 (1.95 measured)
- [x] banking ≥ 15, securities ≥ 10 sector slots
- [x] Screenshots at 1440 / 1920 / 2560
- [x] MarketHeatmap routing unchanged
- [ ] Push (explicitly skipped per sprint instructions)
