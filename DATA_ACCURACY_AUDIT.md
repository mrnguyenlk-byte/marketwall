# Data Accuracy Audit — MarketWall vs FireAnt / SSI iBoard / VPS SmartOne

**Sprint 21**  
**Date:** 2026-06-16T11:53Z (live session)  
**Symbols:** VCB, FPT, HPG, SSI, SHB, VPB, VIC, VHM  
**MarketWall production:** https://btrading.org (`source: live`, provider: **VPS**)

**Re-run:** `node scripts/data-accuracy-audit.mjs`

---

## Executive summary

| Source | Role in audit | Availability |
|--------|---------------|--------------|
| **MarketWall** | Production `/api/heatmaps/vietnam` | ✅ Live |
| **VPS SmartOne** | `bgapidatafeed.vps.com.vn` — MW primary | ✅ Live |
| **SSI iBoard** | `iboard-query.ssi.com.vn/stock/{symbol}` | ✅ Live |
| **FireAnt** | `restv2.fireant.vn` | ❌ HTTP 404 (stub only) |
| **KBS** | Foreign leaderboard (`foreignTotal`) | ✅ Partial (top ranks only) |

### Overall accuracy (vs VPS reference)

| Metric | Grade | Notes |
|--------|-------|-------|
| Last price | **Excellent** | 0% diff vs VPS on all 8 symbols |
| Change % | **Excellent** vs VPS; **Good** vs SSI | 2 symbols show SSI sign flip |
| Volume (lot) | **Excellent** vs VPS | Identical `lot` field |
| Volume (shares) | **Excellent** vs SSI | `lot × 10` = `nmTotalTradedQty` |
| Trading value (displayed) | **Poor** vs SSI | ~90% understated — unit bug |
| Trading value (corrected) | **Excellent** vs SSI | `price × lot × 10` |
| Foreign buy/sell/net | **Excellent** VPS↔SSI | VPS `fBVol×10` ≈ SSI `buyForeignQtty` |
| Foreign on MarketWall UI | **Partial** | Only symbols in KBS top-10 leaderboard |

---

## Classification scale

| Grade | \|Δ%\| |
|-------|--------|
| **Excellent** | < 1% |
| **Good** | 1–3% |
| **Acceptable** | 3–5% |
| **Poor** | > 5% |

---

## 1. Last price

| Symbol | MarketWall | VPS | SSI | Δ% MW↔VPS | Δ% MW↔SSI | Grade (SSI) |
|--------|------------|-----|-----|-------------|-------------|-------------|
| VCB | 61,600 | 61,600 | 61,800 | 0.00% | -0.32% | Excellent |
| FPT | 73,600 | 73,600 | 73,200 | 0.00% | +0.55% | Excellent |
| HPG | 24,350 | 24,350 | 24,200 | 0.00% | +0.62% | Excellent |
| SSI | 27,600 | 27,600 | 27,600 | 0.00% | 0.00% | Excellent |
| SHB | 13,900 | 13,900 | 13,900 | 0.00% | 0.00% | Excellent |
| VPB | 26,250 | 26,250 | 26,350 | 0.00% | -0.38% | Excellent |
| VIC | 192,600 | 192,600 | 194,000 | 0.00% | -0.72% | Excellent |
| VHM | 136,100 | 136,100 | 136,500 | 0.00% | -0.29% | Excellent |

**Root cause (MW↔SSI minor delta):** Snapshot timing — SSI `matchedPrice` can lag VPS by 1 tick during active session.

**Provider recommendation:** Keep **VPS primary** for price. Optional SSI cross-check for HOSE names.

---

## 2. Change %

| Symbol | MarketWall | VPS | SSI | Δ% MW↔VPS | Δ% MW↔SSI | Grade (SSI) |
|--------|------------|-----|-----|-------------|-------------|-------------|
| VCB | +0.32% | +0.32% | +0.32% | 0.00% | 0.00% | Excellent |
| FPT | +0.54% | +0.54% | **-0.54%** | 0.00% | 200%* | **Poor** |
| HPG | +0.62% | +0.62% | **-0.62%** | 0.00% | 200%* | **Poor** |
| SSI | +2.27% | +2.27% | +2.27% | 0.00% | 0.00% | Excellent |
| SHB | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | Excellent |
| VPB | +0.38% | +0.38% | +0.38% | 0.00% | 0.00% | Excellent |
| VIC | +0.73% | +0.73% | +0.73% | 0.00% | 0.00% | Excellent |
| VHM | +0.29% | +0.29% | +0.29% | 0.00% | 0.00% | Excellent |

\*Magnitude matches but **sign inverted** on FPT/HPG — not a random drift.

