# Heatmap Benchmark V2 — MarketWall vs D3 / Finviz-style OSS / TradingView

**Generated:** 2026-06-17  
**Reference commit:** `d21652c` baseline; polish pass on `main`  
**Validation:** `npm run build` · `npm run heatmap:debug` (all modes `layoutMaxAspectRatio < 10`)

---

## 1. D3 treemap (official squarify)

**Source:** [d3-hierarchy treemap](https://d3js.org/d3-hierarchy/treemap) — Bruls–Huizing–van Wijk squarified treemap; `d3.treemapSquarify` uses golden-ratio aspect target (φ ≈ 1.618).

| Aspect | D3 official | MarketWall (current) |
|--------|-------------|----------------------|
| **Sizing** | `root.sum(d => d.value)` — tile area ∝ raw metric after hierarchy aggregation | `metric → rawShare → power^p → normalize → cap loop → squarify` (`lib/treemap/treemap-builders.ts`) |
| **Power compression** | None — linear proportional | VN sector root **0.85**, VN stock in sector **0.75**, US/crypto **0.75** |
| **Max cap** | None | VN sector root **25%**, VN stock in sector **18%**, US/crypto flat **18%** |
| **Sorting** | `root.sort((a,b) => b.value - a.value)` before layout | Descending metric/weight before `packSquarified` |
| **Grouping** | Multi-level via `d3.hierarchy` children | VN mode 1: two-level sector → stock; US/crypto flat |
| **Typography** | None (SVG labels manual) | Tier thresholds by area share: large ≥4%, medium ≥1.5%, small ≥0.6% (`vietnam-sector-grid-layout.ts`) |
| **Color** | Not in core API | Signed % → piecewise RGB (`heatStyle` in `components/marketwall/shared.tsx`), clamp ±5% |

**Takeaway:** D3 is the algorithm reference for squarify; MarketWall adds deliberate compression/caps so mega-caps do not dominate as in raw D3 demos.

---

## 2. Finviz-style open-source heatmap

**Reference:** [iamaliybi/treemap-algorithm](https://github.com/iamaliybi/treemap-algorithm) — TypeScript squarify + golden ratio, TradingView/Finviz-inspired layout.

Related OSS treemaps cited in industry:
- [laserson/squarify](https://github.com/laserson/squarify) — Python; requires descending normalized sizes
- [armanfeyzi/Treemap-chart](https://github.com/armanfeyzi/Treemap-chart) — coin360-style crypto treemap

| Aspect | Finviz-style OSS pattern | MarketWall |
|--------|--------------------------|------------|
| **Sizing** | Linear `value` → squarify (see laserson: sizes must sum to container) | Power + cap pipeline (see above) |
| **Sector layout** | Often flat or 2-level sector blocks | VN: 10 FireAnt-aligned sector groups, **22px fixed header band** per block |
| **Color** | Performance % red/green diverging | Symmetric stops `[-5 … 0 … +5]` in `heatStyle`; VN sign fix via `signVnChangePercent` (VPS `changePc` is unsigned) |
| **Sorting** | Descending value before squarify | Same — metric desc, rank epsilon in `packSquarified` |
| **Leaders** | Natural from linear sizing | Subtle leader ring on VCB, FPT, VHM, VIC, HPG (`lib/heatmap/leader-symbols.ts`) |

**Finviz live product** ([NN/g treemap analysis](https://www.nngroup.com/articles/treemaps/)): area ∝ market cap (or volume toggle), GICS sector → industry hierarchy, no documented power cap.

---

## 3. TradingView heatmap widget

**Source:** [TradingView heatmap support](https://www.tradingview.com/support/solutions/43000766446-tradingview-heatmaps-from-global-trends-to-details/)

| Parameter | TradingView | MarketWall |
|-----------|-------------|------------|
| `blockSize` | Default `market_cap_basic`; area ∝ metric | VN mode 1: trading value; US: dollar volume; crypto: 24h volume |
| `blockColor` | Performance / custom field | `changePercent` → `heatStyle` (signed) |
| `grouping` | `"sector"` or `"no_group"` | VN sector-volume grouped; other VN modes flat |
| `isMonoSize` | Equal-area cells for color-only view | Not implemented |
| **Aspect** | Squarified treemap, sector nesting | Squarify + grid fallback when aspect > 6 (inner) / 10 (flat) |

**Typography (TV):** Labels scale with block size; hide on small cells. MarketWall tiers: symbol hidden on `tiny`, change on `large`/`medium` only.

---

## 4. MarketWall polish pass summary (this sprint)

| Task | Change | Files |
|------|--------|-------|
| Sector header overlap | Fixed **22px** header band; layout reserves `22/650` normalized; header `z-20` | `vietnam-sector-grid-layout.ts`, `VietnamSectorGridHeatmap.tsx` |
| Missing red stocks | VPS `changePc` unsigned → infer sign from price vs ref close | `lib/vietnam/vn-change-sign.ts`, `lib/market/heatmap-assets.ts` |
| Leader emphasis | White ring/border on index leaders | `lib/heatmap/leader-symbols.ts`, `HeatmapTile.tsx` |
| Resizable height | Default **650px**, min **500**, max **1500**, key `heatmap-height` | `hooks/useResizableHeight.ts`, `heatmap.tsx` |

**Exponent note:** VN stock in sector remains **0.75** (already raised from 0.55). No engine change in this pass; `heatmap:debug` aspects remain < 10.

---

## 5. Red stocks root cause (Task 2)

| Item | Detail |
|------|--------|
| **Source file** | `lib/adapters/vietnam/vps-adapter.ts` (upstream), fix in `lib/market/heatmap-assets.ts` |
| **Root cause** | VPS field `changePc` is **magnitude-only** (always ≥ 0). Down days (e.g. FPT last < ref close) still received positive `changePercent`, so `heatStyle` mapped them to green. |
| **Fix** | `signVnChangePercent(price, unsignedPct)` compares implied reference prices for ±sign and picks the match with correct magnitude (`lib/vietnam/vn-change-sign.ts`). Applied when converting API rows to `MarketAsset`. |
| **Color scale** | `heatStyle` already uses symmetric domain `[-5, …, 0, …, +5]` — no `Math.abs` on input. |

---

## 6. Aspect table (post-polish)

Run: `npm run heatmap:debug` (2026-06-17, branch `main`, live@127.0.0.1:3000)

| Mode | layoutMaxAspectRatio | Accept (< 10) |
|------|---------------------|---------------|
| VN sector-volume | **6.891** | ✓ |
| VN market-cap | **6.790** | ✓ |
| VN foreign-flow | **5.749** | ✓ |
| VN proprietary-flow | **6.714** | ✓ |
| US dollar volume | **2.852** | ✓ |
| Crypto 24h volume | **8.494** | ✓ |

Sector count: **9** (no Khác bucket). Top-left tile y ≈ **0.0348** (= 22px header band at 650px viewport).

---

## 7. Screenshots

| Path | Description |
|------|-------------|
| `docs/heatmap-polish-before-sector-header.png` | Pre-fix: sector titles overlapped by tiles |
| `docs/heatmap-polish-after-sector-header.png` | Post-fix: 22px header band visible |
| `docs/heatmap-polish-after-red-stocks.png` | Post-fix: red tiles on down names |
| `docs/heatmap-polish-after-leaders.png` | Post-fix: VCB/FPT/VHM/VIC/HPG ring emphasis |

---

## 8. Production

**URL:** https://btrading.org

**Constraints preserved:** `lib/treemap/squarify.ts` unchanged · sector ordering unchanged · Khác bucket not rendered · adapters not modified (sign fix at asset conversion layer).
