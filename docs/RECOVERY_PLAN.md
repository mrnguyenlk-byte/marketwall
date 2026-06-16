# Recovery Plan

**Date:** 2026-06-17  
**Based on:** [PROJECT_RECOVERY_AUDIT.md](./PROJECT_RECOVERY_AUDIT.md)  
**Strategy:** **Recover in place** — fix layout foundation first; do not roll back Sprint 36B.

---

## Answers

### 1. Can the project be recovered?

**Yes.** Build is green on `main`. Layout instability is a **CSS regression** from partial Sprint 37 (commit `4c2ab6c`), not a broken data layer or heatmap algorithm. Recovery is incremental and low blast radius.

### 2. Which files must be fixed?

| Priority | Files | Required? |
|----------|-------|-----------|
| P1 Layout | `app/globals.css`, `app/page.tsx` | **Yes — first** |
| P2 Typography | `components/marketwall/shared.tsx`, section components | After P1 |
| P3 Cards | Widget cards (news, calendar, fear-greed, VN panels) | After P2 |
| P4 Widgets | Normalization pass across `components/marketwall/*` | Last |

**Do not touch in early phases:** `lib/vietnam/vietnam-sector-grid-layout.ts`, `lib/providers/*`, `app/api/*`, GTGD/foreign-flow/volume logic.

### 3. Is rollback recommended?

**No full rollback.** Rolling back to `b5b4b90` or earlier would:

- Lose Sprint 36B two-level squarify VN heatmap (validated, documented, build-green)
- Not address typography/card debt anyway

**Selective rollback** of only grid files is unnecessary if P1 restores the Sprint 34 grid contract in CSS.

### 4. Exact recovery sequence

```
Phase 0 — Audit (this document)                    ✅
Phase 1 — Layout foundation (globals.css + page)   ← NOW
Phase 2 — Typography tokens + SectionHeading adoption
Phase 3 — Card chrome unification (border, padding, shadow)
Phase 4 — Widget normalization + QA screenshots at 1440/1920
Phase 5 — Browser QA + deploy verify (btrading.org)
```

---

## Priority 1 — Layout foundation

**Goal:** Stabilize 3-column grid at `≥1440px` per Sprint 34 contract.

| Task | Detail |
|------|--------|
| Restore column templates | `1024px`: `220px minmax(0,1fr)` · `1440px`: `240px minmax(0,1fr) 280px` · `1920px`: `250px minmax(0,1fr) 300px` |
| Right rail placement | Column 3, row 1 at `≥1440px` |
| Sticky offset | Keep `--dashboard-top-offset` variables (98px / 76px) |
| Sidebar widths | Explicit `min-[1440px]:w-[280px]` / `min-[1920px]:w-[300px]` hints on `page.tsx` as belt-and-suspenders |
| Preserve | CSS class names (`dashboard-grid`, `dashboard-sidebar-*`) — do not revert to full inline Tailwind monolith |

| Attribute | Value |
|-----------|-------|
| **Affected files** | `app/globals.css`, `app/page.tsx` |
| **Risk level** | **Low** — CSS/markup only, no data path |
| **Estimated effort** | 30–60 minutes + build verify |
| **Out of scope** | Heatmap, providers, typography, cards, header redesign |

---

## Priority 2 — Typography foundation

**Goal:** Single readable scale for dashboard sections and tables (12px minimum body in tables per Sprint 34).

| Attribute | Value |
|-----------|-------|
| **Affected files** | `components/marketwall/shared.tsx`, `vietnam-market-dashboard.tsx`, `market-news.tsx`, `economic-calendar.tsx`, `fear-greed.tsx`, `header.tsx` |
| **Risk level** | Medium — visual diff across widgets |
| **Estimated effort** | 2–4 hours |

---

## Priority 3 — Card foundation

**Goal:** Unified panel chrome (`border-border/80 shadow-sm`, consistent padding).

| Attribute | Value |
|-----------|-------|
| **Affected files** | `fear-greed.tsx`, `market-news.tsx`, `economic-calendar.tsx`, `vietnam-market-analytics.tsx`, `currency-strength.tsx`, `broker-highlights.tsx` |
| **Risk level** | Medium |
| **Estimated effort** | 2–3 hours |

---

## Priority 4 — Widget normalization

**Goal:** Spacing, section order, error boundaries, loading skeleton consistency.

| Attribute | Value |
|-----------|-------|
| **Affected files** | `components/marketwall/*`, `components/heatmap/*` (presentation only) |
| **Risk level** | Medium–high — broad surface |
| **Estimated effort** | 4–8 hours + screenshot QA |

---

## Rollback triggers (when to reconsider)

Only consider rollback if:

- P1 build fails repeatedly and cannot be fixed without touching heatmap/providers
- Production 5xx after deploy tied to layout changes (unlikely for CSS-only)
- New evidence shows `vietnam-sector-grid-layout.ts` is corrupt — **not indicated in current audit**

---

## Success criteria

| Phase | Done when |
|-------|-----------|
| P1 | 3-column grid stable at 1440/1920; build green; deployed |
| P2 | All section headers use shared scale; tables ≥12px |
| P3 | All dashboard widgets share card chrome |
| P4 | Sprint 36B screenshots reproducible; no layout regressions in QA |