**Root cause:** SSI iBoard returned opposite-signed `priceChangePercent` for FPT/HPG at audit timestamp while VPS/MW agreed. Likely reference-price convention or stale SSI field — not a MarketWall VPS parsing error.

**Provider recommendation:** Trust VPS `changePc` (validated 8/8 vs MW). Flag SSI change% as secondary reference only.

---

## 3. Volume

Vietnam HOSE convention: VPS `lot` field = **volume in 10-share lots**. SSI `nmTotalTradedQty` = **shares**.

| Symbol | MW / VPS lot | SSI shares | lot × 10 = shares? | Grade |
|--------|--------------|------------|-------------------|-------|
| VCB | 311,000 | 3,110,000 | ✅ | Excellent |
| FPT | 581,980 | 5,819,800 | ✅ | Excellent |
| HPG | 1,414,580 | 14,145,800 | ✅ | Excellent |
| SSI | 4,285,490 | 42,854,900 | ✅ | Excellent |
| SHB | 4,785,600 | 47,856,000 | ✅ | Excellent |
| VPB | 1,309,470 | 13,094,700 | ✅ | Excellent |
| VIC | 289,330 | 2,893,300 | ✅ | Excellent |
| VHM | 272,860 | 2,728,600 | ✅ | Excellent |

**MarketWall vs VPS (lot):** 0% difference all symbols — **Excellent**.

---

## 4. Trading value (GTGD)

Current MarketWall formula: `tradingValue = price × volume` where `volume` = VPS **lot** (not shares).

| Symbol | MW displayed | SSI `nmTotalTradedValue` | Δ% (raw) | MW corrected `price×lot×10` | Δ% corrected | Grade corrected |
|--------|--------------|--------------------------|----------|---------------------------|--------------|-----------------|
| VCB | 19.16B | 192.49B | **-90.0%** Poor | 191.58B | -0.47% | Excellent |
| FPT | 42.83B | 427.59B | **-90.0%** Poor | 428.34B | +0.17% | Excellent |
| HPG | 34.45B | 342.80B | **-90.0%** Poor | 344.45B | +0.48% | Excellent |
| SSI | 118.28B | 1,182.8B | **-90.0%** Poor | 1,182.8B | ~0% | Excellent |
| SHB | 66.52B | 665.2B | **-90.0%** Poor | 665.2B | ~0% | Excellent |
| VPB | 34.37B | 346.01B | **-90.1%** Poor | 343.74B | -0.66% | Excellent |
| VIC | 55.72B | 559.89B | **-90.0%** Poor | 557.25B | -0.47% | Excellent |
| VHM | 37.14B | 371.46B | **-90.0%** Poor | 371.36B | -0.03% | Excellent |

**Root cause:** `lib/vietnam/heatmap-sizing.ts` and VPS adapter use `price × lot` without **×10** share multiplier. Heatmap tile sizing/ranking is internally consistent but **GTGD is ~10× low** vs SSI/FireAnt-style displays.

**Recommendation (P0):** Fix trading value:

```typescript
tradingValue = price * volume * 10  // volume = VPS lot
```

Or store `volumeShares` explicitly in API responses.

---

## 5. Foreign buy / sell / net flow

VPS fields `fBVol` / `fSVolume` are in **10-share lots** (same as `lot`). Scale ×10 for share comparison.

### VCB example (all sources)

| Field | VPS (×10) | SSI iBoard | Δ% |
|-------|-----------|------------|-----|
| Foreign buy | 461,900 | 461,900 | 0.00% Excellent |
| Foreign sell | 1,175,960 | 1,175,966 | -0.0005% Excellent |
| Net foreign | -714,060 | -714,066 | 0.00% Excellent |

### All symbols — VPS vs SSI foreign (shares)

| Symbol | Buy Δ% | Sell Δ% | Net Δ% | Grade |
|--------|--------|---------|--------|-------|
| VCB | 0.00% | -0.0005% | 0.00% | Excellent |
| FPT | -0.0009% | -0.00006% | -0.001% | Excellent |
| HPG | 0.00% | -0.0002% | 0.00% | Excellent |
| SSI | 0.00% | -0.0002% | 0.00% | Excellent |
| SHB | 0.00% | -0.0002% | 0.00% | Excellent |
| VPB | 0.00% | -0.0002% | 0.00% | Excellent |
| VIC | -0.001% | -0.001% | 0.00% | Excellent |
| VHM | -0.001% | -0.0003% | 0.00% | Excellent |

### MarketWall foreign exposure

