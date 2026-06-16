# Sprint 32 — Dashboard UX Correction Pass

**Date:** 2026-06-16  
**Scope:** Layout, readability, and interaction fixes only (no new features, no provider/API changes)  
**Build:** `npm run build` ✅

---

## Summary

Sprint 32 corrects dashboard UX pain points reported after Sprint 29–31: heatmap hover/zoom behavior, sidebar column widths, header logo and navigation, Vietnam leaderboard table density, and stock detail modal layout. Vietnam heatmap tiles use a tighter **12% max leaf area** cap (down from 20%). VN symbols in the detail modal show a clean internal-chart placeholder instead of a broken TradingView widget.

---

## Before / after (visual)

| Area | Before (issues) | After |
|------|-----------------|-------|
| **Heatmap hover** | Tiles brightened, `z-index` raised, large multi-line tooltips could cover adjacent tiles | Hover shows compact tooltip only (~160px); no tile resize, brightness, or z-index lift |
| **Heatmap zoom** | Ctrl+wheel zoom + transform transition on pan | Zoom/pan only via top-right controls; no wheel zoom |
| **Sidebars @ ≥1440px** | 220px \| 1fr \| 220px; right rail felt narrow / could stack awkwardly | 240px \| 1fr \| 260px @ 1440px; 250px \| 1fr \| 280px @ 1920px; explicit min widths |
| **Logo** | 36px on all breakpoints | 48px desktop (md+), 36px mobile |
| **Navigation** | Separate full-width row below logo | Desktop: inline centered nav in header row; mobile: compact second row |
| **VN tables** | 3 columns (#, Mã, metric); change inline with symbol | 5 columns (#, Mã, Giá, %, KL/GTGD); 28–32px rows; green/red % badges |
| **Stock modal** | Tabs + mixed layout; VN attempted native/TradingView chart | Header with symbol/name/exchange/price/%; chart left + stats right; VN placeholder message |

> **Screenshots:** Browser MCP was unavailable in the agent environment during this sprint. Verify locally at `http://localhost:3013` (after `npm run build && npx next start -p 3013`) at viewport widths **1440**, **1920**, and **2560**.

---

## Layout grid values

**File:** `app/page.tsx`

| Breakpoint | Grid template | Left | Right | Notes |
|------------|---------------|------|-------|-------|
| `< lg` | `grid-cols-1` | full width | stacked below center | Mobile stack |
| `lg` – `1439px` | `220px minmax(0,1fr)` | sticky | below center | Two-column |
| `≥ 1440px` | `240px minmax(0,1fr) 260px` | sticky 240px | sticky 260px | Three columns always visible |
| `≥ 1920px` | `250px minmax(0,1fr) 280px` | 250px | 280px | Wider rails |

Sticky offset: `top-[98px]` below `md`, `top-[76px]` at `md+` (nav merged into header row on desktop).

Tailwind classes:

```
grid-cols-1
lg:grid-cols-[220px_minmax(0,1fr)]
min-[1440px]:grid-cols-[240px_minmax(0,1fr)_260px]
min-[1920px]:grid-cols-[250px_minmax(0,1fr)_280px]
```

---

## Heatmap hover / click fix

| Behavior | Implementation |
|----------|----------------|
| Hover | Compact tooltip: symbol, truncated name, price + % (`HeatmapTile.tsx`) |
| Click | Opens `StockDetailModal` via `openAsset` (unchanged) |
| No hover zoom/resize | Removed `hover:z-10`, `hover:brightness-110`, transform transitions |
| Zoom/pan | Button controls only in `FinvizTreemap.tsx`; removed `onWheel` handler |
| Tile balance | `MAX_LEAF_AREA_FRACTION` **0.12** in `heatmap-engine.ts` (sqrt sizing unchanged) |
| Tooltip provider | Single `TooltipProvider` at treemap root (not per tile) |

---

## Vietnam table redesign

**File:** `components/marketwall/vietnam-market-dashboard.tsx`

| Column (Volume) | #, Mã, Giá, %, KL |
| Column (Value) | #, Mã, Giá, %, GTGD |
| Row height | `h-7` (28px) / `sm:h-8` (32px) |
| Font | `text-[11px]` / `sm:text-xs` (12px) |
| % display | Green/red/neutral badge, right-aligned |
| Numerics | `font-mono tabular-nums`, right-aligned |
| Ticker | `whitespace-nowrap`, no wrap |
| Company name | Tooltip via `buildHeatmapSymbolRecords()` seed lookup |
| Row count | `VN_LEADERBOARD_LIMIT` **15** (`vn-dashboard-from-vps.ts`) |

---

## Modal redesign

**Files:** `StockDetailModal.tsx`, `StockTabs.tsx`, `StockChart.tsx`

| Section | Content |
|---------|---------|
| Header | Symbol, company name, exchange badge, price, change %, updated time |
| Tabs | Tổng quan, Biểu đồ, Hồ sơ, Cổ đông, Tài chính, Giá quá khứ |
| Main layout | Overview + Chart tabs: chart (left) + `StockSummaryTable` (right) |
| Vietnam chart | Placeholder: *"Biểu đồ nội bộ cho mã Việt Nam đang được chuẩn bị."* (`heatmapDetail.vnChartPreparing`) |
| US/Crypto chart | TradingView widget (unchanged) |
| Modal size | Up to `960px` wide on desktop |

---

## Files changed

| File | Change |
|------|--------|
| `lib/treemap/heatmap-engine.ts` | `MAX_LEAF_AREA_FRACTION` 0.2 → 0.12 |
| `lib/vietnam/vn-dashboard-from-vps.ts` | Leaderboard limit 18 → 15 |
| `lib/i18n.tsx` | VN chart placeholder string; historical tab label |
| `app/page.tsx` | 3-column grid 240/260 @ 1440, 250/280 @ 1920; sticky offsets |
| `components/heatmap/FinvizTreemap.tsx` | No wheel zoom; shared tooltip provider; no transform transition |
| `components/heatmap/HeatmapTile.tsx` | Compact hover tooltip; no hover visual expansion |
| `components/heatmap/SectorTreemap.tsx` | Remove deprecated `detailedTooltip` prop |
| `components/heatmap/StockChart.tsx` | VN placeholder instead of native/TradingView |
| `components/heatmap/StockDetailModal.tsx` | Header layout; wider modal |
| `components/heatmap/StockTabs.tsx` | Chart + stats two-column; removed dividends tab from nav |
| `components/marketwall/header.tsx` | Logo 48px desktop; nav centered in row 1 on md+ |
| `components/marketwall/heatmap.tsx` | Remove legacy tile hover brighten |
| `components/marketwall/vietnam-market-dashboard.tsx` | 5-column trader tables |

---

## Build result

```
npm run build
✓ Compiled successfully
✓ TypeScript passed
✓ Static page generation complete
Exit code: 0
```

---

## Verification checklist

- [x] Local build passed (re-verified 2026-06-16)
- [x] Browser spot-check @ 1440 / 1920 on `http://localhost:3014` (post-build)
- [ ] Browser spot-check @ 2560 (not captured)
- [x] Heatmap hover = tooltip only (no tile z-index/brightness lift in code)
- [x] Heatmap click opens modal
- [x] Three-column grid @ 1440px: child widths **240 / ~1161 / 260** px measured in DOM
- [x] `html lang="vi"` + Vietnamese nav labels on fresh load
- [x] VN trader tables use 5-column grid (`#, Mã, Giá, %, KL/GTGD`)
- [ ] VN modal placeholder — not clicked in QA pass
- [ ] Production screenshots — pending deploy

### Local QA notes (follow-up)

| Width | Left rail | Center heatmap | Right rail | Logo / nav |
|-------|-----------|----------------|------------|------------|
| 1440 | ✅ ~240px | ✅ visible | ✅ ~260px (in DOM) | Nav inline `flex`; logo uses header img |
| 1920 | ✅ | ✅ sector treemap | ✅ | Same |

Screenshots: `sprint32-qa-1440.png`, `sprint32-qa-1920.png` (Cursor temp screenshots dir).

---

## Remaining UX notes

1. **Company names in VN tables** — Tooltip names come from seed registry; live VPS symbols not in seeds show symbol-only tooltip (no API change per sprint constraints).
2. **VN internal chart** — Placeholder shown until native chart is re-enabled; historical tab still uses chart API data when available.
3. **1024–1439px** — Right sidebar still stacks below center (by design; sprint spec only mandated ≥1440px three-column layout).
4. **Screenshots** — Capture manually after deploy for production audit archive.
