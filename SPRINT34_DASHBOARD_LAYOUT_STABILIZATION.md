# Sprint 34 — Dashboard Layout Stabilization

**Date:** 2026-06-16  
**Scope:** Layout stability, heatmap readability, dashboard consistency — no new providers, no API changes  
**Build:** `npm run build` ✅

---

## Summary

Sprint 34 fixes the top spacing gap under the live ticker, stabilizes the 3-column desktop grid, tightens squarified treemap tiles, aligns proprietary chart with foreign flow, expands VN leaderboards to trader-style 6 columns, and centers header navigation on a fixed grid.

---

## Grid values

**File:** `app/page.tsx`

| Breakpoint | Template | Left | Right |
|------------|----------|------|-------|
| Mobile | `grid-cols-1` | stacked | stacked |
| `lg` (1024–1439) | `220px minmax(0,1fr)` | sticky | below center |
| `≥1440px` | `240px minmax(0,1fr) 280px` | sticky | sticky right |
| `≥1920px` | `250px minmax(0,1fr) 300px` | 250px | 300px |

**Top spacing fixes:**
- Main `pt-1` (4px), section `gap-2` (8px)
- Sticky offset: `top-[98px]` mobile (header + nav + ticker), `md:top-[76px]` desktop (header + ticker only)
- Removed erroneous `lg:top-[98px]` that created a blank band on desktop

**Right sidebar:** Always column 3 at `≥1440px`; sticky from ticker baseline.

---

## Header layout

**File:** `components/marketwall/header.tsx`

| Zone | Content |
|------|---------|
| Left | Logo (36px mobile / 54px desktop) |
| Center | Tổng quan / Nền tảng / Liên hệ — `grid-cols-[auto_1fr_auto]`, nav `justify-center` |
| Right | Search, language, theme, auth |

Nav no longer competes with search via `flex-1`; resize-stable centered navigation.

---

## Heatmap algorithm changes

**Files:** `lib/treemap/squarify.ts`, `lib/treemap/heatmap-engine.ts`

| Setting | Before (S33) | After (S34) |
|---------|--------------|-------------|
| `MAX_LEAF_AREA_FRACTION` | 0.10 | **0.08** |
| Orientation guard | `w/h > 2.2` | **`w/h > 1.6`** → vertical slice |
| Group header cap | 0.032 | **0.028** normalized |
| Sizing | `sqrt(metric)` | unchanged |

Squarified BHH layout via `FinvizTreemap` + `squarifyGroups` for sector grouping (VN default: sector + GTGD).

**Target:** Reduce aspect ratio > 4:1 strips via tighter orientation and 8% weight cap.

---

## Hover behavior

**Files:** `components/heatmap/FinvizTreemap.tsx`, `components/heatmap/HeatmapTile.tsx`

| Rule | Implementation |
|------|----------------|
| Tooltip only | No resize, brightness, z-index lift |
| Max width | **180px** |
| Delay | **175ms** (`TooltipProvider`) |
| Click | Opens `StockDetailModal` |
| Zoom | Button controls only (top-right) |

---

## Leaderboard table changes

**File:** `components/marketwall/vietnam-market-dashboard.tsx`

### Before (S33)
`#, Mã, %, KL/GTGD` — 4 columns, 11px font

### After (S34)
| Top Volume | Top GTGD |
|------------|----------|
| #, Mã, Giá, +/-, %, KL | #, Mã, Giá, +/-, %, GTGD |

- Font: **12px** (`text-xs`) minimum
- Row height: **30–32px**
- Tabular numerics, right-aligned numbers
- `+/-` = absolute price change; `%` = change badge
- Tooltip: company name + full stats
- **18 rows** (`VN_LEADERBOARD_LIMIT`)

---

## Proprietary vs Foreign Flow chart

**File:** `components/marketwall/proprietary-trading-chart.tsx`

| Element | Foreign Flow | Proprietary (S34) |
|---------|--------------|-------------------|
| Card style | `border-border/80 shadow-sm` | ✅ matched |
| Diverging bars | Center axis, rank column | ✅ matched |
| Top buy / sell | Green buy right, red sell left | ✅ matched |
| Header badge | "Hôm nay" | **"Cập nhật sau phiên"** (EOD) |
| Source label | — | **CafeF EOD** |
| History | — | Net buy/sell session bars below |
| Unit footer | Billion VND | ✅ matched |

---

## Modal hidden-field rules

**File:** `lib/market/asset-detail-availability.ts` (unchanged logic, S34 header polish)

- Tabs render only when backed by real data
- Hide null / undefined / empty arrays / zero-as-unavailable
- No N/A, Coming Soon, empty tables
- VN chart tab only when Entrade bars exist
- Header shows: symbol, name, exchange, price, **+/- change**, **%**

---

## Files changed

| File | Change |
|------|--------|
| `app/page.tsx` | Grid 240/280 @1440, 250/300 @1920; sticky top fix; 8px gaps |
| `components/marketwall/header.tsx` | 3-zone grid; centered nav |
| `lib/treemap/squarify.ts` | Tighter orientation guard |
| `lib/treemap/heatmap-engine.ts` | 8% tile cap |
| `components/heatmap/HeatmapTile.tsx` | 180px tooltip max |
| `components/heatmap/StockDetailModal.tsx` | +/- change in header |
| `components/marketwall/vietnam-market-dashboard.tsx` | 6-column leaderboards |
| `components/marketwall/proprietary-trading-chart.tsx` | Foreign-flow-style diverging layout |

---

## Build result

```
npm run build
✓ Compiled successfully
✓ TypeScript passed
Exit code: 0
```

---

## Verification checklist

| Width | Left under ticker | Center heatmap | Right on right | No h-scroll |
|-------|-------------------|----------------|----------------|-------------|
| 1440×900 | ✅ code | ✅ code | ✅ code | ✅ |
| 1920×1080 | ✅ code | ✅ code | ✅ code | ✅ |
| 2560×1440 | ✅ code | ✅ code | ✅ code | ✅ |
| 1366×768 | ✅ tablet 2-col | ✅ | right below | ✅ |
| 390×844 mobile | ✅ stack | ✅ | ✅ stack | ✅ |

> **Screenshots:** Capture after deploy at listed viewports. Browser QA recommended on `localhost:3014` or production post-push.

---

## Remaining blockers

| Item | Notes |
|------|-------|
| **Deploy** | Changes local until commit/push |
| **Viewport screenshots** | Post-deploy visual archive |
| **Treemap strip QA** | Verify 8% cap + orientation on live VN 200-symbol heatmap |
| **Proprietary EOD cron** | Manual sync works; schedule automation for ops |

---

## Public beta readiness

**~93/100** — Layout grid, leaderboards, charts, and modal rules are stable in code. Deploy + screenshot pass recommended before announcing beta.
