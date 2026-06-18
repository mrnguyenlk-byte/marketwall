# Heatmap Benchmark Report — MarketWall vs Finviz / TradingView / D3

**Generated:** 2026-06-17  
**Scope:** Research only — no code changes implemented.  
**Debug run:** `npm run heatmap:debug` against `live@http://127.0.0.1:3000`

---

## CURRENT (MarketWall)

### Architecture overview

| Market | Component | Layout builder | Grouping |
|--------|-----------|----------------|----------|
| US | `FinvizTreemap` | `buildFlatMarketHeatmapLayout` | Flat (no sector UI) |
| Crypto | `FinvizTreemap` | `buildFlatMarketHeatmapLayout` | Flat |
| VN mode 1 | `VietnamSectorGridHeatmap` | `buildSectorGroupedTreemap` | 10 FireAnt-style sector groups |
| VN modes 2–4 | `VietnamFlatTreemap` | `buildFlatVnTreemapLayoutForMode` | Flat |

Entry point: `MarketHeatmap.tsx` routes by `marketType` and `vnMode`.

Display limits (`config/heatmap-symbols.ts`): VN 200, US 40, Crypto 50 symbols (sorted by metric before slice).

---

### Weight formula

**Pipeline (all modes):**  
`metric → rawShare → power compress → normalize → cap loop → sort → squarify`

#### Step 1 — Raw share

```
rawShare_i = metric_i / Σ(metric_j)   where metric_j > 0
```

Invalid metrics (`≤ 0`) are excluded from normalization entirely (not given minimum weight).

#### Step 2 — Power compression

```
compressedShare_i = rawShare_i ^ power
weight_i = compressedShare_i / Σ(compressedShare_j)
```

| Context | Constant | Power |
|---------|----------|-------|
| VN sector root | `TREEMAP_COMPRESSION_POWER.VN_SECTOR_ROOT` | **0.65** |
| VN stock within sector | `TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR` | **0.55** |
| VN flat market-cap | `TREEMAP_COMPRESSION_POWER.VN_MARKET_CAP_FLAT` | **0.65** |
| VN flat flow modes | `TREEMAP_COMPRESSION_POWER.VN_FLOW_FLAT` | **0.55** |
| US dollar volume | `TREEMAP_COMPRESSION_POWER.US_DOLLAR_VOLUME` | **0.75** |
| Crypto 24h volume | `TREEMAP_COMPRESSION_POWER.CRYPTO_VOLUME` | **0.75** |
| Default fallback | `TREEMAP_COMPRESSION_POWER.DEFAULT` | **0.75** |

Power `< 1` compresses large-cap dominance (sqrt-like when power = 0.5; here 0.55–0.75).

#### Step 3 — Cap and redistribution loop

```
if weight_i > maxShare:
  weight_i = maxShare
  excess += (old_weight_i - maxShare)
redistribute excess proportionally to uncapped items
repeat up to 50 iterations (DEFAULT_MAX_CAP_ITERATIONS)
```

| Context | Constant | Max share |
|---------|----------|-----------|
| US / Crypto flat leaf | `MAX_ITEM_AREA_SHARE` | **18%** |
| VN flat leaf (modes 2–4) | `VN_MAX_ITEM_AREA_SHARE` | **12%** |
| VN sector root (grouped mode) | `VN_SECTOR_ROOT_MAX_SHARE` in `vietnam-sector-grid-layout.ts` | **36%** |
| VN stock within sector | `MAX_STOCK_AREA_SHARE_IN_SECTOR` | **12%** |
| Deprecated grouped builder | `MAX_SECTOR_AREA_SHARE` in `treemap-builders.ts` | **18%** (not used by VN sector grid) |

**Khác bucket (defined but NOT wired):**

```
MIN_VISIBLE_SHARE = 0.0025   (0.25%)
KHAC_MAX_SHARE    = 0.12     (12%)
```

`splitKhacBucket()` exists in `treemap-builders.ts` but is **never called** by any layout path. Tiny symbols remain as individual tiles.

#### Step 4 — Rank epsilon (ordering tie-break before squarify)

