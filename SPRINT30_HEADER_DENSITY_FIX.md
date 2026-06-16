# Sprint 30 — Header Density & Top Layout Cleanup

## Goal

Remove wasted vertical space at the top of the trading dashboard and make the header + ticker chrome more compact.

## Before / after header heights

| Row | Before | After |
|-----|--------|-------|
| **Row 1** (logo + search + utilities) | `h-20` (80px), logo 76px, centered search | `h-11` (44px), logo 36px, search right-aligned |
| **Row 2** (navigation) | `h-10` (40px), `text-sm`, `py-2` links | `h-[26px]`, `text-xs`, compact links |
| **Row 3** (live ticker) | Separate block below header, `py-2` items | Inside header, `max-h-7` (28px), `compact` mode |
| **Gap: header → dashboard** | `py-3` main (12px) + sticky offset `104px` | `pt-1.5` main (6px) + sticky offset `98px` |
| **Total chrome (dashboard)** | ~**132px** header+ticker + 12px margin ≈ **144px** | ~**98px** chrome + 6px margin ≈ **104px** |

**Vertical space saved:** ~**40px** before dashboard content starts.

## Layout structure (after)

```
┌─────────────────────────────────────────────────────────────┐
│ Row 1 (44px): [Logo]              [Search][Lang][Theme][Auth]│
├─────────────────────────────────────────────────────────────┤
│ Row 2 (26px):     Tổng quan  |  Nền tảng  |  Liên hệ         │
├─────────────────────────────────────────────────────────────┤
│ Row 3 (28px): LIVE │ VNINDEX … SPX … BTC … (scrolling)      │
└─────────────────────────────────────────────────────────────┘
│ Dashboard grid (6px top padding)                              │
│ [Left 220px] [Heatmap flex] [Right 220px @ ≥1440px]         │
```

## Changes

### 1. Search moved right
- Removed 3-column centered grid (`grid-cols-[1fr_auto_1fr]`).
- Search sits in the **right cluster** next to language, theme, and login/register.
- On narrow screens, search stacks below controls in the same row block (full width, `h-8`) without large whitespace.

### 2. Ticker integrated into header
- `TickerBar` rendered as **Row 3** inside `Header` when `tickerItems` prop is passed (dashboard only).
- Other pages (`/login`, `/brokers`, etc.) keep header without ticker row.

### 3. Reduced padding
- Header horizontal padding: `px-3 sm:px-4 lg:px-6` (was `px-8 lg:px-12`).
- Main top padding: `pt-1.5` (6px).
- Grid gap: `lg:gap-3` (was `lg:gap-4`).

### 4. Sticky sidebar offset
- Sidebars: `top-[98px]` (was `top-[104px]`) to match compact chrome.

### 5. Elements preserved
Logo, search, language, theme, login/register, navigation, live ticker — all retained.

## Files changed

| File | Change |
|------|--------|
| `components/marketwall/header.tsx` | 3-row compact header; search right; optional ticker row |
| `components/marketwall/ticker-bar.tsx` | `compact` prop; 28px max height; tighter item padding |
| `components/marketwall/data-skeletons.tsx` | Compact ticker skeleton |
| `components/marketwall/theme-toggle.tsx` | `size-8` icon button |
| `app/page.tsx` | Pass `tickerItems` to Header; reduce main padding; update sticky offset |

## Screenshot checklist

Capture at **1440×900** and **390×844** (mobile):

- [ ] Search is on the **right**, adjacent to language selector
- [ ] Logo row ≤ 48px tall
- [ ] Nav row compact (~26px)
- [ ] Ticker sits directly under nav with minimal gap
- [ ] No large blank band above left banners at desktop
- [ ] No large blank band above Fear & Greed panel at ≥1440px
- [ ] Heatmap top edge close to ticker strip
- [ ] Mobile: search stacks without excessive top whitespace

## Build result

```
npm run build
✓ Compiled successfully
✓ TypeScript passed
Exit code: 0
```

## Verification

```bash
npm run dev
# Open http://localhost:3000
# Measure header with DevTools → Elements → computed height on <header>
```

Expected sticky chrome height: **98px** on dashboard (44 + 26 + 28).
