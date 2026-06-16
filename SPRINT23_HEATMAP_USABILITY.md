# Sprint 23 — Heatmap Usability Fix

**Date:** 2026-06-16  
**Scope:** Layout, height, symbol limits, and tiered tile text for Vietnam / US / Crypto heatmaps  
**Build:** `npm run build` (run locally to verify)

## Summary

Reduced heatmap vertical footprint, widened the main column to 78% (sidebar 22%), capped symbol counts per market, and enforced size-based text visibility so small tiles no longer show unreadable labels. Vietnam keeps sector grouping and sorts by trading value (`price × volume × 10`).

## Layout change (78 / 22)

| | Before | After |
|---|--------|-------|
| Desktop grid | `xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]` (~75/25) | `xl:grid-cols-[39fr_11fr]` (78/22) |
| Sidebar cap | `xl:max-w-[360px]` | Removed — sidebar fills its 22% column |
| Sidebar content | Fear & Greed, Breaking News, Economic Calendar | Unchanged |

File: `app/page.tsx`

## Symbol limits per market

| Market | Limit | Sort key | Sector grouping |
|--------|-------|----------|-----------------|
| **Vietnam** | 80 | Trading value (`vpsTradingValue`) | Yes (default) |
| **US** | 50 | Dollar volume (`price × volume`), market cap tiebreak | No — single grid |
| **Crypto** | 40 | 24h volume | No — single grid |

Constants: `config/heatmap-symbols.ts` (`VN_HEATMAP_LIMIT`, `US_HEATMAP_LIMIT`, `CRYPTO_HEATMAP_LIMIT`)  
Shared sort/limit helpers: `lib/market/heatmap-limits.ts`  
API enforcement: `lib/market/heatmap.ts`  
Client enforcement: `components/heatmap/MarketHeatmap.tsx`

US still fetches up to 100 Yahoo seed tickers; top 50 by dollar volume are displayed after live overlay.

## Text tier rules

Implemented in `components/heatmap/HeatmapTile.tsx` (detail modal path) and legacy `HeatGrid` in `components/marketwall/heatmap.tsx`.

| Tier | Rank slice (within group/grid) | Visible content | Grid span |
|------|--------------------------------|-----------------|-----------|
| **Large** | Top ~8% | Symbol, % change, price | 2×2 |
| **Medium** | Next ~14% | Symbol, % change | 2×1 |
| **Small** | Next ~23% | Symbol only | 1×1 |
| **Tiny** | Remainder | Color only (tooltip on hover) | 1×1 |

Vietnam sector treemap uses the same rank cutoffs per sector block (`SectorTreemap.tsx`).

## Height change

| | Before | After |
|---|--------|-------|
| Viewport class | `clamp(680px, calc(100svh - 200px), 920px)` + `min-h-[680px]` | `clamp(520px, calc(100svh - 260px), 680px)` + `max-h-[680px]` + `min-h-[480px]` |
| Typical desktop | 680–920px | 520–680px (target band 650–700px on 24" displays) |

File: `components/marketwall/heatmap.tsx` (`HEATMAP_VIEWPORT_CLASS`)

## Before / after usability notes

| Issue | Before | After |
|-------|--------|-------|
| Sidebar too narrow | ~25% capped at 360px | 22% of row, no artificial max-width shrink |
| Too many tiny US/Crypto tiles | 100 / 50 symbols, cap-weighted sort | 50 / 40 symbols, activity-weighted sort |
| Vietnam overcrowding | Up to 150 symbols | Top 80 by trading value, sector-grouped |
| Unreadable micro-text | Change % on all legacy tiles | Tiered hide: tiny = color only |
| Excessive black gaps | Tall viewport + sparse tiles | Shorter viewport + denser treemap columns |
| Scroll to VN analytics | Often required on 24" | Reduced heatmap height aims to keep analytics above fold |

## Files changed

| File | Change |
|------|--------|
| `app/page.tsx` | 78/22 grid; sidebar width constraints |
| `components/marketwall/heatmap.tsx` | Viewport height; legacy tier text |
| `components/heatmap/MarketHeatmap.tsx` | Client symbol limits |
| `components/heatmap/SectorTreemap.tsx` | Align tier cutoffs with main grid |
| `components/heatmap/HeatmapTile.tsx` | (unchanged — tiers already correct) |
| `config/heatmap-symbols.ts` | Display limit constants |
| `lib/market/heatmap-limits.ts` | **New** — shared sort/limit helpers |
| `lib/market/heatmap.ts` | API limits + VN trading-value sort |
| `lib/vietnam/sector-treemap-layout.ts` | Denser block grids; lower min flex |

## Verification

- [ ] Local build passed (`npm run build`)
- [ ] Desktop screenshot: sidebar ~22%, heatmap ~78%
- [ ] VN tab: ≤80 tiles, sector headers, no micro-text on smallest tiles
- [ ] US tab: ≤50 tiles, no unreadable labels
- [ ] Crypto tab: ≤40 tiles
- [ ] Vietnam analytics visible without scroll on 24" / 1440p
