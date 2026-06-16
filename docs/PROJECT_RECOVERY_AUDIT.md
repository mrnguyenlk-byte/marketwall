# Project Recovery Audit

**Date:** 2026-06-17  
**Mode:** READ-ONLY analysis (pre-recovery baseline)  
**HEAD commit:** `885876c` — Sprint36B two-level Vietnam heatmap  
**Build at audit time:** `npm run build` ✅ (last known green on `main`)

---

## Executive summary

The project is **recoverable without a full rollback**. Sprint 36B heatmap work is sound and build-green. Instability is concentrated in a **partial Sprint 37 layout refactor** (commit `4c2ab6c`) that moved dashboard grid rules from inline Tailwind in `app/page.tsx` into `app/globals.css` and **regressed breakpoint values** (wrong right-rail width at 1440px, missing 1920px tier, wider left rail at 1024px). Data providers, APIs, and VN layout engine were not the primary layout failure vector.

**Recommendation:** **Recover in place** — restore Sprint 34 grid contract in CSS, then proceed with phased recovery (typography → cards → widgets). **Do not roll back** to pre-36B; that would discard validated two-level squarify work for a CSS-only regression.

---

## Current dashboard architecture

| Layer | Role | Key files |
|-------|------|-----------|
| **App shell** | Root layout, providers, modals, theme/lang init | `app/layout.tsx` |
| **Home page (RSC)** | Server data fetch + 3-zone dashboard composition | `app/page.tsx` |
| **Data assembly** | Live-first dashboard bundle with mock fallback | `lib/providers/build-dashboard-data.ts` |
| **Marketwall UI** | Header, sidebars, heatmap section, VN panels, widgets | `components/marketwall/*` |
| **Heatmap engine** | VN sector grid + US/Crypto Finviz treemap | `components/heatmap/*`, `lib/vietnam/vietnam-sector-grid-layout.ts` |
| **Realtime** | SSE overlay (optional, feature-flagged) | `lib/realtime/realtime-context.tsx` |

**Render flow:** `Page` → `buildDashboardData()` → `Header` + 3-column `main` (left overview sidebar, center stack, right trader rail) → `Footer`. Each center/right block wrapped in `SectionErrorBoundary`.

---

## Current layout architecture

### `app/page.tsx`

- Single `main` with `px-3 pt-1 pb-3 lg:px-4`, `overflow-x-hidden`.
- Grid container uses class `dashboard-grid` (CSS-driven since `4c2ab6c`).
- Zones: `dashboard-sidebar-left` (Sidebar), `dashboard-center` (heatmap + VN + brokers), `dashboard-sidebar-right` (Fear/Greed, news, calendar).

### `app/globals.css` — `.dashboard-grid`

| Breakpoint | Current (post-4c2ab6c) | Sprint 34 contract |
|------------|------------------------|-------------------|
| `<1024px` | 1 column | 1 column ✅ |
| `1024–1439px` | `240px \| 1fr`; right rail row 2 | `220px \| 1fr`; right rail row 2 ❌ |
| `≥1440px` | `240px \| 1fr \| 300px`; sticky sidebars | `240px \| 1fr \| 280px` ❌ |
| `≥1920px` | **missing** | `250px \| 1fr \| 300px` ❌ |

**Sticky offset:** CSS variables `--dashboard-top-offset` (98px mobile, 76px ≥768px) replace former inline `top-[98px] md:top-[76px]`. Values align with Sprint 30/34 header+ticker math.

**Regression introduced in `4c2ab6c`:** Inline Tailwind grid in `page.tsx` was replaced by component-layer CSS without preserving all breakpoint columns or explicit sidebar widths.

### Header / ticker chrome

- `components/marketwall/header.tsx`: sticky `top-0`, `h-11` / `md:h-12`, embeds `TickerBar`.
- Feeds `--dashboard-header-height` assumptions in globals.css.

---

## Typography system status

