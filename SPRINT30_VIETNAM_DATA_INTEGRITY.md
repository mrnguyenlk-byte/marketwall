# Sprint 30 — Vietnam Data Integrity

## Goals

| Priority | Task | Status |
|----------|------|--------|
| **P0** | Audit Top Volume, GTGD, Foreign Flow | ✅ Script + fixes |
| **P1** | Self Trading dashboard (buy / sell / 10-session chart) | ✅ Wired below Foreign Flow |
| **P2** | Expand VN universe 120 → 200 | ✅ 200 seeds, limit 200 |

---

## VPS volume unit & formulas

| Field | VPS raw | MarketWall |
|-------|---------|------------|
| Volume | `lot` (10-share lots) | `volumeLot`, `volume` |
| Shares | — | `volumeShares = lot × 10` |
| GTGD | — | `tradingValue = price × lot × 10` |
| Foreign buy | `fBVol` (lots) | `foreignBuy = fBVol × 10` shares |
| Foreign sell | `fSVolume` (lots) | `foreignSell = fSVolume × 10` shares |

**Canonical helpers:** `lib/vietnam/volume-units.ts`, `lib/vietnam/vn-quote-fields.ts`

**API metadata:** `volumeUnit: "lot10"` on `/api/heatmaps/vietnam` and `/api/vietnam-markets`

---

## Sample calculations (VCB — production audit 2026-06-16)

| Step | Formula | Value |
|------|---------|-------|
| Price | VPS `closePrice` | 61,600 VND |
| Lots | VPS `lot` | 311,000 |
| Shares | 311,000 × 10 | **3,110,000** |
| GTGD | 61,600 × 311,000 × 10 | **191,576,000,000 VND** |
| Foreign buy | fBVol 46,190 × 10 | **461,900 shares** |
| Foreign sell | fSVolume 117,596 × 10 | **1,175,960 shares** |

MarketWall heatmap vs VPS: **Excellent** (&lt;1% diff) on all 8 audit symbols.

---

## P0 — Volume audit

### Ranking rule
- Sort by **`volumeShares`** (not raw lots).
- Leaderboard displays shares + lot subtitle.

### Fix (Sprint 30)
- `buildDashboardFromHeatmapStocks()` now ranks **live VPS symbols only** (`liveSymbols` filter) — excludes mock seed volumes polluting Top Volume (e.g. UPCOM HAI seed lots).
- Mock dashboard uses `enrichVnQuoteVolume()` for consistent share-based ranking.

### Production verification (pre-deploy `btrading.org`)

```bash
node scripts/vn-data-integrity-audit.mjs
```

| Check | Result |
|-------|--------|
| 8-symbol volumeShares vs VPS | ✅ Excellent |
| Top Volume monotonic | ✅ |
| Top Volume vs VPS (top 5) | ⚠️ Failed — rows used lots in `volume`, mock seeds in ranking |
| **After deploy** | Live-only filter + `volumeShares` on rows |

---

## P0 — GTGD (Trading Value) audit

### Ranking rule
- Sort by `tradingValue` / dashboard `value` field.
- Prefer VPS `value` when &gt; 0, else `price × lot × 10`.

### Production verification

| Check | Result |
|-------|--------|
| 8-symbol GTGD vs VPS | ✅ Excellent |
| Top Value monotonic | ✅ |
| Top Value vs VPS (top 5) | ✅ Pass |

**Example (HPG):** 24,350 × 1,414,580 × 10 = **344,450,230,000 VND** — matches VPS exactly.

---

## P0 — Foreign Flow audit

### Rules
- VPS: `fBVol` / `fSVolume` are lots → multiply × 10 for shares.
- Values: `foreignBuyValue = foreignBuy × price` (rounded).
- Leaderboards: Top Foreign Buy / Sell sorted by share volume.

### Production verification

| Check | Result |
|-------|--------|
| 8-symbol foreign buy/sell vs VPS | ✅ Excellent |
| Top Foreign Buy monotonic + VPS match | ✅ |
| Top Foreign Sell monotonic + VPS match | ✅ |

**Example (HPG foreign buy):** fBVol 635,560 lots → **6,355,600 shares**

---

## P1 — Self Trading (Proprietary) dashboard

Placed **below Foreign Flow** in `VietnamMarketDashboard`:

