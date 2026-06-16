# Sprint 35 + 36 — Rebuild Checkpoint

**Date:** 2026-06-16  
**Scope:** Stabilize Vietnam sector heatmap work (Sprint 35 grid shell + Sprint 36 per-sector treemap). No new features, no provider changes.  
**Base commit:** `b5b4b90` — *Sprints 34-35: dashboard layout stabilization and Vietnam sector grid heatmap.*

---

## 1. Environment cleanup

| Action | Result |
|--------|--------|
| Killed duplicate `next dev` / `next start` on 3000, 3001, 3010–3013, 3099–3110 | ✅ |
| Killed stale `.next/dev/postcss.js` workers | ✅ |
| Kept Prisma Studio (`prisma studio`) | ✅ |
| Kept **one** production preview on **port 3015** | ✅ |
| Did **not** kill Cursor / DB connections | ✅ |

**Active preview:** `npx next start -p 3015` — HTTP **200** on `/`, `/api/health`, `/api/heatmaps/vietnam`, `/api/vietnam-markets`.

---

## 2. Git state (pre-commit)

**Branch:** `main` (up to date with `origin/main`)

**Modified (10 files, unstaged):**

| File | Δ |
|------|---|
| `app/globals.css` | +94 |
| `app/page.tsx` | +11 |
| `components/heatmap/HeatmapTile.tsx` | ±4 |
| `components/heatmap/VietnamSectorGridHeatmap.tsx` | ±4 |
| `components/marketwall/header.tsx` | ±6 |
| `components/marketwall/heatmap.tsx` | ±4 |
| `components/marketwall/sidebar.tsx` | ±2 |
| `components/marketwall/vietnam-market-dashboard.tsx` | ±6 |
| `lib/treemap/squarify.ts` | +99 |
| `lib/vietnam/vietnam-sector-grid-layout.ts` | +263/−161 |

**Untracked (not all staged):**

- Sprint artifacts: `docs/sprint36/before-s35-inner-grid.png`, `scripts/sprint36-layout-count.ts`, `scripts/sprint36-sector-count.mjs`
- Excluded from commit: `.deploy-home-*.html`, `FEAR_GREED_AUDIT.md`, `SPRINT12_DEPLOY_VERIFICATION.md`, `scripts/probe-cafef-proprietary.mjs`, `scripts/sprint21-audit-output.json`, `sprint31-audit.txt`, `sprint31-snapshot.json`

**Recent log:**

```
b5b4b90 Sprints 34-35: dashboard layout stabilization and Vietnam sector grid heatmap.
48b8467 Sprints 32-33: dashboard UX polish and public beta readiness.
a582776 Sprints 29-31: heatmap refinement, compact header, VN data integrity, and trader tables.
```

Nothing discarded.

---

## 3. Build

```bash
npm run build
```

**Result:** ✅ **PASS** (Prisma generate + Next.js 16.2.6 Turbopack, TypeScript clean)

Build-time provider warnings (VPS/TCBS dynamic fetch during SSG) are pre-existing; no build failures.

---

## 4. Local preview

| Check | Result |
|-------|--------|
| `http://localhost:3015` | **200** (~187 KB HTML) |
| `/api/health` | **200** |
| `/api/heatmaps/vietnam` | **200** |
| `/api/vietnam-markets` | **200** |

---

## 5. Sprint 35 verification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| `VietnamSectorGridHeatmap.tsx` exists | ✅ | `components/heatmap/VietnamSectorGridHeatmap.tsx` |
| `vietnam-sector-grid-layout.ts` exists | ✅ | `lib/vietnam/vietnam-sector-grid-layout.ts` |
| VN + `sector` grouping → `VietnamSectorGridHeatmap` | ✅ | `MarketHeatmap.tsx` L54–62 |
| US / Crypto → `FinvizTreemap` | ✅ | `MarketHeatmap.tsx` L65–73 |
| VN **Theo vốn hóa** (`marketCap` grouping) → flat treemap | ✅ | Falls through to `FinvizTreemap` when `groupingMode !== "sector"` |
| Providers / APIs unchanged in working tree | ✅ | No diffs under `lib/providers/` or `app/api/` |

---

## 6. Sprint 36 verification