| Aspect | Status | Notes |
|--------|--------|-------|
| Base font | ✅ Stable | Geist Sans/Mono via `app/layout.tsx` + `@theme inline` |
| Scale tokens | ⚠️ Fragmented | Mix of `text-xs`, `text-[10px]`, `text-[11px]`, `text-[13px]` across widgets |
| Section titles | ⚠️ Partial standard | `SectionHeading` in `shared.tsx` (`text-sm sm:text-base`) used in some modules, not all |
| Heatmap tile text | ⚠️ Local tiers | Size tiers in `heatmap.tsx` and VN layout engine — not shared tokens |
| Tabular nums | ✅ Consistent | `font-mono tabular-nums` on prices/changes |

**Risk:** No single typography scale file; recovery Priority 2 should normalize section headers and table minimums (12px per Sprint 34) without touching heatmap tile tiers yet.

---

## Card system status

| Pattern | Usage |
|---------|--------|
| Shadcn `Card` / `CardContent` | `currency-strength.tsx`, `broker-highlights.tsx`, broker pages |
| Custom bordered panels | VN dashboard, analytics, fear-greed, news, calendar |
| Shared chrome | `SectionHeading` only — no shared `DashboardCard` wrapper |

**Inconsistencies:** Border opacity (`border-border` vs `border-border/80`), padding (`py-0` vs default), shadow usage varies. Proprietary chart was aligned to foreign-flow style in Sprint 34; other widgets not unified.

---

## Responsive system status

| Range | Behavior | Issue |
|-------|----------|-------|
| Mobile | Single column, stacked | ✅ |
| `1024–1439` | 2-col + right below center | Left rail 240px vs spec 220px |
| `≥1440` | 3-col sticky sidebars | Right rail 300px vs spec 280px; no 1920 tier |
| Ultra-wide | Full bleed | No `max-w` on main — center heatmap stretches (acceptable but untested >2560) |

Documented breakpoints across sprints (29, 32, 34) agree on **240/280 @1440** and **250/300 @1920**; current CSS diverges.

---

## Duplicated / parallel components

| Area | Duplication | Risk |
|------|-------------|------|
| Stock detail | `StockDetailModal` (heatmap) + `SymbolDetailModal` (marketwall) | Medium — two modal stacks, both lazy-loaded in layout |
| Treemap renderers | `VietnamSectorGridHeatmap` vs `FinvizTreemap` | Low — intentional market split via `MarketHeatmap` router |
| Heatmap section | Legacy inline treemap in `heatmap.tsx` + `components/heatmap/*` | Medium — large file, mixed concerns |
| Overview | `sidebar.tsx` watchlist/overview vs `market-overview.tsx` | Low — sidebar is canonical on home |

---

## UI inconsistencies (non-layout)

- Fear/Greed compact sidebar variant vs full card elsewhere.
- Calendar/news card headers differ from VN analytics tab headers.
- Mixed English/VI in dev-facing comments vs user-facing i18n (user strings OK via `lib/i18n.tsx`).
- Sprint 36B screenshots (`docs/sprint36b/after-1440.png`) show acceptable heatmap at 1440 — layout shell mismatch is CSS grid, not heatmap engine.

---

## High-risk files

| File | Why |
|------|-----|
| `lib/vietnam/vietnam-sector-grid-layout.ts` | Large Sprint 36B rewrite; layout math sensitive — **do not touch in P1** |
| `app/globals.css` | Dashboard grid + sticky — **P1 fix target** |
| `app/page.tsx` | Grid markup — **P1 fix target** |
| `components/marketwall/heatmap.tsx` | Monolith; heatmap + legacy paths |
| `lib/providers/build-dashboard-data.ts` | Server fetch cascade; SSG warnings |
| `app/layout.tsx` | Provider stack; past client-bundle crashes |
| `components/heatmap/VietnamSectorGridHeatmap.tsx` | VN render bridge |

---

## Files modified — Sprint 36B (`885876c`)