| Section | Component | Data source |
|---------|-----------|-------------|
| **A. Top Proprietary Buy** | `ProprietaryTradingChart` → `topBuy` | CafeF EOD → `ProprietaryTradingDaily` DB |
| **B. Top Proprietary Sell** | `ProprietaryTradingChart` → `topSell` | Same |
| **C. 10-session Net Buy chart** | `ProprietaryTradingChart` → `history` | Last 10 session dates from DB |

**Pipeline:**
1. `lib/providers/proprietary/cafef-provider.ts` — fetch CafeF GDTuDoanh EOD
2. `lib/proprietary/sync-cafef-eod.ts` — persist to Prisma
3. `lib/proprietary/analytics-from-db.ts` — `loadProprietaryAnalyticsFromDb()`
4. `vietnam-market-provider.ts` — merges into `analytics.proprietary`

**Empty state:** Shown when DB has no EOD rows (`proprietaryTrading.unavailable`).

**Sync:** `POST /api/sync/proprietary-eod` or `node scripts/sync-proprietary-eod.mjs`

---

## P2 — Universe expansion (200 symbols)

| Metric | Before | After |
|--------|--------|-------|
| `VN_HEATMAP_LIMIT` | 120 | **200** |
| Seed universe | ~160 | **200** |
| VPS batches | 4 × 40 | **5 × 40** |

### Sector coverage (200 seeds)

| Sector | Count | Requirement |
|--------|-------|-------------|
| Banking | **26** | 15–20 ✅ |
| Real Estate | **32** | 15–20 ✅ |
| Securities + Brokerage | **29** | 10–15 ✅ |
| Steel | 7 | leaders included |
| Oil & Gas + Energy | 17 | leaders included |

**Extension file:** `lib/vietnam/vietnam-seed-extensions.ts` (+45 leaders)

**Count script:** `node scripts/count-vn-seeds.mjs`

---

## Audit script

```bash
node scripts/vn-data-integrity-audit.mjs
# MW_API_BASE=https://btrading.org (default)
```

Outputs:
- Per-symbol volume / GTGD / foreign checks (Excellent/Good/…)
- Ranking monotonicity + VPS cross-check for Top Volume, Top Value, Foreign Buy/Sell
- Summary flags `p0_*`

---

## Files changed

| File | Change |
|------|--------|
| `lib/vietnam/vn-dashboard-from-vps.ts` | Live-only ranking; volumeShares on rows |
| `lib/providers/vietnam-market-provider.ts` | Mock dashboard uses enrich helpers; pass `liveSymbols` |
| `lib/vietnam/vietnam-seed-extensions.ts` | +45 sector leaders (P2) |
| `config/heatmap-symbols.ts` | `VN_HEATMAP_LIMIT = 200` |
| `scripts/vn-data-integrity-audit.mjs` | Full P0 audit (volume, GTGD, foreign, rankings) |
| `scripts/count-vn-seeds.mjs` | Seed universe counter |
| `components/marketwall/proprietary-trading-chart.tsx` | Self Trading UI (existing, documented) |
| `lib/proprietary/analytics-from-db.ts` | Proprietary top buy/sell + history (existing) |

---

## Build result

```
npm run build
✓ Compiled successfully
✓ TypeScript passed
VPS batches: 5 (200 symbols)
Exit code: 0
```

---

## Post-deploy verification checklist

- [ ] `GET /api/heatmaps/vietnam` → `itemCount: 200`, `volumeUnit: "lot10"`
- [ ] `GET /api/vietnam-markets` → `dashboard.topVolume[0].volumeShares` present
- [ ] Top Volume #1 is a liquid HOSE/HNX name (not mock UPCOM seed)
- [ ] Run `node scripts/vn-data-integrity-audit.mjs` → all `p0_*` true
- [ ] Self Trading section shows data after `sync-proprietary-eod` (or empty state)

---

## Production snapshot (2026-06-16, before this deploy)

| Endpoint | Observation |
|----------|-------------|
| `/api/heatmaps/vietnam` | `source: live`, `itemCount: 80`, `volumeUnit: lot10` |
| 8-symbol accuracy | Volume, GTGD, Foreign: **Excellent** |
| Top Value / Foreign rankings | **Pass** |
| Top Volume ranking | **Fail** — mock seed + lots-as-shares (fixed locally) |

**Action:** Deploy to apply 200-symbol universe and Top Volume fix.