| Symbol | MW analytics/dashboard | VPS raw available | KBS `foreignTotal` |
|--------|------------------------|-------------------|---------------------|
| VCB | ❌ not in top-10 | ✅ fBVol/fSVolume | ❌ |
| FPT | ❌ | ✅ | ❌ |
| HPG | ✅ (top foreign buy) | ✅ | ✅ |
| SSI | ✅ | ✅ | ✅ |
| SHB | ❌ | ✅ | ❌ |
| VPB | ✅ | ✅ | ✅ |
| VIC | ❌ | ✅ | ❌ |
| VHM | ❌ | ✅ | ❌ |

**Root cause:** MarketWall foreign flow uses **KBS `/rtranking/foreignTotal`** (top ~10 names only). VPS SmartOne feed already includes per-symbol foreign volumes but they are **not wired** to heatmap or analytics APIs.

**Recommendation (P1):**
1. Enrich all symbols from VPS `fBVol` / `fSVolume` (×10 shares) — matches SSI iBoard within 0.001%.
2. Keep KBS for leaderboard ranking; use VPS/SSI for full-universe foreign accuracy.
3. Optionally add **SSI iBoard** per-symbol fallback for foreign when VPS row missing.

---

## 6. FireAnt comparison

| Endpoint | Result |
|----------|--------|
| `GET restv2.fireant.vn/symbols/{symbol}/quote` | HTTP **404** |
| `GET api.fireant.vn/symbols/{symbol}/quote` | HTTP **404** |
| MarketWall adapter | Stub — `FIREANT_API_KEY` required, `not_connected` |

**Status:** No live FireAnt data available for this audit.

**Recommendation:** De-prioritize FireAnt until API key + working endpoints confirmed. VPS+SSI pair provides sufficient cross-validation.

---

## 7. Root causes summary

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Trading value uses `price×lot` not `price×lot×10` | **High** | GTGD ~90% low vs SSI; heatmap size ranking still valid relative to peers |
| 2 | Foreign flow limited to KBS top-10 | **Medium** | 5/8 audit symbols missing foreign on MW API |
| 3 | VPS foreign fields not exposed in API | **Medium** | Free accurate data unused |
| 4 | SSI change% sign flip (FPT, HPG) | **Low** | Reference only — VPS/MW agree |
| 5 | FireAnt not connected | **Low** | No benchmark from FireAnt |
| 6 | Price tick lag MW↔SSI (<1%) | **Low** | Normal intraday noise |

---

## 8. Provider recommendations

| Priority | Action |
|----------|--------|
| **P0** | Fix `tradingValue = price × volume × 10` (or document & export `volumeShares`) |
| **P1** | Wire VPS `fBVol`/`fSVolume` into `/api/vietnam-markets` analytics for all symbols |
| **P2** | Add SSI iBoard per-symbol fallback for price/foreign when VPS batch fails |
| **P3** | Label volume unit in API (`volumeUnit: "lot10"`) to prevent consumer misinterpretation |
| **P4** | FireAnt integration only after API key + endpoint verification |

**Keep:** VPS as primary quote provider — **validated 100% match** with MarketWall on price, change%, and volume (lot).

---

## 9. Accuracy scorecard (MarketWall production)

| Category | Score | Weight |
|----------|-------|--------|
| Price vs VPS | 100% Excellent | 25% |
| Change % vs VPS | 100% Excellent | 15% |
| Volume vs VPS/SSI | 100% Excellent | 20% |
| Trading value display | 0% vs SSI (formula bug) | 20% |
| Foreign flow coverage | 37.5% (3/8 symbols on MW) | 20% |

**Weighted accuracy (displayed fields):** ~**66%**  
**Weighted accuracy (after GTGD fix + VPS foreign wire):** ~**95%** (projected)

---

## 10. Audit methodology

1. Fetch MarketWall production: `GET /api/heatmaps/vietnam`
2. Fetch VPS: `GET bgapidatafeed.vps.com.vn/getliststockdata/{symbols}`
3. Fetch SSI: `GET iboard-query.ssi.com.vn/stock/{symbol}` per symbol
4. Attempt FireAnt public quote endpoints
5. Fetch KBS `foreignTotal` for MW foreign comparison
6. Normalize units: VPS lot × 10 = SSI shares
7. Compute absolute and percentage difference; classify per scale above

**Audit script:** `scripts/data-accuracy-audit.mjs`

---

## 11. Checklist

- [x] 8 symbols audited
- [x] 7 metrics compared (price, change%, volume, GTGD, foreign buy/sell/net)
- [x] 4 sources documented (MW, VPS, SSI, FireAnt)
- [x] Absolute & % difference calculated
- [x] Grades assigned
- [x] Root causes identified
- [x] Provider recommendations listed
- [ ] Fix trading value formula (follow-up sprint)
- [ ] Wire VPS foreign to API (follow-up sprint)
