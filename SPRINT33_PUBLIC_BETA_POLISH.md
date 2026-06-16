# Sprint 33 — Public Beta Polish

**Date:** 2026-06-16  
**Scope:** Stabilize VN dashboard for public beta — no new large features  
**Build:** `npm run build` ✅ (local, uncommitted changes)

---

## Summary

Sprint 33 closes the last visible UX/data gaps before public beta: proprietary EOD is live on production, treemap squarify is tightened, VN leaderboards are narrower (4 columns), the symbol modal hides empty sections, and header readability is improved.

---

## P0 — Proprietary Trading EOD

### Migration

```bash
npx prisma migrate deploy
```

**Result:** ✅ No pending migrations (3 migrations applied on Neon `neondb`).

### EOD sync

```bash
SYNC_BASE_URL=https://btrading.org node scripts/sync-proprietary-eod.mjs --force
```

**Result:** ✅ Success

| Field | Value |
|-------|-------|
| `ok` | `true` |
| `rowsUpserted` | `1769` |
| `exchanges` | HOSE, HNX, UPCOM |
| `dateRange` | 05/17/2026 → 06/16/2026 |

### Production verification — `GET /api/vietnam-markets`

**Verified:** 2026-06-16T14:22:25Z @ `https://btrading.org`

| Check | Expected | Actual |
|-------|----------|--------|
| `analytics.proprietary.available` | `true` | ✅ `true` |
| `source` | `"cafef"` | ✅ `"cafef"` |
| `history.length` | `> 0` | ✅ `10` |
| `topNetBuy.length` | `> 0` | ✅ `10` |
| `topNetSell.length` | `> 0` | ✅ `10` |

**Blocker cleared:** Proprietary trading was the last P0 functional blocker from Sprint 31.

---

## P1 — Heatmap treemap correction

### Algorithm audit

| Component | Role |
|-----------|------|
| `lib/treemap/squarify.ts` | Bruls–Huizing–van Wijk squarified layout |
| `lib/treemap/heatmap-engine.ts` | `sqrt(metric)` sizing, leaf cap, sector/group packing via `squarifyGroups` |
| `components/heatmap/FinvizTreemap.tsx` | Absolute-positioned leaves; tooltip-only hover |
| `components/heatmap/MarketHeatmap.tsx` | Routes all markets through `FinvizTreemap` (not legacy `SectorTreemap` flex strips) |

**Root cause of horizontal strips:** On wide aspect-ratio cells, default `w >= h` orientation favored horizontal row slicing, producing long shallow bands. `squarifyGroups` also used `14 / rect.h` for header height (invalid in normalized 0–1 coords).

### Fixes applied

| Change | Before | After |
|--------|--------|-------|
| `MAX_LEAF_AREA_FRACTION` | `0.12` | **`0.10`** |
| Orientation | `remaining.w >= remaining.h` | **`chooseOrientation()`** — vertical slice when `w/h > 2.2` |
| Group header height | `min(h * ratio, 14/h)` | **`min(h * ratio, 0.032)`** normalized |
| Hover | Tooltip only | **175ms delay**, no resize/brightness/z-index |
| Click | Opens modal | Unchanged |

Sizing: `sqrt(metric)` preserved.

---

## P2 — Compact VN leaderboards

### Before → After

| | Before (Sprint 32) | After (Sprint 33) |
|--|-------------------|-------------------|
| **Top Volume cols** | #, Mã, Giá, %, KL | **#, Mã, %, KL** |
| **Top GTGD cols** | #, Mã, Giá, %, GTGD | **#, Mã, %, GTGD** |
| **Price** | In table | **Tooltip + modal only** |
| **Rows** | 15 | **18** |
| **Row height** | 28–32px | **28–30px** |

**File:** `components/marketwall/vietnam-market-dashboard.tsx`, `lib/vietnam/vn-dashboard-from-vps.ts`

Grid: `1.25rem 2.75rem minmax(2.25rem,1fr) minmax(3.5rem,1fr)` — tabular numerics, right-aligned % and metric columns.

---

## P3 — Symbol modal cleanup

**File:** `lib/market/asset-detail-availability.ts` + modal components