In `packSquarified`:

```
value_i = max(weight_i, MIN_VALUE) + (n - index) * 1e-12
```

Preserves pre-sort rank when weights tie.

---

### Sector formula (VN grouped mode)

**Group resolution** (`vn-sector-map.ts` → `sector-groups.ts`):

1. Provider sector label (if valid and maps to a known group)
2. Else `VN_SYMBOL_TO_SECTOR` explicit map (~150 symbols)
3. Else seed universe map (HOSE/HNX/UPCOM)
4. Else `"Chưa phân loại"` → `unclassified`

**Invalid provider labels** (treated as unmapped): `""`, `"Khác"`, `"Other"`, `"Equity"`, `"UNKNOWN"`, etc.

**Merges (FireAnt-style, not GICS):**

| Source sectors | Target group |
|----------------|--------------|
| Banking, Brokerage, Securities, Insurance | `banking` (Tài chính) |
| Materials, Chemicals | `steel` (Vật liệu cơ bản) |
| Logistics, Transport, Construction, Textile | `industrial` |
| Agriculture, Healthcare | `consumer` |
| Khác / Other | `unclassified` |

**Sector inclusion filter:**

```
include unclassified only if sectorMetric / totalMetric ≥ MIN_UNCLASSIFIED_ROOT_SHARE (0.003 = 0.3%)
```

**Root sector weight:** sum of `vnTradingValueMetric` per group, then same power/cap pipeline with power **0.65**, cap **36%**.

**Inner stock weight:** per-sector `tradingValue`, power **0.55**, cap **12%**.

**Header reservation:** `min(max(sectorH × 0.07, 18/1080), 22/1080)` — label hidden if sector rect too small.

**Gap between sectors/tiles:** `SECTOR_GAP = 0.002` (0.2% normalized).

---

### Ordering formula

| Stage | Sort key |
|-------|----------|
| Asset limit (pre-layout) | Metric descending (`limitHeatmapAssets`) |
| Before normalize | Metric descending |
| After normalize | Weight descending, tie-break metric descending |
| Inside `squarify()` | Value descending (re-sorted) |
| Layout reading order | Top-left → bottom-right by `(rect.y, rect.x)` |
| `packSquarified` rank epsilon | `(n - index) × 1e-12` added to value |

Squarify row building uses Bruls `worst()` ratio — greedy row extension while aspect improves.

---

### Layout algorithm

**Primary:** Bruls–Huizing–van Wijk squarified treemap (`lib/treemap/squarify.ts`)

- Rows placed along **shorter side** of remaining rectangle
- Values normalized to pixel area: `value × (containerArea / total)`
- `minValue = 0.0001` floor on leaf values

**Fallbacks (`packSquarified` in `treemap-builders.ts`):**

| Condition | Fallback |
|-----------|----------|
| `worstAspect > FLAT_ASPECT_FALLBACK_LIMIT (10)` | `weightedBalancedGridFallback` (weight-proportional bands) |
| Crypto flat | `forceWeightedFallback: true` — always prefer weighted grid if squarify aspect > limit |
| `worstAspect > HARD_ASPECT_LIMIT (6)` AND metrics invalid | `balancedGridFallback` (equal-size grid) |
| VN sector inner (`vietnam-sector-grid-layout.ts`) | If inner aspect > **6**, switch to equal grid fallback |

**VN sector inner note:** Single-item squarify fills 100% of inner rect regardless of capped weight — cap is bypassed visually for lone stocks in a sector.

---

### Debug reference numbers (2026-06-17, live data)

#### VN sector grouped (mode 1, 200 symbols)

| Metric | Value |
|--------|-------|
| Sectors shown | 9 |
| Total trading value | 14.52T |
| Invalid metrics | 18 |
| Top raw sector | banking 6.69T (46% of total) |
| Top normalized sector shares (debug uses 18% constant*) | banking/realEstate/industrial each 18% |
| **Actual layout sector area** | banking **32.03%**, realEstate 17.32% |
| maxInnerTileShare (layout) | **38.00%** (CMR in consumer — exceeds 12% cap) |
| maxSectorAspect | 5.751 |
| maxStockAspect | 5.672 |
| layoutMaxAspectRatio | 5.751 |
| Top-left sector | banking (Tài chính) |
| Sample banking top share | SHB 5.83% of sector inner |

