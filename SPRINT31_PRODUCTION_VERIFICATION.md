# Sprint 31 — Production Verification

**Date:** 2026-06-16  
**Scope:** Heatmap refinement, compact header, VN data integrity, trader tables  
**Production:** https://btrading.org  
**Verified at:** 2026-06-16T13:53:28Z (API audit) + fresh HTML/API re-fetch same day  
**Build:** Already on `main` — no new commit required

---

## Deployment

| Item | Value |
|------|-------|
| Commit | `a582776` |
| Message | Sprints 29-31: heatmap refinement, compact header, VN data integrity, and trader tables. |
| Branch | `origin/main` (pushed) |
| Working tree | Clean except untracked helper/audit files |

---

## Endpoint snapshots

### `GET /api/heatmaps/vietnam` — **PASS**

| Field | Value |
|-------|-------|
| `source` | `live` |
| `fallback` | `false` |
| `unavailable` | `false` |
| `itemCount` | `200` |
| `volumeUnit` | `lot10` |

**Mock-seed check:** VE4 / QST appear in heatmap tiles (high trading value by price × volume) but do **not** dominate dashboard top-volume rankings. Top volume leaders are liquid HOSE/HNX names (SHB, VIX, SSI, …).

### `GET /api/vietnam-markets` — **PASS** (except proprietary)

| Field | Value |
|-------|-------|
| `source` | `live` |
| `fallback` | `false` |
| `dashboard.topVolume.length` | `18` |
| `dashboard.topVolume[0].volumeShares` | Present — SHB: `47,856,000` |
| `dashboard.topValue[].value` | `price × lot × 10` (tradingValue equivalent) |
| `analytics.foreignFlow.available` | `true` |
| `analytics.proprietary.available` | `false` (**BLOCKER** — DB empty, no fake data) |

---

## Top Volume (top 20 — 18 available)

Live VPS snapshot. Sanity: SHB, SSI, HPG, VIX, VPB, VND, MBB, POW present — no HAI/CMR mock seeds.

| Rank | Symbol | volumeShares | Price (VND) |
|------|--------|--------------|-------------|
| 1 | SHB | 47,856,000 | 13,900 |
| 2 | VIX | 42,854,900 | 17,600 |
| 3 | SSI | 23,188,300 | 27,050 |
| 4 | VND | 21,677,200 | 17,700 |
| 5 | POW | 18,398,500 | 13,900 |
| 6 | SHS | 17,579,000 | 18,900 |
| 7 | NVL | 16,414,600 | 13,250 |
| 8 | TPB | 15,322,100 | 16,450 |
| 9 | CII | 14,694,100 | 17,500 |
| 10 | HPG | 14,145,800 | 24,350 |
| 11 | ACB | 13,315,500 | 22,750 |
| 12 | VPB | 13,094,700 | 26,250 |
| 13 | DXG | 12,289,500 | 13,050 |
| 14 | MBS | 11,777,000 | 20,000 |
| 15 | MBB | 11,650,300 | 25,200 |
| 16 | HDB | 9,770,800 | 25,200 |
| 17 | GEX | 9,711,200 | 30,600 |
| 18 | VCI | 9,096,900 | 24,450 |

---

## Top Trading Value (top 20 — 18 available)

| Rank | Symbol | value (VND) |
|------|--------|-------------|
| 1 | VIX | 754,246,240,000 |
| 2 | SHB | 665,198,400,000 |
| 3 | SSI | 627,243,515,000 |
| 4 | VIC | 557,249,580,000 |
| 5 | FPT | 428,337,280,000 |
| 6 | VND | 383,686,440,000 |
| 7 | VHM | 371,362,460,000 |
| 8 | HPG | 344,450,230,000 |
| 9 | VPB | 343,735,875,000 |
| 10 | SHS | 332,243,100,000 |
| 11 | ACB | 302,927,625,000 |
| 12 | GEX | 297,162,720,000 |
| 13 | MBB | 293,587,560,000 |
| 14 | CII | 257,146,750,000 |
| 15 | POW | 255,739,150,000 |
| 16 | MWG | 252,754,020,000 |
| 17 | TPB | 252,048,545,000 |
| 18 | HDB | 246,224,160,000 |

### GTGD formula sanity (Excellent vs VPS)

| Symbol | Calculation | Result |
|--------|-------------|--------|
| HPG | 24,350 × 1,414,580 lots × 10 | 344,450,230,000 ✓ |
| VCB | 61,600 × 311,000 × 10 | 191,576,000,000 ✓ |
| SSI | 27,050 × 2,318,830 × 10 | 627,243,515,000 ✓ |

---

## Foreign flow sample calculations

VPS formulas verified:

- `foreignBuyShares = fBVol × 10`
- `foreignSellShares = fSVolume × 10`

### HPG worked example

| Metric | Value |
|--------|-------|
| Buy shares | 6,355,600 |
| Buy value | 154,758,860,000 VND |
| Sell shares | 1,205,700 |
| Sell value | 29,358,795,000 VND |
| **Net value** | **+125,400,065,000 VND** |