### Hidden when unavailable

- `null` / `undefined` / `0` (when 0 = no data)
- Empty arrays (shareholders, historical)
- Synthetic OHLC from heatmap-only quotes
- Tabs: Hồ sơ, Cổ đông, Tài chính, Giá quá khứ — only if real data exists
- Chart tab — only when VN native chart API returns bars or TradingView loads (US/crypto)
- No N/A, No Data, Coming Soon, empty tables, or VN chart placeholder without data

### Vietnam modal typically shows

- Header: symbol, price, change %, exchange
- **Tổng quan** with live stats (volume, GTGD, sector, foreign flow when present)
- **Biểu đồ** only when `/api/vietnam/chart/[symbol]` returns bars

---

## P4 — Header readability

**File:** `components/marketwall/header.tsx`

| Element | Before | After |
|---------|--------|-------|
| Desktop logo | 48px | **54px** |
| Mobile logo | 36px | 36px (unchanged) |
| Nav font | `text-xs` / `13px` | **`text-[13px]` / `text-sm`** (~+15%) |
| Header height | `md:h-12` | Unchanged — no extra whitespace |

---

## P5 — Production verification

### APIs @ `https://btrading.org` (2026-06-16)

**`GET /api/heatmaps/vietnam`**

| Check | Result |
|-------|--------|
| `source` | ✅ `live` |
| `itemCount` | ✅ `200` (≥ 180) |
| `volumeUnit` | ✅ `lot10` |

**`GET /api/vietnam-markets`**

| Check | Result |
|-------|--------|
| Top Volume (live VPS) | ✅ SHB, VIX, SSI, VND, POW… |
| Top Value (GTGD) | ✅ VIX, SHB, SSI, VIC, FPT… |
| `foreignFlow.available` | ✅ `true` |
| `proprietary.available` | ✅ `true` (`cafef`) |

**UI (production HTML)**

| Check | Result |
|-------|--------|
| `html lang` | ✅ `vi` |
| Sprint 33 UI polish | ⏳ **Pending deploy** — local build only |

Run after deploy: `node scripts/sprint33-verify.mjs`

---

## Build result

```
npm run build
✓ Compiled successfully
✓ TypeScript passed
Exit code: 0
```

---

## Files changed (Sprint 32–33 cumulative, uncommitted)

| File | Sprint 33 change |
|------|------------------|
| `lib/treemap/squarify.ts` | Orientation guard, normalized group headers |
| `lib/treemap/heatmap-engine.ts` | Max tile cap 10% |
| `lib/vietnam/vn-dashboard-from-vps.ts` | 18 leaderboard rows |
| `components/marketwall/vietnam-market-dashboard.tsx` | 4-column tables, no price col |
| `components/marketwall/header.tsx` | Logo 54px, nav font bump |
| `lib/market/asset-detail-availability.ts` | Modal/tab visibility rules |
| `components/heatmap/*` | Modal, chart, tooltip polish |
| `lib/market/heatmap-assets.ts` | VN foreign fields passthrough |

---

## Remaining blockers

| Item | Severity | Notes |
|------|----------|-------|
| **Deploy Sprint 32–33 UX** | Medium | Changes local only; production still on `a582776` |
| **UI screenshots @ 1440/1920/2560** | Low | Post-deploy visual QA |
| **VN chart tab coverage** | Low | Only symbols with Entrade bar history show chart |
| **Proprietary EOD cron** | Low | Manual sync works; schedule post-close automation for ops |

---

## Public beta readiness

| Area | Score | Notes |
|------|-------|-------|
| VN heatmap / APIs | 9/10 | Live VPS, 200 symbols |
| Leaderboards | 9/10 | Compact 4-col after deploy |
| Foreign flow | 9/10 | Live |
| Proprietary | **9/10** | ✅ EOD synced, CafeF source live |
| Modal / UX polish | 8/10 | Logic complete; needs deploy + screenshots |
| **Overall** | **~92/100** | Ready for beta after deploy |

---

## Next step

Commit and push Sprint 32–33 changes, deploy to Vercel, re-run `node scripts/sprint33-verify.mjs`, and capture viewport screenshots at 1440 / 1920 / 2560.
