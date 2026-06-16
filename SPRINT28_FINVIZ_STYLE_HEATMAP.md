# Sprint 28 — Finviz-Style Heatmap Engine

## Goal

Replace the row-based sector heatmap with a **packed squarified treemap** (Finviz-style): tight grouping, size-by-metric, color-by-change, rich tooltips, zoom/pan, and per-market controls — using MarketWall providers only (no Finviz scraping).

## Treemap algorithm

**Squarified treemap** (Bruls–Huizing–van Wijk), implemented in `lib/treemap/squarify.ts`:

1. Sort items by descending weight.
2. Greedily grow a row while the aspect-ratio penalty (`worst()`) improves.
3. Lay out the row along the long edge of the remaining rectangle.
4. Repeat until all items are placed.

**Hierarchy** (`lib/treemap/heatmap-engine.ts`):

| Market | Grouping modes | Hierarchy |
|--------|----------------|-----------|
| Vietnam | Sector, Market Cap | Sector → Stock; Sector → Industry → Stock when `industry` exists |
| US | Sector, Industry, Market Cap | Sector → Industry → Stock |
| Crypto | Category, Market Cap | Category → Coin |

`buildHeatmapTreemapLayout()` partitions the unit square among groups via `squarify`, then `squarifyGroups()` lays out leaves inside each group (with a small header band). US sector mode uses a two-level squarify: sectors first, industries second.

**Tile text tiers** (`tileSizeFromRect`): area ≥ 3.5% → large (symbol + change + price); ≥ 1.2% → medium; ≥ 0.35% → small; else tiny (tooltip only).

## Before / after layout

### Before (Sprint 23–27)

- Vietnam sector view: **one sector = one horizontal flex row** (`SectorTreemap.tsx` + `sector-treemap-layout.ts`).
- US / Crypto: flat CSS grid with rank-based spans.
- Significant **gutter / empty space** between sector rows and uneven tile packing.

### After (Sprint 28)

- All markets render via **`FinvizTreemap.tsx`** + squarify engine.
- Sector/category blocks **pack edge-to-edge** in the viewport.
- Group labels overlay block headers; tiles use **absolute % positioning** from layout rects.
- **Zoom/pan**: Ctrl/Cmd + wheel, +/- buttons, drag when zoomed > 100%, reset control.

### Screenshots (capture locally)

| View | Path to capture |
|------|-----------------|
| Before (VN rows) | Git: `components/heatmap/SectorTreemap.tsx` @ pre-Sprint-28 |
| After VN sector | Dashboard → Heatmap → 🇻🇳 → Grouping: Sector |
| After US sector→industry | Dashboard → Heatmap → 🇺🇸 → Grouping: Sector |
| After Crypto category | Dashboard → Heatmap → ₿ → Grouping: Category |

> Run `npm run dev`, open `http://localhost:3000`, screenshot the center heatmap panel at 1440×900.

### Empty-space reduction

| Layout | Approx. packing |
|--------|-----------------|
| Row-based sector blocks | ~15–25% dead space (row gaps, uneven row heights) |
| Squarified treemap | ~0–2% (1px borders + group header bands only) |

Squarify minimizes worst tile aspect ratio, so large caps get wide rectangles and small caps fill gaps — similar visual density to Finviz.

## Sizing & color defaults

| Market | Default size metric | Color |
|--------|---------------------|-------|
| Vietnam | Trading Value (`price × volumeShares`) | Daily % change |
| US | Market Cap | Daily % change |
| Crypto | 24h Volume | 24h % change |

## Controls

| Market | Grouping | Sizing |
|--------|----------|--------|
| Vietnam | Sector / Market Cap | Trading Value / Volume / Market Cap |
| US | Sector / Industry / Market Cap | Market Cap / Dollar Volume |
| Crypto | Category / Market Cap | 24h Volume / Market Cap |

## Display limits

| Market | Max tiles |
|--------|-----------|
| Vietnam | 80 |
| US | 40 |
| Crypto | 30 |

## Interaction

- **Hover**: symbol, name, price, change %, volume, trading value (VN), market cap, sector, industry (when present).
- **Click**: opens stock detail modal via `openAsset()` — no navigation, no new tab.

## Layout preserved

- Stable 3-column dashboard (left sidebar / center heatmap / right panel).
- Banners and right panel unchanged.

## Files changed

| File | Change |
|------|--------|
| `lib/treemap/squarify.ts` | Squarify + squarifyGroups (existing, used by engine) |
| `lib/treemap/heatmap-engine.ts` | Layout builder, sizing metrics, VN/US hierarchy, tile tiers |
| `components/heatmap/FinvizTreemap.tsx` | **New** — treemap render, zoom/pan |
| `components/heatmap/MarketHeatmap.tsx` | Route all markets through FinvizTreemap |
| `components/heatmap/HeatmapTile.tsx` | Absolute rect positioning, richer tooltip |
| `components/marketwall/heatmap.tsx` | Per-market grouping/sizing controls |
| `config/heatmap-symbols.ts` | US limit 40, Crypto limit 30 |
| `lib/market/heatmap-limits.ts` | US default sort by market cap |
| `lib/market/heatmap.ts` | US sector/industry fields, crypto categories |
| `lib/market/us-sector-groups.ts` | **New** — broad US sector mapping |
| `lib/market/crypto-categories.ts` | **New** — crypto category labels |
| `lib/market/heatmap-assets.ts` | Pass `industry` to MarketAsset |
| `types/market.ts` | `industry` on MarketAsset |
| `lib/i18n.tsx` | Industry, category, dollar volume labels |

**Deprecated (unused by main heatmap):** `SectorTreemap.tsx`, `sector-treemap-layout.ts` — kept for reference; can be removed in a future cleanup.

## Build result

```
npm run build
✓ Compiled successfully
✓ TypeScript passed
[heatmap:us] items=40 livePrices=0 source=mock
Exit code: 0
```

## Verification checklist

- [ ] VN sector treemap packs without horizontal sector rows
- [ ] US sector shows Technology → Semiconductors nesting
- [ ] Crypto groups by Layer 1 / DeFi / Stablecoin etc.
- [ ] Tile click opens modal only
- [ ] Zoom +/- and Ctrl+wheel work in heatmap viewport
- [ ] Limits: 80 VN / 40 US / 30 Crypto visible tiles
