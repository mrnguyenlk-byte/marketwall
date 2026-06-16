# Sprint 24 — Responsive 3-Column Layout Fix

**Date:** 2026-06-16  
**Scope:** Stable trader layout — left banners/watchlist, center heatmap, right F&G/news/calendar always present on desktop  
**Build:** `npm run build` ✅

---

## Problem

| Window width | Before (Sprint 20–23) | Issue |
|--------------|----------------------|-------|
| `< xl` (<1280px) | Left sidebar + center; right below | OK on tablet |
| `≥ xl` (≥1280px) | **Left hidden** (`xl:hidden`); 78/22 heatmap + right only | Banners/watchlist disappear |
| Mid-desktop | Inconsistent column count | Trader loses either left or right rail |

Root cause: `xl:grid-cols-[39fr_11fr]` two-column grid and `xl:hidden` on the left `<aside>`.

---

## Solution

Single DOM tree with CSS Grid + `order` — no conditional rendering, no duplicate sidebars.

### Grid template

```css
/* Desktop ≥1280px */
grid-template-columns: minmax(240px, 260px) minmax(0, 1fr) minmax(280px, 300px);

/* Tablet 1024–1279px */
grid-template-columns: minmax(240px, 260px) minmax(0, 1fr);
```

Tailwind classes:

```
grid-cols-1
lg:grid-cols-[minmax(240px,260px)_minmax(0,1fr)]
xl:grid-cols-[minmax(240px,260px)_minmax(0,1fr)_minmax(280px,300px)]
```

### Column assignment

| Region | Content | `xl` (≥1280) | `lg` (1024–1279) | `<lg` (<1024) |
|--------|---------|--------------|------------------|---------------|
| **Left** | 2 banners + watchlist (+ market overview) | col 1, sticky | col 1, sticky | order 1, full width |
| **Center** | Heatmap + VN dashboard + analytics + below | col 2 | col 2 row 1 | order 2 |
| **Right** | Fear & Greed + Breaking News + Calendar | col 3, sticky | col 2 row 2 (below center) | order 3 |

### Rules enforced

1. Left sidebar **never hidden** on desktop (`xl:hidden` removed).
2. Right sidebar **always in DOM** — moves below center on `lg`, third column on `xl`.
3. Center uses `minmax(0, 1fr)` — flex priority, no overflow.
4. `overflow-x-hidden` on `<main>` — no horizontal scroll.
5. `min-w-0` on all three columns — prevents grid blowout.
6. Left/right sidebars: `sticky top-[104px]` when in sidebar column mode.

---

## Files changed

| File | Change |
|------|--------|
| `app/page.tsx` | 3-column grid at `xl`; 2-column at `lg`; single column below `lg`; removed `xl:hidden` and `39fr_11fr`; CSS `order` for mobile stack |
| `components/marketwall/sidebar.tsx` | Banner/sidebar width `w-full min-w-0 max-w-full` (fits 240–260px column without overflow) |

---

## Breakpoint behavior

### ≥1280px — 3 columns (desktop trader)

```
┌──────────┬─────────────────────────────┬────────────┐
│ Banners  │                             │ Fear&Greed │
│ Watchlist│         HEATMAP             │ News       │
│ Overview │                             │ Calendar   │
│ 240–260px│      flex (1fr)             │ 280–300px  │
└──────────┴─────────────────────────────┴────────────┘
         VN Dashboard / Analytics below heatmap
```

### 1024px–1279px — 2 columns

```
┌──────────┬─────────────────────────────┐
│ Banners  │         HEATMAP             │
│ Watchlist│                             │
│          │   VN Dashboard / Analytics  │
├──────────┴─────────────────────────────┤
│ Fear&Greed │ News │ Calendar (stacked)  │
└────────────────────────────────────────┘
```

### <1024px — single column

```
Banners + Watchlist
HEATMAP
VN sections
Fear & Greed
Breaking News
Calendar
```

---

## Column widths (desktop)

| Column | Spec | CSS |
|--------|------|-----|
| Left | 240px–280px (implemented 240–260) | `minmax(240px, 260px)` |
| Center | Flexible, max priority | `minmax(0, 1fr)` |
| Right | 280px–320px (implemented 280–300) | `minmax(280px, 300px)` |

Approximate center width at common resolutions (minus padding/gap):

| Viewport | Left | Center (~) | Right |
|----------|------|------------|-------|
| 1280px | 260px | ~680px | 280px |
| 1440px | 260px | ~820px | 300px |
| 1920px | 260px | ~1300px | 300px |
| 2560px | 260px | ~1940px | 300px |

---

## Screenshots checklist

Manual verification after `npm run dev`:

| Resolution | Check |
|------------|-------|
| **1280×720** | 3 columns visible; no horizontal scroll; left banners readable at 260px |
| **1440×900** | 3 columns; heatmap fills center; right rail sticky |
| **1920×1080** | 3 columns; VN analytics reachable with minimal scroll |
| **2560×1440** | 3 columns; no overlap; center expands, sidebars stay fixed width |

Per breakpoint:

- [ ] **1280px** — left + center + right all visible
- [ ] **1440px** — same, wider center heatmap
- [ ] **1920px** — trader layout stable
- [ ] **2560px** — ultrawide: sidebars fixed, center scales
- [ ] **1024px** — 2-col: left + center; right below heatmap block
- [ ] **768px** — single column stack order correct

---

## Regression notes

- Sprint 20 removed left sidebar on `xl+`; **Sprint 24 restores it** while keeping Sprint 23 heatmap height caps and symbol limits.
- Right rail still uses `FearGreed variant="sidebar"` compact gauges.
- No duplicate `<FearGreed>` / `<Sidebar>` instances — one mount each.
