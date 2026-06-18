# Heatmap Regression Audit

**Date:** 2026-06-17  
**Branch audited:** `main`  
**Production:** https://btrading.org  
**Audit script:** `scripts/heatmap-regression-audit.ts`

---

## Symptoms

- Only ~5–10 stocks visible on the VN sector heatmap; most sector area appears as empty black space
- Expected 100+ stocks across sectors; production appears to show **~10 total** (VN index leaders only)
- Heatmap feels slower than prior build (layout itself is fast — see Profile section; perceived slowness likely from sparse visual + resize hook changes in the same deploy)

---

## Stock count table (production API)

Source: `HEATMAP_API_BASE=https://btrading.org npx tsx scripts/heatmap-regression-audit.ts`  
API: 200 raw items → 200 after `limitHeatmapAssets` (VN limit 200)

| Sector (VI) | stockCountInput | stockCountAfterWeight | stockCountRendered | Leaders in layout |
|---|---:|---:|---:|---:|
| Tài chính (banking) | 57 | 56 | 56 | 6 |
| Công nghiệp (industrial) | 41 | 33 | 33 | 0 |
| Bất động sản (realEstate) | 32 | 30 | 30 | 2 |
| Hàng tiêu dùng cơ bản (retail) | 25 | 23 | 23 | 0 |
| Năng lượng (oilGas) | 17 | 15 | 15 | 0 |
| Vật liệu cơ bản (steel) | 13 | 13 | 13 | 1 |
| Hàng tiêu dùng (consumer) | 5 | 5 | 5 | 0 |
| Công nghệ (technology) | 5 | 4 | 4 | 1 |
| Các dịch vụ hạ tầng (utilities) | 4 | 3 | 3 | 0 |
| **TOTAL (9 sectors rendered)** | **199** | **182** | **182** | **10** |

**Excluded:** `unclassified` sector (below `MIN_UNCLASSIFIED_ROOT_SHARE` 0.3% threshold) — 1 asset with invalid metric.

**Local vs production:** Identical counts when run against `http://127.0.0.1:3000` with the same code — data pipeline is not the issue.

### Pipeline drop analysis

| Stage | Count | Notes |
|---|---:|---|
| API raw items | 200 | `GET /api/heatmaps/vietnam` |
| After `limitHeatmapAssets` | 200 | `VN_HEATMAP_LIMIT = 200` |
| Assigned to sectors (input) | 199 | 1 unclassified excluded at layout |
| After `normalizeTreemapWeights` (metric > 0) | 182 | 18 assets with `tradingValue <= 0` |
| After `buildSectorGroupedTreemap` (rendered tiles) | **182** | **weight→render drop: 0** |
| Expected **visible** in browser (current CSS) | **~10** | Only `VN_HEATMAP_LEADER_SYMBOLS` tiles have `z-index: 25` |

---

## All filters that can drop stocks from render

Searched patterns: `MIN_TILE_AREA`, `MIN_VISIBLE_AREA`, `MIN_SHARE`, `area <`, `return null`, `filter(`, `weight <= 0`, `allMetricsInvalid`, `invalidMetric`.

**No `MIN_TILE_AREA`, `MIN_VISIBLE_AREA`, or `MIN_SHARE` constants exist in the codebase.**  
(`MIN_VISIBLE_SHARE` appears only in benchmark docs, not in layout code.)

### Data ingestion & limits

| Filter | File:Line | Effect |
|---|---|---|
| Top-N slice | `lib/market/heatmap-limits.ts:82-85` | Keeps top 200 VN assets by mode metric |
| Top-N slice (rows) | `lib/market/heatmap-limits.ts:49` | Same for raw API rows |

### Metric / weight normalization

| Filter | File:Line | Effect |
|---|---|---|
| `metric <= 0` removed before normalize | `lib/treemap/treemap-builders.ts:86-87` | Stock excluded from weight pass (no tile weight) |
| Empty valid set → `[]` | `lib/treemap/treemap-builders.ts:87,90,96` | Sector/flat layout returns no weighted items |
| `allMetricsInvalid` | `lib/treemap/treemap-builders.ts:68-71` | Enables equal-grid fallback only; does not drop individual valid stocks |

### Sector layout (VN mode 1)