### Finding: **B) Treemap inside each sector** (not pure CSS grid packing)

The outer shell uses a **fixed two-row sector band layout** (`splitHorizontal` on row 1 / row 2). **Inside each sector block**, stocks are laid out with **`squarifyWithOrientation`** (`layoutSectorTreemap` → `squarifySectorItems`).

| Sprint 36 constraint | Status | Notes |
|------------------------|--------|-------|
| Per-sector treemap only | ✅ | `layoutSectorBlock` → `layoutSectorTreemap` |
| Max tile cap ≤ 15% of sector area | ✅ | `MAX_TILE_IN_SECTOR = 0.12` (12%); fallback attempt uses `0.10` |
| No hover expansion | ✅ | `HeatmapTile` — tooltip only, no `scale` / `hover:scale` |
| No wheel zoom on VN sector view | ✅ | Zoom/pan controls live in `FinvizTreemap` only (US/Crypto / VN marketCap mode) |
| Click → modal | ✅ | `onTileClick` wired from `MarketHeatmap` → `HeatmapTile` button |

**Not unfinished grid packing** — inner stock layout is already treemap-based. Remaining work is polish/QA (Sprint 36B), not a layout paradigm rewrite.

---

## 7. UI verification (localhost:3015)

| Area | Method | Result |
|------|--------|--------|
| Home page loads | HTTP 200 | ✅ No 5xx |
| VN heatmap section | SSR HTML grep | ✅ "Thép", foreign-flow / proprietary section markers present |
| Sector labels | Client-rendered (`data-grouping="sector-treemap"`) | ⚠️ Not in SSR HTML; requires browser hydration (MCP browser tab unavailable this session) |
| Sidebars / tables / foreign flow / proprietary | SSR markers | ✅ Foreign flow + proprietary strings found in HTML |
| Crash | HTTP + API smoke | ✅ No crash observed |

**Browser MCP:** Tab could not be opened in this session; verification relied on HTTP + HTML smoke tests + code audit.

---

## 8. Modified files summary

**Sprint heatmap / layout (staged in checkpoint commit):**

- `app/globals.css`, `app/page.tsx`
- `components/heatmap/HeatmapTile.tsx`, `VietnamSectorGridHeatmap.tsx`
- `components/marketwall/header.tsx`, `heatmap.tsx`, `sidebar.tsx`, `vietnam-market-dashboard.tsx`
- `lib/treemap/squarify.ts`, `lib/vietnam/vietnam-sector-grid-layout.ts`
- `docs/sprint36/before-s35-inner-grid.png`
- `scripts/sprint36-layout-count.ts`, `scripts/sprint36-sector-count.mjs`
- `SPRINT35_36_REBUILD_CHECKPOINT.md` (this file)

---

## 9. Complete vs incomplete

| Sprint | Status |
|--------|--------|
| **Sprint 35** — VN sector grid shell, routing, Finviz for US/Crypto/marketCap | **Complete** (in working tree, build green) |
| **Sprint 36** — Per-sector squarify treemap, tile caps, no zoom/hover expand | **Largely complete** — layout logic shipped; visual QA + edge-case tuning remain |
| **Sprint 36B** — Polish, screenshot parity, browser QA | **Not started / incomplete** |

---

## 10. Safe to continue Sprint 36B?

**Yes.** Build passes, preview serves 200, Sprint 36 is **B (treemap-inside-sector)** not unfinished grid packing. No provider drift. Recommended next steps:

1. Browser QA on VN sector view (labels, tile density, "Khác" buckets, modal on click).
2. Run `scripts/sprint36-layout-count.ts` against live `/api/heatmaps/vn` and record max aspect / max share metrics.
3. Compare against `docs/sprint36/before-s35-inner-grid.png` for visual regression.
4. When ready: deploy workflow per sprint rule (build → commit → push → Vercel verify).

---

## 11. Blockers

| Blocker | Severity |
|---------|----------|
| Browser MCP tab unavailable for full hydrated UI pass | Low — manual browser check recommended |
| Build-time VPS/TCBS fetch warnings during SSG | Pre-existing, non-blocking |
| None blocking commit or local preview | — |

**Push:** Not performed (checkpoint commit only, per instructions).
