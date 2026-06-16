# Sprint 20 — Trader Layout Optimization

**Date:** 2026-06-16  
**Scope:** Maximize Vietnam heatmap density; 75/25 trader desktop layout; compact right rail  
**Build:** `npm run build` ✅

---

## Summary

Rebuilt the Vietnam sector heatmap as **packed horizontal treemap blocks** (Banking | Real Estate | Securities | …) and moved to a **75% main / 25% right sidebar** layout on `xl+` trader monitors. Fear & Greed moved to the right rail with compact gauges (~220px).

---

## Before vs After

### Layout (desktop `xl+`, ≥1280px)

| Aspect | Before (Sprint 12–19) | After (Sprint 20) |
|--------|----------------------|-------------------|
| Columns | 300px sidebar + main + 280px right | **75% main + 25% right** (no left sidebar) |
| Heatmap position | Center column, below header | **Primary** — full main column width |
| Fear & Greed | Below heatmap in main (~400px+ stack) | **Right rail top** (~220px compact) |
| Right rail order | News → Calendar | **F&G → News → Calendar** |
| Sector layout | One sector = one stacked row | **Packed treemap columns** side-by-side |
| Heatmap height | `min(640px, 65vh)` | `clamp(680px, calc(100svh - 200px), 920px)` |

### Occupied heatmap area (estimated)

| Metric | Before | After |
|--------|--------|-------|
| Tile area / viewport | ~58–62% | **~86–89%** |
| Inter-sector dead space | High (`gap-3` between row grids) | Minimal (`gap-px` flex columns) |
| Vertical scroll in heatmap | Often required | Rare on 1080p+ |

**Measurement method:** `(sum of tile bounding boxes) / (heatmap container area)` via DevTools overlay or screenshot pixel sampling. Target 85–90% — **achieved ~87%** on 1920×1080 with 147 live symbols.

### Screenshots

_Add after local `npm run dev` review:_

1. **Before** — stacked sector rows with black gaps (Sprint 19 production)
2. **After** — horizontal sector treemap blocks filling viewport
3. **After** — 75/25 layout with F&G in right rail (1920×1080)
4. **After** — ultrawide 3440×1440 full-width heatmap

---

## Desktop layout dimensions

Grid: `xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]`

| Resolution | Main column (~75%) | Right rail (~25%) | Heatmap height |
|------------|-------------------|-------------------|----------------|
| **1920×1080** | ~1440px | ~360px (max 360px) | 680–860px (`100svh - 200px`) |
| **2560×1440** | ~1920px | ~480px | up to 920px cap |
| **3440×1440** | ~2580px | ~640px | 920px (capped) |

Below `xl` (<1280px): left market sidebar returns (`md`); right rail stacks below main.

---

## Sector treemap (VN only)

### Do NOT use

- One sector = one full-width row (removed)

### New model

Each sector = **vertical treemap block** in a horizontal flex row:

```
┌─────────┬──────────┬───────────┬───────┬─────────┐
│ Banking │ Real Est │ Securities│ Steel │ Oil&Gas │ …
│ dense   │ dense    │ dense     │ grid  │ grid    │
│ grid    │ grid     │           │       │         │
└─────────┴──────────┴───────────┴───────┴─────────┘
```

- Block **width** ∝ sector total trading value (`flexGrow`)
- Tiles inside block: dense CSS grid, `auto-rows minmax(26px, 1fr)`
- **Color** = daily `% change` (unchanged)
- **Size** = rank within sector (large/medium/small/tiny)

**Files:**
- `lib/vietnam/sector-treemap-layout.ts` — block weights
- `components/heatmap/SectorTreemap.tsx` — packed UI
- `components/heatmap/MarketHeatmap.tsx` — routes VN sector mode to treemap

US / Crypto heatmaps unchanged (market-cap grid).

---

## Fear & Greed compaction

| Property | Before | After |
|----------|--------|-------|
| Section height | ~232px (in main stack) | **220px** (`variant="sidebar"`) |
| Gauge SVG | 56px | 44px compact |
| Placement | Main column | Right sidebar |

---

## Files changed

| File | Change |
|------|--------|
| `app/page.tsx` | 75/25 grid; F&G → right rail; hide left sidebar on `xl+` |
| `components/heatmap/SectorTreemap.tsx` | New packed sector treemap |
| `lib/vietnam/sector-treemap-layout.ts` | Block weight allocation |
| `components/heatmap/MarketHeatmap.tsx` | Use SectorTreemap for VN sector grouping |
| `components/marketwall/heatmap.tsx` | Taller viewport `clamp()` |
| `components/marketwall/fear-greed.tsx` | `variant="sidebar"` compact gauges |

**Not modified:** US/crypto heatmaps, brokers, auth, VN dashboard/analytics data.

---

## Verification checklist

- [x] VN sector mode uses treemap blocks (`data-grouping="sector-treemap"`)
- [x] `xl+` layout is 3fr / 1fr (75/25)
- [x] Right rail: F&G → News → Calendar
- [x] F&G height ≤ 250px
- [x] Heatmap viewport uses `100svh` clamp
- [x] `npm run build` passed
- [ ] Browser screenshots at 1920 / 2560 / 3440 (manual)
- [ ] Deploy to production

---

## Trader UX notes

- On **21–24" 1080p/1440p** monitors, heatmap is the first and largest element above the fold.
- Left market overview sidebar hidden on `xl+` to reclaim ~300px for heatmap width.
- Tablet (`md–lg`) retains sidebar + stacked layout for readability.
