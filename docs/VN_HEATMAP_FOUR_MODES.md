# VN Heatmap — Four Modes

Sprint heatmap-rewrite: four Vietnam heatmap display modes with sector treemap (mode 1) and flat squarified treemaps (modes 2–4).

## Files changed

| File | Change |
|------|--------|
| `lib/vietnam/vn-heatmap-modes.ts` | **New** — mode type, metric getters, `buildFlatVnTreemapLayout` |
| `components/heatmap/VietnamFlatTreemap.tsx` | **New** — flat treemap renderer for modes 2–4 |
| `components/heatmap/MarketHeatmap.tsx` | Route VN by `vnMode`; sector vs flat paths |
| `components/marketwall/heatmap.tsx` | VN controls: 4 mode pills (replaces sector/cap + GTGD sizing pills) |
| `lib/market/heatmap-limits.ts` | Sort/limit by `VnHeatmapMode` |
| `lib/i18n.tsx` | Labels for four mode pills |
| `docs/VN_HEATMAP_FOUR_MODES.md` | This report |

Unchanged (reused as-is):

- `lib/vietnam/vietnam-sector-grid-layout.ts` — Sprint 36B two-level squarify for mode 1
- `components/heatmap/VietnamSectorGridHeatmap.tsx` — sector treemap UI
- `components/heatmap/HeatmapTile.tsx` — color tiers unchanged
- `lib/treemap/heatmap-engine.ts` — `capLeafWeights`, `tileSizeFromRect`

## Modes implemented

| Mode | Pill (VI) | Layout | Grouping |
|------|-----------|--------|----------|
| `sector-volume` | Ngành cổ phiếu | Two-level squarified treemap | Sectors at root, stocks inside |
| `market-cap` | Vốn hóa | Flat squarified treemap | None |
| `foreign-flow` | Nước ngoài | Flat squarified treemap | None |
| `proprietary-flow` | Tự doanh | Flat squarified treemap | None |

## Metric per mode

| Mode | Tile size metric | Notes |
|------|------------------|-------|
| `sector-volume` | `volumeShares ?? lot×10` | sqrt weighting inside sectors; sector blocks blended by sector volume + importance |
| `market-cap` | `marketCap` | sqrt via `capLeafWeights` |
| `foreign-flow` | \|net foreign value\| VND | `foreignNetValue` → `foreignBuyValue − foreignSellValue` → shares × price |
| `proprietary-flow` | \|net proprietary value\| | **No per-symbol fields on `MarketAsset` / `HeatmapAsset`** — metric returns 0 |

Tile **color** remains `heatStyle(changePercent)` on all modes.

## Sprint 36B reuse

**Reused** for mode 1 (`sector-volume`):

- `buildVietnamSectorTreemapLayout` in `lib/vietnam/vietnam-sector-grid-layout.ts`
- Root sector squarify + per-sector inner squarify with sqrt(volume) caps
- Metric switched from default GTGD (`tradingValue`) to **volume** by passing `sizing="volume"` into the sector builder (uses `assetSizeMetric` volume branch)

**New** for modes 2–4:

- `buildFlatVnTreemapLayout` / `buildFlatVnTreemapLayoutForMode` in `vn-heatmap-modes.ts`
- Shared `capLeafWeights` + `squarify` from existing treemap stack

## Data limitations

| Field | Used in | Availability |
|-------|---------|--------------|
| `volumeShares`, `volume` (VPS lots) | sector-volume | VPS live overlay |
| `marketCap` | market-cap | Heatmap API seed |
| `foreignNetValue`, `foreignBuyValue`, `foreignSellValue` | foreign-flow | VPS overlay when present |
| `foreignBuy`, `foreignSell`, `foreignNet` (shares) | foreign-flow fallback | VPS overlay |
| `proprietaryBuy`, `proprietarySell`, proprietary net | proprietary-flow | **Not on heatmap row types** — EOD proprietary is analytics/DB only (Sprint 26) |

When proprietary per-symbol data is added to `HeatmapAsset` / `MarketAsset`, extend `vnProprietaryFlowMetric` in `vn-heatmap-modes.ts` only (no API changes required in this sprint).

When all proprietary metrics are zero, flat treemap falls back to uniform minimum tile weights (equal-sized tiles).