| File | Change |
|------|--------|
| `SPRINT36B_TWO_LEVEL_VN_HEATMAP.md` | Sprint doc (added) |
| `components/heatmap/VietnamSectorGridHeatmap.tsx` | Minor wiring |
| `docs/sprint36b/after-1440.png` | Screenshot |
| `docs/sprint36b/after-1920.png` | Screenshot |
| `docs/sprint36b/after-2560.png` | Screenshot |
| `docs/sprint36b/before-fixed-bands.png` | Screenshot |
| `docs/sprint36b/layout-count.json` | Metrics |
| `lib/vietnam/vietnam-sector-grid-layout.ts` | Two-level squarify engine |
| `scripts/sprint36-layout-count.ts` | Audit script updates |
| `scripts/sprint36b-screenshots.mjs` | Screenshot script (added) |

**Note:** Sprint 36B intentionally did **not** change `app/page.tsx`, `app/globals.css`, providers, or sidebars.

---

## Files modified — Sprint 35/36 checkpoint (`4c2ab6c`)

| File | Change |
|------|--------|
| `SPRINT35_36_REBUILD_CHECKPOINT.md` | Checkpoint doc |
| `app/globals.css` | **+94** — `.dashboard-grid`, sticky offsets (labeled Sprint 37) |
| `app/page.tsx` | Grid moved from inline Tailwind → CSS classes |
| `components/heatmap/HeatmapTile.tsx` | Minor |
| `components/heatmap/VietnamSectorGridHeatmap.tsx` | Minor |
| `components/marketwall/header.tsx` | Minor |
| `components/marketwall/heatmap.tsx` | Minor |
| `components/marketwall/sidebar.tsx` | Minor |
| `components/marketwall/vietnam-market-dashboard.tsx` | Minor |
| `docs/sprint36/before-s35-inner-grid.png` | Screenshot |
| `lib/treemap/squarify.ts` | Squarify caps |
| `lib/vietnam/vietnam-sector-grid-layout.ts` | Sector treemap layout (pre-36B) |
| `scripts/sprint36-layout-count.ts` | Added |
| `scripts/sprint36-sector-count.mjs` | Added |

---

## Sprint 37 status

**Aborted / partial — not a separate commit.** Work was folded into `4c2ab6c` as CSS comment `/* Dashboard layout — Sprint 37 root grid + sticky offset */`.

| Intended (Sprint 34 inline spec) | Delivered in 4c2ab6c |
|----------------------------------|----------------------|
| Centralize sticky offset variables | ✅ |
| CSS component classes for grid | ✅ |
| Preserve 220/240/280/300 breakpoint ladder | ❌ |
| Preserve explicit sidebar widths at 1440/1920 | ❌ |
| 1920px third breakpoint | ❌ |

Working tree at audit: **clean** on tracked files (no unstaged layout edits). Untracked artifacts only (audit snapshots, deploy HTML).

---

## Root causes of layout instability

1. **Grid spec drift** — Moving layout from `page.tsx` Tailwind to `globals.css` dropped the 1920px column template and changed 1440px right rail from 280px → 300px and 1024px left rail from 220px → 240px.
2. **Split source of truth** — Sprint docs (34, 32, 29) document inline Tailwind values; runtime uses CSS classes — easy to desync.
3. **Sticky viewport height** — Sidebars at ≥1440 use `height: calc(100vh - offset)` + `overflow-y: auto` (new). Generally correct for trader rails but untested against short viewports / mobile browser chrome.
4. **Not root cause for P1:** Sprint 36B heatmap engine changes — screenshots show grid shell issues independent of tile layout.

---

## Recovery vs rollback

| Option | Verdict |
|--------|---------|
| **Full rollback** to `b5b4b90` | ❌ Discards 36B heatmap improvements for fixable CSS regression |
| **Rollback only `app/page.tsx` + `app/globals.css`** to `b5b4b90` | Possible but loses CSS variable centralization |
| **Recover in place (recommended)** | ✅ Restore Sprint 34 grid values in CSS + optional width hints in `page.tsx` |

---

## Verification checklist (post-P1)

- [ ] `≥1440px`: three columns visible simultaneously (left | center | right)
- [ ] Right rail in column 3, not below center
- [ ] Sticky sidebars align below ticker (no blank band)
- [ ] `1920px`: 250 / 300 sidebar widths
- [ ] `npm run build` passes
- [ ] No changes to heatmap providers or VN layout engine