Production API (`analytics.foreignFlow.topNetBuy` / `topNetSell`) confirms net leaders:

| Side | Top symbols |
|------|-------------|
| Top net buy | HPG, NLG, SSI |
| Top net sell | MBB, VPB, TCB |

All P0 audit flags **true** (`scripts/vn-data-integrity-audit.mjs`).

---

## Proprietary status — **BLOCKER**

| Check | Result |
|-------|--------|
| `analytics.proprietary.available` | `false` |
| Fake / seeded data | **None** (by design) |
| UI empty state | Expected until EOD sync |

**Remediation (post market close):**

```bash
node scripts/sync-proprietary-eod.mjs --force
```

or

```bash
curl -X POST "https://btrading.org/api/sync/proprietary-eod" \
  -H "Authorization: Bearer $SYNC_SECRET"
```

Do **not** fabricate proprietary rows.

---

## UI screenshot checklist

**Browser MCP:** Unavailable in this verification session (`browser_navigate` returned *No browser tab available* after multiple attempts). UI checks below combine (1) prior partial HTML audit, (2) fresh production HTML fetch via `curl`, and (3) live API row data for client-hydrated tables.

| UI element | Status | Notes |
|------------|--------|-------|
| `html lang="vi"` (Vietnamese default) | **Verified** | `<html lang="vi">` on production homepage |
| Vietnamese dashboard strings | **Verified** | *Khối lượng*, *Dòng tiền nước ngoài*, *Tự doanh*, *Bản đồ nhiệt* present in HTML |
| Top Volume compact table (~18 rows) | **Partial** | SSR shell + title *Khối lượng cao nhất*; rows hydrate client-side. API confirms 18 live rows. Layout: 5-column compact grid (#, Symbol, Last, %, KL) per `vietnam-market-dashboard.tsx` |
| Top Value compact table (~18 rows) | **Partial** | SSR shell + title *GTGD cao nhất*; API confirms 18 live value rows |
| Foreign Flow chart | **Partial** | Section title + *Hôm nay* badge in SSR; HPG/NLG/SSI net-buy leaders in API — chart bars not screenshot-captured |
| Proprietary Trading chart (below Foreign Flow) | **Partial** | Section *Tự doanh - Giá trị mua bán ròng* + *Cập nhật sau phiên* badge in SSR; empty/loading state expected (`available: false`) |
| Left banners | **Verified** | `300px` left column + banner markup in layout grid |
| Right panel (calendar / news) | **Verified** | `aside`, *Lịch*, *Tin tức* rail content in HTML |
| Vietnam heatmap visible | **Verified** | *Bản đồ nhiệt thị trường Việt Nam* section present; `/api/heatmaps/vietnam` live × 200 |
| Screenshots | **Unverified** | Browser MCP could not open a tab for capture |

---

## Remaining blockers

| Blocker | Severity | Notes |
|---------|----------|-------|
| Proprietary (tự doanh) EOD data empty | **High** | Only blocker for full VN analytics parity; requires post-close sync |
| Browser screenshot proof | Low | MCP tab unavailable; manual capture optional |
| US heatmap Yahoo intermittency | Medium | Out of Sprint 31 scope |
| Heatmap VE4/QST large tiles | Low | Expected from trading-value sizing; excluded from volume leaderboards |

**P0 for VN live dashboard:** None except proprietary sync schedule.

---

## Public beta readiness score

| Area | Weight | Score | Notes |
|------|--------|-------|-------|
| VN heatmap (live + sizing) | 20% | **19/20** | 200 live items; mock UPCOM symbols not in top-volume ranks |
| VN trader tables (volume / GTGD) | 25% | **24/25** | 18 rows each; `volumeShares` + GTGD formula verified vs VPS |
| Foreign flow integrity | 20% | **20/20** | Live VPS; share × 10 formulas; P0 audit pass |
| Proprietary trading | 15% | **8/15** | Honest empty state — blocked on EOD ingest |
| Dashboard UI / layout | 10% | **8/10** | VN default lang + 3-column layout verified in HTML; table/chart pixels unscreenshotted |
| API reliability (VN) | 10% | **10/10** | `source: live`, no fallback on audited endpoints |

### **Overall: 89 / 100 — Ready for public beta** (VN-focused)

Ship with label that proprietary chart fills after daily EOD sync. All other Sprint 31 VN surfaces are production-grade live data.

---

## Verification checklist

- [x] Deployment commit `a582776` on `origin/main`
- [x] `/api/heatmaps/vietnam` — live, 200 items, `lot10`
- [x] `/api/vietnam-markets` — live volume/value tables (18 rows)
- [x] GTGD = price × lot × 10 verified (HPG, VCB, SSI)
- [x] Foreign flow available; VPS share formulas verified
- [x] Proprietary unavailable — no fake data
- [x] `html lang="vi"` + Vietnamese strings on homepage
- [x] Layout rails + heatmap section in production HTML
- [ ] Browser MCP screenshots (blocked — MCP tab unavailable)
- [ ] Proprietary EOD sync after market close
