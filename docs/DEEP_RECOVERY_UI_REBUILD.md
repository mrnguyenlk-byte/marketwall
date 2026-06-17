# Deep Recovery UI Rebuild — Audit & Implementation

**Branch:** `heatmap-rewrite`  
**Date:** 2026-06-17  
**Scope:** UI foundation rebuild; preserve all business/data logic.

---

## 1. Current Dashboard Structure

```
app/page.tsx
├── Header (ticker bar)
├── main.dashboard-grid
│   ├── aside.dashboard-sidebar-left  → Sidebar
│   │     ├── MarketOverview (600px card, tabs)
│   │     ├── Watchlist
│   │     └── Promo/Partner banners
│   ├── section.dashboard-center
│   │     ├── HeatmapSection (VN sector treemap via MarketHeatmap)
│   │     ├── VietnamMarketDashboard (Top Volume, Top GTGD, Foreign Flow, Proprietary)
│   │     ├── VietnamMarketAnalyticsPanel
│   │     ├── CurrencyStrength (feature flag)
│   │     ├── BrokerHighlights
│   │     └── RiskWarning
│   └── aside.dashboard-sidebar-right
│         ├── FearGreed
│         ├── MarketNews
│         └── EconomicCalendar
└── Footer
```

**Responsive breakpoints (pre-fix):**
| Viewport | Layout |
|----------|--------|
| `<1024px` | 1 column |
| `1024–1439px` | 2 col: left sidebar + center; right sidebar wraps below center |
| `≥1440px` | 3 col: 240px \| 1fr \| 280px (300px only at 1920px) |

**Gap:** 8px (`0.5rem`) — below spec of 16px.

---

## 2. Controlling Files

| Concern | Files |
|---------|-------|
| Page shell / grid | `app/page.tsx`, `app/globals.css` (`.dashboard-grid`) |
| Typography / tokens | `app/globals.css` |
| Shared UI primitives | `components/marketwall/shared.tsx`, `components/ui/card.tsx` |
| Heatmap container | `components/marketwall/heatmap.tsx` (`HeatmapViewport`) |
| VN treemap layout (Sprint 36B) | `lib/vietnam/vietnam-sector-grid-layout.ts` |
| VN treemap render | `components/heatmap/VietnamSectorGridHeatmap.tsx`, `HeatmapTile.tsx` |
| Widget cards | Individual `components/marketwall/*.tsx` — each rolled its own Card/border/radius |

---

## 3. Root Causes

### Clipping / overflow
- Grid gap too tight (8px) caused visual crowding; center column lacked consistent `min-w-0` on nested flex children.
- Sidebar width classes on `page.tsx` (`min-[1440px]:w-[280px]`) fought CSS grid track sizing.
- Heatmap viewport used fixed clamp height — correct pattern, but outer card lacked `min-w-0` on full chain.
- Leaderboard tables use `min-w-[320px]` with `overflow-x-auto` — intentional horizontal scroll on narrow center, not a bug.

### Fragmented typography
- Widget titles ranged from `text-[10px]` to `text-base` with no shared tokens.
- Section headings (`SectionHeading`) used `text-sm/sm:text-base`; in-card titles used `text-xs` or `text-sm` inconsistently.
- Table body text mixed `text-xs`, `text-[10px]`, `text-[11px]`.

### Fragmented card shells
- Heatmap: custom `rounded-lg border bg-card/40 shadow-sm ring-1`
- FearGreed: bare `rounded-lg border` without shadow
- News/Calendar: shadcn `Card` with `py-0`
- VN Dashboard leaderboards: shadcn `Card` with different header padding
- MarketOverview: custom `Card` with `rounded-xl` (shadcn default) vs others `rounded-lg`

---

## 4. Sprint 36B Heatmap — Recommendation

**Preserve** `lib/vietnam/vietnam-sector-grid-layout.ts` — two-level squarify (sector → stocks) is sound:
- Sector importance blending (70% metric / 30% importance)
- Tile cap at 12% sector area with retry at 8%
- Text tier assignment via `tierToTileSize`

**Simplify:** None required. Only container sizing in `heatmap.tsx` and tile text overflow in `HeatmapTile.tsx`.

**Do NOT rewrite** squarify engine or provider/API layers.

---

## 5. Implementation Summary

### Phase 2 — UI Foundation
- Typography CSS vars + utility classes in `globals.css`
- `.dashboard-grid`: gap 16px, columns `240px | minmax(0,1fr) | 300px` at ≥1440px
- Sticky sidebars retain `--dashboard-top-offset`
- `DashboardCard`, `WidgetHeader`, `DashboardCardBody`, `DashboardCardFooter` in `shared.tsx`
- `SectionHeading` updated to use widget-title token

### Phase 3 — Heatmap
- `HeatmapViewport` adds `min-w-0`; height unchanged (clamp 420–480px)
- `HeatmapTile` enforces `overflow-hidden` + `truncate` on all text spans

### Phase 4 — Widget Visual Sync
Applied `DashboardCard` / `WidgetHeader` pattern to:
- Heatmap, FearGreed, MarketNews, EconomicCalendar
- VietnamMarketDashboard leaderboards, ForeignFlowChart, ProprietaryTradingChart
- MarketOverview, Watchlist

---

## 6. Deliverable — Post-Implementation

### Files changed
See git diff. Expected ~14 files (under 25-file limit).

### What was broken / fixed / not touched

| Area | Status |
|------|--------|
| Grid gap 8px → 16px | **Fixed** |
| Right column 280px at 1440 | **Fixed** → 300px |
| Sidebar width class conflicts | **Fixed** — removed from page.tsx |
| Typography inconsistency | **Fixed** — CSS tokens + utilities |
| Card shell fragmentation | **Fixed** — DashboardCard pattern |
| Heatmap clipping in center | **Fixed** — min-w-0 chain |
| Sprint 36B squarify layout | **Not touched** (preserved) |
| Providers, APIs, GTGD/Foreign Flow/Volume calcs | **Not touched** |
| VietnamMarketAnalyticsPanel, CurrencyStrength, BrokerHighlights | **Not touched** (out of P4 priority list) |

### Remaining risks
- Leaderboard `min-w-[320px]` may still scroll horizontally on very narrow center column (<360px effective).
- MarketOverview fixed `h-[600px]` may feel tall on short viewports — pre-existing.
- BrokerHighlights / analytics panels still use legacy card styling — minor visual inconsistency until Sprint 37.

### Recommendation
**Continue Sprint 37** on `heatmap-rewrite`. Foundation is unified; no rollback needed. Next: analytics/broker widgets, dark-mode token audit, and optional removal of deprecated `SectionHeading` external titles where `WidgetHeader` suffices.