\*Debug script `analyzeSectorMode` uses `MAX_SECTOR_AREA_SHARE` (18%) not production `VN_SECTOR_ROOT_MAX_SHARE` (36%).

#### VN flat modes (200 symbols each)

| Mode | maxTileShare | worstTile aspect | layoutMaxAspect | Notes |
|------|-------------|------------------|-----------------|-------|
| market-cap | 3.24% (VCB) | 4.593 (THS) | 4.593 | Very flat — power 0.65 + 12% cap |
| foreign-flow | 5.27% (VHM) | **8.803** (VIC) | **8.803** | 65 invalid metrics |
| proprietary-flow | **18.00%** (TCB) | 6.083 (TAL) | 6.083 | 124 zero metrics → **76 tiles only** |

#### US (40 symbols, dollar volume)

| Metric | Value |
|--------|-------|
| maxTileShare | 9.00% (NVDA) |
| layoutMaxAspectRatio | 2.852 |
| Top shares | NVDA 9%, MSFT 8.85%, AAPL 8.58% |

#### Crypto (50 symbols, 24h volume)

| Metric | Value |
|--------|-------|
| maxTileShare | **18.00%** (BTC, ETH, XAUT — triple cap hit) |
| layoutMaxAspectRatio | 7.965 |
| worstTile | SHIB aspect 7.965, share 0.01% |

---

## BENCHMARK

| Aspect | Finviz (Map of the Market) | TradingView (Stock Heatmap) | Open-source D3 |
|--------|---------------------------|----------------------------|----------------|
| **Weight normalization** | **Linear / proportional** — tile area ∝ market cap (or volume when toggled). No documented power compression or artificial caps. | **Linear / proportional** — `blockSize` metric (default `market_cap_basic`) maps directly to cell area. Optional `isMonoSize` for equal-area cells. | **`node.sum(value)`** — D3 hierarchy sums values; area proportional to input. Optional `normalize_sizes()` in Python squarify lib scales to container. No caps. |
| **Sector grouping** | **3-level GICS hierarchy:** S&P 500 → Sector → Industry → Stock. Financials keeps distinct sub-industries. | **`grouping: "sector"`** (default for SPX500) or `"no_group"`. Sector block size ∝ sum of child metrics. Drill-down into sector on click. | **2-level typical:** Sector → Stock (e.g. Mike Bostock zoomable treemap, Medium 2017 stock heatmap). Hierarchy via `d3.hierarchy` + `root.sum()`. |
| **Ordering** | Squarified; largest market caps placed first (top-left bias). Descending value sort before layout. | Squarified treemap; largest blocks top-left within group. Stable under `treemapResquarify` for animation. | **`root.sort((a,b) => b.value - a.value)`** before `treemap(root)`. Descending required by squarify implementations. |
| **Max cap** | **None documented.** NVDA ~7% of S&P 500 displays at ~7% area. Mega-caps dominate naturally. | **None documented.** Largest symbol in index can occupy large fraction of viewport. | **None.** Proportional sizing only. |
| **Treemap algorithm** | Squarified (Bruls et al.) — industry standard reference implementation. | Squarified treemap widget (closed source, documented as treemap with sector nesting). | **`d3.treemapSquarify`** — Bruls algorithm, golden-ratio aspect target (φ ≈ 1.618). Alternative tilings: binary, slice, dice, slice-dice. |

### Additional benchmark notes