| Filter | File:Line | Effect |
|---|---|---|
| Empty bucket skip | `lib/vietnam/vietnam-sector-grid-layout.ts:71` | Sector with zero assets omitted |
| `unclassified` below 0.3% root share | `lib/vietnam/vietnam-sector-grid-layout.ts:60,72-77,294-296` | Entire unclassified bucket excluded |
| `inner.w <= 0 \|\| inner.h <= 0` | `lib/vietnam/vietnam-sector-grid-layout.ts:179-180` | Returns `[]` tiles for that sector |
| `!baseItems.length` after normalize | `lib/vietnam/vietnam-sector-grid-layout.ts:203` | No tiles if all metrics invalid in sector |
| `nonEmpty` groups | `lib/treemap/treemap-builders.ts:583,660` | Empty sector groups skipped at root |

### Squarify / pack (does NOT drop items)

| Guard | File:Line | Effect |
|---|---|---|
| `!items.length \|\| rect.w/h <= 0` | `lib/treemap/squarify.ts:102`, `treemap-builders.ts:426` | Returns `[]` only when input empty or rect invalid |
| `total <= 0` | `lib/treemap/squarify.ts:105` | Returns `[]` when all values zero |
| `MIN_VALUE = 0.0001` floor | `lib/treemap/treemap-builders.ts:8,434,442` | Clamps tiny weights; does not remove items |

**Squarify lays out every weighted item** — confirmed by audit: `stockCountAfterWeight === stockCountRendered` for every sector.

### React render layer

| Filter | File:Line | Effect |
|---|---|---|
| No tile filter | `components/heatmap/VietnamSectorGridHeatmap.tsx:61-70` | All `sector.tiles` mapped to `HeatmapTile` |
| `HeatmapTile` | `components/heatmap/HeatmapTile.tsx` | Never returns `null`; all tiles mounted |
| **`z-10` sector background** | `components/heatmap/VietnamSectorGridHeatmap.tsx:50` | **Occludes non-leader tiles in paint order** |
| Leader `z-index: 25` | `components/heatmap/HeatmapTile.tsx:140,148` | Only these ~10 tiles paint above sector backgrounds |

### Not wired (no effect)

| Item | File | Notes |
|---|---|---|
| `splitKhacBucket` | Referenced in docs only | Never called; tiny stocks stay individual tiles |
| `MIN_VISIBLE_SHARE` | `docs/HEATMAP_BENCHMARK_REPORT.md` only | Not in production layout path |

---

## Sector layout dimensions (after 22px header)

Assumed viewport: **1200×650px** (`LAYOUT_VIEWPORT_HEIGHT_PX = 650`, `SECTOR_HEADER_HEIGHT_PX = 22`).

| Sector | sectorW×H (px) | innerW×H (px) | Header | hideLabel |
|---|---|---|---|---|
| banking | 627×307 | 627×285 | 22px | no |
| industrial | 558×258 | 558×236 | 22px | no |
| realEstate | 568×307 | 568×285 | 22px | no |
| retail | 527×78 | 527×56 | 22px | no |
| oilGas | 648×78 | 648×56 | 22px | no |
| steel | 202×258 | 202×236 | 22px | no |
| consumer | 216×258 | 216×236 | 22px | no |
| technology | 214×258 | 214×236 | 22px | no |
| utilities | 18×78 | 18×78 | 0px | yes (too small for label) |

**Finding:** No sector has zero or negative inner area after header subtraction. The fixed 22px header (commit `451c63a`) reduces inner height modestly (~3.4% of 650px) but does **not** explain missing tiles. Layout engine still emits full tile rects inside inner area.

**Header change (451c63a vs d21652c):** Previously `min(7% of sectorH, 22px)` with 18px floor — for small sectors the old header was *smaller* in normalized coords. New fixed `22/650` is slightly larger for tiny sectors (utilities) but inner area remains positive.

---

## Pipeline trace: where stocks disappear

```
API (200 items)
  → heatmapRowsToMarketAssets
  → limitHeatmapAssets (200)
  → vnSectorGroupForAsset → sector buckets (199 mapped, 1 unclassified)
  → includeSectorInLayout (9 sectors, unclassified dropped)
  → layoutRootSectors → packSquarify (9 sector rects)
  → layoutSectorBlock → layoutSectorTreemap
       → normalizeTreemapWeights (drops metric<=0 per sector)
       → packSquarify / balancedGridFallback (ALL weighted stocks placed)
  → React: VietnamSectorGridHeatmap renders 182 HeatmapTile components
  → Browser paint: z-10 opaque sector backgrounds cover 172 tiles ← REGRESSION
```

### Commit comparison

