# Sprint 12 — Dashboard Layout Refactor Audit

**Date:** 2026-06-16  
**Scope:** FireAnt-style dashboard layout — heatmap priority, 3-column grid, dense tile layout  
**Build:** `npm run build` ✅  
**Deploy:** Not deployed (layout-only sprint, no commit/push requested)

---

## Summary

Restructured the home dashboard into a FireAnt-style 3-column layout with the heatmap as the primary visual block. Fear & Greed moved below the heatmap. Economic Calendar and Breaking News moved to a dedicated right column that stacks vertically. Heatmap tile grid density increased (more columns, smaller rows, reduced large-tile footprint) to show more symbols with less scrolling. No changes to colors, theme, data providers, API routes, auth, brokers, watchlist, or currency strength logic.

---

## Layout Before / After

### Before

```
┌─────────────────────────────────────────────────────────┐
│ Header + Ticker Bar                                     │
├──────────────┬──────────────────────────────────────────┤
│ Sidebar      │ Fear & Greed (full width)                │
│ (300px)      │ Heatmap (520px fixed)                    │
│              │ Vietnam Dashboard                          │
│              │ Currency Strength                          │
│              │ ┌──────────────┬──────────────┐          │
│              │ │ Calendar     │ News         │ (2-col)  │
│              │ └──────────────┴──────────────┘          │
│              │ Broker Highlights                        │
│              │ Risk Warning                             │
└──────────────┴──────────────────────────────────────────┘
```

- 2-column layout (sidebar + single main column)
- Fear & Greed above heatmap
- Calendar and News side-by-side in main column
- Heatmap at fixed 520px height, 6–12 column grid, 48px min row height

### After

```
┌──────────────────────────────────────────────────────────────────┐
│ Header + Ticker Bar                                              │
├──────────────┬─────────────────────────────┬─────────────────────┤
│ Sidebar      │ Heatmap (640px / 65vh)      │ Economic Calendar   │
│ (300px)      │ Fear & Greed                │ Breaking News       │
│ sticky       │ Vietnam Dashboard           │ (stacked, sticky)   │
│              │ Currency Strength           │                     │
│              │ Broker Highlights           │                     │
│              │ Risk Warning                │                     │
└──────────────┴─────────────────────────────┴─────────────────────┘
```

- 3-column layout on desktop (`lg+`): sidebar | main | right rail (280px)
- Heatmap first, Fear & Greed directly below
- Calendar + News in right column, stacked vertically
- Heatmap enlarged to `min(640px, 65vh)` with responsive min-heights
- Dense tile grid: 8→16 columns, 36px min row height, smaller tile spans

---

## Responsive Behavior

| Breakpoint | Layout | Column order |
|------------|--------|--------------|
| **Mobile** (`< md`) | Single column | Sidebar → Heatmap → Fear & Greed → VN Dashboard → Currency Strength → Brokers → Risk → Calendar → News |
| **Tablet** (`md`–`lg`) | 2-column `[300px \| 1fr]` | Col 1: Sidebar (sticky). Col 2 row 1: Main content. Col 2 row 2: Calendar + News stacked |
| **Desktop** (`lg+`) | 3-column `[300px \| 1fr \| 280px]` | Left: Sidebar (sticky). Center: Heatmap + downstream sections. Right: Calendar + News (sticky, stacked) |

**Mobile heatmap priority:** Heatmap appears before Calendar and News (main column precedes right rail in DOM order).

**Sticky behavior:** Sidebar and right rail stick at `top: 104px` on `lg+` viewports.

---

## Files Changed

| File | Change |
|------|--------|
| `app/page.tsx` | 3-column grid; heatmap before Fear & Greed; Calendar/News moved to right column |
| `components/marketwall/heatmap.tsx` | Enlarged heatmap container; denser grid (8–16 cols, 36px rows); reduced tile spans; tighter padding |
| `components/heatmap/MarketHeatmap.tsx` | Matching dense grid; fewer large tiles (10%/30% cutoffs vs 15%/40%) |
| `components/heatmap/HeatmapTile.tsx` | Smaller tile spans (large 2×2, medium 2×1); reduced padding |

---

## Heatmap Density Changes (layout only)

| Property | Before | After |
|----------|--------|-------|
| Container height | `520px` fixed | `min(640px, 65vh)` with `min-h-[480px]` / `lg:min-h-[600px]` |
| Grid columns | 6 / 8 / 10 / 12 | 8 / 10 / 12 / 14 / 16 |
| Min row height | `48px` | `36px` |
| Large tile span | 3×3 or 4×4 | 2×2 or 3×3 |
| Large tile cutoff | Top 15% by mcap | Top 10% |
| Medium tile cutoff | Top 40% | Top 30% |
| Tile padding | `p-1.5 lg:p-2.5` | `p-1 sm:p-1.5 lg:p-2` |

---

## Verification

- [x] Local build passed (`npm run build`)
- [ ] Pushed to `main` (not requested)
- [ ] Vercel production deploy (not requested)
- [ ] Visual QA on btrading.org (pending deploy)

---

## Screenshot Checklist

Capture at these viewports after deploy or local `npm run dev`:

- [ ] **Desktop (≥1280px)** — 3-column layout: sidebar left, large heatmap center, calendar/news stacked right
- [ ] **Desktop** — Heatmap is the dominant visual; Fear & Greed directly below with no calendar/news beside it
- [ ] **Desktop** — Right column height visually balances center column (calendar + news fill the rail)
- [ ] **Tablet (768–1023px)** — 2-column: sidebar + main; calendar/news below main content in col 2
- [ ] **Mobile (<768px)** — Single column; heatmap appears before calendar and news
- [ ] **Mobile** — Heatmap tiles remain readable at dense grid (no excessive horizontal scroll)
- [ ] **Heatmap tabs** — VN / US / Crypto market switch still works
- [ ] **No regressions** — Sidebar watchlist, currency strength, broker highlights unchanged in behavior

---

## Out of Scope (confirmed untouched)

- API routes and data providers
- Currency Strength logic
- Broker module
- Watchlist logic
- Auth / database
- Colors, theme, gauge designs