**Finviz**
- Color = performance (daily / period change %)
- Size default = market capitalization for S&P 500, Nasdaq 100, etc.
- Known visual trait: Technology sector block is large because sum of market caps is large — not because of artificial cap
- Reference: [NN/g Finviz treemap analysis](https://www.nngroup.com/articles/treemaps/)

**TradingView**
- Widget params: `blockSize`, `blockColor`, `grouping`, `isMonoSize`
- Documented modes: classic grouped, classic flat, mono-size grouped, mono-size flat
- Size and grouping are independent — e.g. relative volume coloring with market-cap sizing
- Reference: [TradingView heatmap support](https://www.tradingview.com/support/solutions/43000766446-tradingview-heatmaps-from-global-trends-to-details/)

**Open-source D3 references**
- [d3-hierarchy treemap](https://d3js.org/d3-hierarchy/treemap) — official squarify with golden ratio
- [laserson/squarify](https://github.com/laserson/squarify) — Python; requires descending normalized sizes
- [iamaliybi/treemap-algorithm](https://github.com/iamaliybi/treemap-algorithm) — TypeScript squarify + golden ratio, TradingView-inspired
- [armanfeyzi/Treemap-chart](https://github.com/armanfeyzi/Treemap-chart) — coin360-style crypto treemap
- Common pattern: raw metric → hierarchy sum → sort desc → squarify — **no power transform, no cap**

---

## GAPS

### vs Finviz

1. **Power compression (0.55–0.75)** — MarketWall deliberately flattens mega-cap dominance. Finviz shows NVDA at natural ~7%+ of S&P; MarketWall US caps NVDA at **9%** and compresses with power 0.75. Visual: US heatmap looks more uniform than Finviz.
2. **Artificial area caps (12–18%)** — Finviz has no cap. MarketWall hits **18% cap** on BTC/ETH/XAUT simultaneously in crypto, distorting relative sizes among top 3.
3. **US sizing metric** — MarketWall defaults to **dollar volume**, Finviz defaults to **market cap**. Liquidity-first sizing changes tile order and proportions vs Finviz Map of the Market.
4. **No sector grouping for US/Crypto** — Finviz uses sector → industry hierarchy. MarketWall US/Crypto are flat single-level treemaps.
5. **VN sector merges** — Securities + Insurance → Banking differs from Finviz/GICS where brokers and insurers are separate industries under Financials.

### vs TradingView

1. **VN flat 12% cap vs TV uncapped** — TradingView allows dominant VCB/VHM to visually lead; MarketWall VN market-cap mode maxes at **3.24%** per tile.
2. **Proprietary/foreign sparse data** — 124/200 zero proprietary metrics → only **76 tiles** rendered; TradingView would still show mono-size or min-size cells for missing data modes.
3. **`forceWeightedFallback` on crypto** — TradingView stays on squarified treemap; MarketWall may switch to band grid, changing visual texture.
4. **No mono-size mode** — TradingView offers equal-area mode for pure color comparison; MarketWall has no equivalent.

### vs Open-source D3

1. **Pre-layout weight manipulation** — D3 expects `sum()` on raw values. MarketWall adds power + cap + redistribution — non-standard.
2. **`splitKhacBucket` unused** — D3 demos often aggregate small leaves; MarketWall defines Khác constants but never aggregates.
3. **Single-leaf squarify fills 100%** — Standard squarify behavior, but combined with 12% cap creates misleading area (e.g. **38% inner share** for CMR).
4. **Debug/reporting drift** — `heatmap-debug-report.ts` analyzes sector root at 18% cap; production layout uses **36%**.

### Likely causes of visual imbalance (priority)

| Symptom | Likely cause |
|---------|--------------|
| VN flat modes look uniform / no clear leaders | Power **0.55–0.65** + **12% cap** on 200 symbols |
| Crypto top 3 similar size | Triple **18% cap** on BTC/ETH/XAUT |
| Banking sector not dominant enough vs FireAnt | Root power **0.65** + previously 18% cap (now 36% but still compressed) |
| VN sector inner tiles too equal | Stock power **0.55** — strongest flattening in codebase |
| Foreign-flow aspect spikes (8.8) | Sparse valid metrics + squarify on 135 tiles with heavy tail |
| Tiny crypto alts as slivers (SHIB aspect 8.0) | No Khác aggregation; squarify creates thin rectangles for 0.01% shares |

---

## PROPOSED CODE CHANGES (exact, not implemented)

Prioritized to align with Finviz/FireAnt while keeping `layoutMaxAspectRatio < 10`.

---

### P1 — Reduce VN inner stock compression (highest visual impact)

**File:** `lib/treemap/treemap-builders.ts`  
**Function/constant:** `TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR`  
**Change:** `0.55` → `0.75` (or `1.0` for true Finviz-like proportional sizing within sectors)

**Justification:** Power 0.55 is the most aggressive flattening step. Finviz/D3 use linear weights at leaf level. Debug shows banking top stocks clustered at 4–6% each; FireAnt shows clearer leaders within Tài chính.

**Risk guard:** Re-run `npm run heatmap:debug`; verify `maxStockAspect ≤ 10`. If aspect exceeds limit, keep `packSquarified` fallback at 10 (already in place for flat modes; add same threshold to `layoutSectorTreemap` in `vietnam-sector-grid-layout.ts`).

---

### P2 — Raise VN flat cap to match US/FireAnt headroom

**File:** `lib/treemap/treemap-builders.ts`  
**Constant:** `VN_MAX_ITEM_AREA_SHARE`  
**Change:** `0.12` → `0.18`

**Justification:** Finviz/TradingView uncapped; US/Crypto already at 18%. VN market-cap max tile is only **3.24%** — leaders are visually underrepresented. 18% aligns cross-market behavior.

**Alternative (mode-specific):** In `lib/vietnam/vn-heatmap-modes.ts` → `buildFlatVnTreemapLayout`, pass `maxShare: 0.18` only for `market-cap` mode; keep 12% for flow modes with spiky outliers (proprietary TCB at 18%).

---

### P3 — Wire Khác bucket for tiny VN flat leaves

**File:** `lib/treemap/treemap-builders.ts`  
**Function:** `buildFlatMetricTreemap`  
**Change:** After `normalizeTreemapWeights`, call:

```typescript
const { items, khac } = splitKhacBucket(normalized, {
  minVisibleShare: MIN_VISIBLE_SHARE,
  khacMaxShare: KHAC_MAX_SHARE,
})
```

Append synthetic Khác leaf (if `khac` present) with combined weight before `packSquarified`. Requires extending tile renderer to show "Khác" aggregate tile.

**Justification:** Finviz hides or groups sub-threshold symbols. D3 treemap best practice aggregates small leaves. Eliminates SHIB-style slivers (aspect 7.965) and foreign-flow thin tiles.

---

### P4 — US default sizing: add market-cap option aligned with Finviz

**File:** `lib/treemap/heatmap-engine.ts`  
**Function:** `defaultSizing("us")`  
**Change:** Return `"marketCap"` instead of `"dollarVolume"`, OR expose both in UI and default to `"marketCap"`.

**Justification:** Finviz Map of the Market sizes by market cap. Current US debug: NVDA 9% vs natural ~7% mcap share — close but metric chain differs. Aligning default removes cross-benchmark confusion.

**If keeping liquidity default:** Lower `TREEMAP_COMPRESSION_POWER.US_DOLLAR_VOLUME` from `0.75` → `1.0` when Finviz comparison is desired.

---

### P5 — VN sector root: reduce compression, keep 36% cap

**File:** `lib/vietnam/vietnam-sector-grid-layout.ts`  
**Constant:** power in `normalizeTreemapWeights` call inside `layoutRootSectors`  
**Change:** Use `TREEMAP_COMPRESSION_POWER.VN_SECTOR_ROOT` value `0.65` → `0.85` or `1.0`

**Justification:** Banking is 46% of raw trading value but only **32%** layout area. FireAnt gives Tài chính a dominant left column. Linear root weighting with 36% cap (already raised from 18%) better matches FireAnt while cap prevents single-sector monopolization.

---

### P6 — Fix single-leaf cap bypass in sector inner layout

**File:** `lib/vietnam/vietnam-sector-grid-layout.ts`  
**Function:** `layoutSectorTreemap`  
**Change:** When `baseItems.length === 1`, scale inner rect or inject dummy zero-weight placeholder siblings so squarify respects capped weight; OR clamp rendered rect to `weight × innerArea` centered in inner rect.

**Justification:** Debug `maxInnerTileShare: 38%` proves cap is ineffective for sparse sectors. Finviz never shows a lone small stock filling an entire industry block.

---

### P7 — Crypto: conditional weighted fallback

**File:** `lib/treemap/heatmap-engine.ts`  
**Function:** `buildFlatMarketHeatmapLayout`  
**Change:** Remove `forceWeightedFallback: true` for crypto; rely on default `aspectFallbackLimit: 10` (only fallback when squarify aspect > 10).

**Justification:** TradingView/D3 stay on squarify. Forced grid changes layout character. Debug crypto `layoutMaxAspectRatio: 7.965` — already under 10, so squarify would be used anyway once force flag removed.

---

### P8 — Align debug script with production constants

**File:** `scripts/heatmap-debug-report.ts`  
**Function:** `analyzeSectorMode`  
**Change:** Import and use `VN_SECTOR_ROOT_MAX_SHARE` from `vietnam-sector-grid-layout.ts` (0.36) instead of `MAX_SECTOR_AREA_SHARE` (0.18).

**Justification:** Report accuracy. Current debug underreports sector headroom and misleads cap analysis.

---

### P9 — Optional: split Securities from Banking

**File:** `lib/vietnam/sector-groups.ts`  
**Change:** Re-add `securities` group; map `Brokerage`, `Securities` → `securities` instead of `banking`. Update `VN_SECTOR_GROUP_ORDER`.

**Justification:** Finviz/GICS keep brokers separate from banks. Current merge inflates Tài chính block and changes sector balance vs FireAnt reference screenshots (verify against latest FireAnt before implementing).

**Risk:** May increase sector count and reduce per-sector tile space — test aspect ratios.

---

### Change priority matrix

| Priority | Change | Files | Expected effect | Aspect risk |
|----------|--------|-------|-----------------|-------------|
| **P1** | VN stock power 0.55 → 0.75 | `treemap-builders.ts` | Clearer leaders within sectors | Low–medium |
| **P2** | VN flat cap 12% → 18% | `treemap-builders.ts`, `vn-heatmap-modes.ts` | VN mcap/flow leaders visible | Low |
| **P3** | Wire Khác bucket | `treemap-builders.ts`, tile component | Remove thin slivers | Reduces max aspect |
| **P4** | US default market cap | `heatmap-engine.ts` | Finviz parity | None |
| **P5** | VN root power 0.65 → 0.85 | `vietnam-sector-grid-layout.ts` | Banking column dominance | Low |
| **P6** | Single-leaf cap fix | `vietnam-sector-grid-layout.ts` | Fix 38% inner anomaly | None |
| **P7** | Remove crypto force fallback | `heatmap-engine.ts` | Squarify texture | None (aspect < 10) |
| **P8** | Debug script cap fix | `heatmap-debug-report.ts` | Reporting only | None |
| **P9** | Split securities group | `sector-groups.ts`, `vn-sector-map.ts` | GICS-like fidelity | Medium |

---

## Appendix — Key file map

| File | Role |
|------|------|
| `lib/treemap/squarify.ts` | Bruls squarify + `squarifyGroups` |
| `lib/treemap/treemap-builders.ts` | Weight pipeline, caps, fallbacks |
| `lib/treemap/heatmap-engine.ts` | US/Crypto metrics and flat layout |
| `lib/vietnam/vietnam-sector-grid-layout.ts` | VN mode 1 grouped treemap |
| `lib/vietnam/vn-heatmap-modes.ts` | VN modes 2–4 flat treemap |
| `lib/vietnam/vn-sector-map.ts` | Symbol → sector resolution |
| `lib/vietnam/sector-groups.ts` | Sector → group mapping |
| `components/heatmap/MarketHeatmap.tsx` | Router |
| `components/heatmap/VietnamSectorGridHeatmap.tsx` | VN grouped renderer |
| `components/heatmap/HeatmapTile.tsx` | Shared tile UI |
| `scripts/heatmap-debug-report.ts` | Layout diagnostics |