| Commit | Role | Layout tile count | Visible tiles (browser) |
|---|---|---:|---:|
| `d21652c` (stable) | Pre-V3 polish | ~147–182 (similar pipeline) | **All laid-out tiles visible** (no z-10 on backgrounds) |
| `b1705f0` (V3) | Cap/power + leader z-25 | 182 | All visible (backgrounds still z-auto) |
| `451c63a` (polish) | **`z-10` sector bg**, fixed 22px header | 182 | **~10 leaders only** |

### Hypotheses tested

| Hypothesis | Result |
|---|---|
| V3 cap/power changes dropping tiles | **Rejected** — `weight→render drop: 0` |
| Header 22px eating inner layout | **Rejected** — all inner areas positive; 182 tiles laid out |
| `normalizeTreemapWeights` filtering to top N | **Rejected** — caps redistribute weight; all valid stocks get tiles |
| Inner weighted grid fallback dropping small tiles | **Rejected** — fallback still places all `baseItems` |
| React key/filter hiding tiles | **Rejected** — all 182 tiles mounted |
| `splitKhacBucket` removal side effect | **N/A** — never wired |
| **CSS z-index stacking** | **Confirmed** — primary cause |

---

## Profile (render)

| Metric | Production API | Local API |
|---|---:|---:|
| `buildSectorGroupedTreemap` | 16.4 ms | 10.1 ms |
| React `HeatmapTile` components | 182 | 182 |
| Leader tiles (z-25) | 10 | 10 |
| Non-leader tiles (occluded) | 172 | 172 |

Layout generation is **not** the performance bottleneck. React still mounts 182 tile components (tooltips, etc.), which may contribute slightly to perceived slowness vs a visually sparse chart, but the dominant user-visible defect is occlusion—not slow squarify.

---

## Root cause

**Primary (single cause):** Commit **`451c63a`** added `z-10` to full-rect opaque sector background divs in `VietnamSectorGridHeatmap.tsx` while stock tiles remain at default stacking (`z-index: auto` / 0). Those backgrounds paint **over** 172 of 182 rendered tiles. Only the 10 VN leader symbols (`VN_HEATMAP_LEADER_SYMBOLS`, given `z-index: 25` in `HeatmapTile.tsx` from **`b1705f0`**) remain visible—matching the “~10 stocks total” production symptom and sparse tiles per sector (mostly banking + real estate + one steel/tech leader).

The layout pipeline is healthy: **182 tiles are computed and mounted**; they are hidden at the CSS paint layer, not dropped by treemap logic.

---

## Secondary factors

1. **18 invalid tradingValue metrics** — reduces weighted count 199→182; unrelated to “empty black space” (those stocks never get layout rects).
2. **`unclassified` sector excluded** — 1 asset; negligible.
3. **Fixed 22px header (`451c63a`)** — minor inner height reduction; not causal for missing tiles.
4. **V3 weight/cap tuning (`b1705f0`)** — changes tile *sizes*, not tile *count*.
5. **Leader emphasis (`b1705f0`)** — accidentally masks the bug by leaving ~10 tiles visible instead of zero.
6. **`useResizableHeight` changes in `451c63a`** — may affect perceived load/resize behavior; separate from tile count.

---

## Recommended fix (describe only — NOT implemented)

1. **Remove `z-10` from sector background divs** in `VietnamSectorGridHeatmap.tsx`, *or* assign stock tiles a higher z-index (e.g. `z-20`) so they paint above backgrounds. Prefer removing/adjusting background z-index so labels (`z-20` header) and tiles stack naturally.
2. **Keep sector backgrounds `pointer-events-none`** (already set) so tiles remain clickable after fix.
3. **Verify in browser** that ~182 tiles are visible across 9 sectors after CSS fix; re-run `npx tsx scripts/heatmap-regression-audit.ts` (counts should be unchanged).
4. **Optional:** Add a visual regression test or Storybook snapshot for sector heatmap stacking order.

Do **not** change weight/cap constants as part of this fix—the regression is purely a render stacking bug.

---

## Commands used

```bash
# Production audit
HEATMAP_API_BASE=https://btrading.org npx tsx scripts/heatmap-regression-audit.ts

# Existing debug report
HEATMAP_API_BASE=https://btrading.org npm run heatmap:debug

# API asset count
curl -s https://btrading.org/api/heatmaps/vietnam  # items: 200
```

Output files: `scripts/heatmap-regression-prod.txt`, `scripts/heatmap-regression-local.txt`
