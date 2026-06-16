# VNSTOCK Capability Audit

**Date:** 2026-06-16  
**Scope:** Validate vnstock data capabilities via KBS endpoints (vnstock 4.x default source) using `VNSTOCK_API_KEY` from `.env.local`  
**Build:** `npm run build` ✅  
**Test endpoint:** `GET /api/test/vnstock` (optional `?symbol=VCB` or `?symbols=VCB,FPT`)

## Executive Summary

VNStock is a **Python library** ([vnstock on PyPI](https://pypi.org/project/vnstock/), v4.x) — **not** an npm package and **not** a hosted REST API. It aggregates public KB Securities (KBS) HTTP endpoints. The `VNSTOCK_API_KEY` from [vnstocks.com/login](https://vnstocks.com/login) is consumed by the proprietary `vnai` Python module for **client-side rate-limit tiers** (Guest 20/min → Community 60/min); it is **not** sent as an HTTP header to KBS data calls.

This audit probed the **same KBS endpoints** vnstock uses, from Node.js/Next.js, without replacing VPS, TCBS, Entrade, or TradingView adapters.

| Finding | Status |
|---------|--------|
| API key present & format valid (`vnstock_*`) | ✅ |
| Live stock quotes (6/6 symbols) | ✅ |
| Index OHLCV (VN30, VN100) | ✅ (VN100 sparse history) |
| Foreign buy/sell on price board | ✅ |
| Top volume ranking | ✅ |
| Top value ranking | ⚠️ Derived only |
| Market breadth | ❌ No endpoint |
| Direct Node.js vnstock SDK | ❌ Python only |

**Total audit runtime:** ~3.1s (8 symbols + market features)

---

## Discovery

### Codebase references

| Location | Notes |
|----------|-------|
| `package.json` | No `vnstock` npm dependency |
| `lib/adapters/vietnam/*` | VPS, TCBS, FireAnt, Vietstock — no vnstock adapter |
| `SPRINT6_DATA_PROVIDER_MIGRATION.md` | VNStock listed as planned, not wired |
| `SPRINT9_PROVIDER_REPLACEMENT_AUDIT.md` | VNStock = Python lib, N/A in Node |

### Related npm packages (not official vnstock)

| Package | Notes |
|---------|-------|
| `vnstock-js` | Community TS lib, VCI source — separate from vnstocks.com API key |
| `vnstock-ts` | Third-party toolkit |
| `vnstock-mcp-server` | Python wrapper MCP |

### VNSTOCK_API_KEY

- **Env var:** `VNSTOCK_API_KEY` in `.env.local` — **configured**, format valid (`vnstock_` prefix, 40 chars)
- **Preview:** `vnst***db1e` (masked)
- **Usage:** Python `register_user(api_key=...)` → `vnai.setup_api_key()` — local storage + soft rate limiting
- **Not used:** KBS public endpoints do not require this key for HTTP access from our probe

---

## KBS Endpoints Probed (vnstock 4.x default)

| Capability | KBS URL pattern | vnstock class |
|------------|-----------------|---------------|
| Realtime price board | `POST …/stock/iss` | `Trading.price_board()` |
| Daily OHLCV (stock) | `GET …/stocks/{sym}/data_day` | `Quote.history()` |
| Daily OHLCV (index) | `GET …/index/{sym}/data_day` | `Quote.history()` |
| Company profile / sector | `GET …/stockinfo/profile/{sym}` | `Company.overview()` |
| Top volume | `GET …/rtranking/volume` | KBS ranking |
| Foreign totals | `GET …/rtranking/foreignTotal` | KBS ranking |

Base: `https://kbbuddywts.kbsec.com.vn/iis-server/investment`

---

## Test Results Table

Prices in VND (stocks) or index points (indices). Response times are per-endpoint within each symbol probe.

| Symbol | Kind | OK | Price | Change | Volume | Mkt Cap | Sector | OHLC | History | F.Buy | F.Sell | Timings (ms) |
|--------|------|----|-------|--------|--------|---------|--------|------|---------|-------|--------|--------------|
| VCB | stock | ✅ | 61,800 | +0.32% | 3.11M | ✅ derived | ✅ | ✅ | 22 bars | 461,900 | 1,175,966 | board 0 / hist 89 / profile 70 |
| VIC | stock | ✅ | 194,000 | +0.73% | 2.89M | ✅ derived | ✅ | ✅ | 22 bars | 633,228 | 756,488 | board 0 / hist 134 / profile 95 |
| FPT | stock | ✅ | 73,200 | -0.54% | 5.82M | ✅ derived | ✅ | ✅ | 22 bars | 960,689 | 1,647,021 | board 0 / hist 109 / profile 110 |
| HPG | stock | ✅ | 24,200 | -0.62% | 14.15M | ✅ derived | ✅ | ✅ | 22 bars | 6,355,600 | 1,205,703 | board 0 / hist 134 / profile 96 |
| MWG | stock | ✅ | 79,400 | 0.00% | 3.18M | ✅ derived | ✅ | ✅ | 22 bars | 687,328 | 219,270 | board 0 / hist 85 / profile 78 |
| SHB | stock | ✅ | 13,900 | 0.00% | 47.86M | ✅ derived | ✅ | ✅ | 22 bars | 1,559,525 | 1,020,509 | board 0 / hist 169 / profile 91 |
| VN30 | index | ✅ | 2,046.37 | +0.93% | 331.9M | — | — | ✅ | 22 bars | — | — | hist 58 |
| VN100 | index | ✅ | 1,887.98 | — | 571.5M | — | — | ✅ | **1 bar** | — | — | hist 74 |

**Market-wide features**

| Feature | OK | Latency | Notes |
|---------|----|---------|-------|
| Top volume (`/rtranking/volume`) | ✅ | 65 ms | 30 rows; top: APC |
| Top value | ⚠️ | 67 ms | No native endpoint; derived from `TV` on sample price board |
| Foreign flow (`/rtranking/foreignTotal`) | ✅ | 85 ms | 9 rows; top net activity: HPG |
| Market breadth (advancers/decliners) | ❌ | — | Not exposed by vnstock/KBS; needs full-universe scan |

---

## Available vs Missing Fields

### Available (stocks via KBS)

- **Price, change, % change** — price board (`CP`, `CH`, `CHP`)
- **Volume** — accumulated (`TT`)
- **OHLC** — price board + daily history
- **Historical prices** — ~22 daily bars (30-day window)
- **Foreign buy/sell volume** — `FB`, `FS` on price board
- **Sector** — company profile `SM` (HTML business description, not ICB)
- **Market cap** — derived: `price × KLCPLH` (listed shares from profile)

### Available (indices)

- **OHLCV history** — index `data_day` endpoint
- **Latest price/change** — from last history bar (no dedicated index realtime board in probe)

### Missing or limited

- **Market cap** on indices
- **Sector** on indices
- **Foreign flow** per index
- **Market breadth** (advance/decline, % above MA, etc.)
- **Dedicated top-value ranking API** (only volume + foreign rankings in KBS const)
- **VN100 history depth** — only 1 bar returned in test window (verify before production use)
- **Real-time index quote** — must infer from history or separate source
- **Official REST API** wrapping vnstock for Node.js
- **API key tier verification** from Node (requires Python `check_status()`)

---

## Rate Limits

| Tier | Documented (vnstock/vnai) | Observed this audit |
|------|---------------------------|---------------------|
| Guest | 20 req/min | N/A (key configured) |
| Community | 60 req/min, 3000/hr | No HTTP 429 in ~20 KBS calls / ~3s |
| Enforcement | Python `vnai` soft limit + ads | KBS endpoints themselves did not throttle |

**Note:** vnstock docs state limits are hard/soft in the Python client; KBS public endpoints may have separate undocumented limits. Batch carefully for heatmap-scale workloads.

---

## Response Times Summary

| Endpoint | Typical ms |
|----------|------------|
| `POST /stock/iss` (batch 6) | ~250–300 (cold) / 0 (cached per symbol) |
| `GET /stocks/{sym}/data_day` | 85–170 |
| `GET /index/{sym}/data_day` | 58–74 |
| `GET /stockinfo/profile/{sym}` | 70–110 |
| `GET /rtranking/volume` | 65 |
| `GET /rtranking/foreignTotal` | 85 |

Full audit (`/api/test/vnstock`): **~3,096 ms**

---

## Suitability Assessment

| Use case | Rating | Recommendation |
|----------|--------|----------------|
| **Heatmap** | ⚠️ Partial | Price board supports batch quotes but scaling to HOSE/HNX full universe requires many POSTs + sector lookups. **Keep VPS primary**; vnstock/KBS useful as enrichment or fallback for VN30/VN100 membership lists via `Listing.symbols_by_group`. |
| **Symbol Detail** | ✅ Good | Rich price board + profile + foreign volumes. Could supplement modal detail without replacing chart provider. |
| **Historical Prices** | ✅ Good | Daily OHLCV reliable for stocks; indices work (verify VN100 depth). Aligns with native chart needs; still evaluate vs existing Entrade/TradingView path. |
| **Market Breadth** | ❌ Poor | No advance/decline endpoint. Continue mock/computed breadth or another provider. |
| **Foreign Flow** | ✅ Good | Per-symbol FB/FS on board + market-wide `foreignTotal` ranking. Suitable for foreign-flow widgets. |

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/providers/vnstock-capability-probe.ts` | Server-only KBS probe logic mirroring vnstock 4.x |
| `app/api/test/vnstock/route.ts` | Test API route (`GET`, optional `symbol` / `symbols` query) |
| `VNSTOCK_CAPABILITY_AUDIT.md` | This document |

**Not modified:** Existing Vietnam adapters (VPS, TCBS, etc.)

---

## Blockers for Production Integration

1. **No first-class Node SDK** — requires Python sidecar, subprocess, or continued direct KBS HTTP mirroring (unofficial, may break if KBS changes).
2. **`VNSTOCK_API_KEY` does not unlock HTTP data** — only Python rate limits; Node calls hit KBS as anonymous/guest-equivalent unless vnai is ported.
3. **Python not installed** on current Windows dev environment — cannot run `register_user()` / `check_status()` locally.
4. **Market breadth & top-value gaps** for dashboard features already served elsewhere.
5. **VN100 historical sparsity** — needs follow-up before index charts rely on KBS alone.

---

## Verification Checklist

- [x] `VNSTOCK_API_KEY` present in `.env.local` (not logged in repo)
- [x] Live KBS calls for VCB, VIC, FPT, HPG, MWG, SHB, VN30, VN100
- [x] Response times recorded per endpoint
- [x] `npm run build` passes
- [x] Test route: `http://127.0.0.1:3010/api/test/vnstock` (after `next build && next start`)

---

## Top Recommendations

1. **Do not replace VPS/TCBS yet** — use vnstock/KBS data as a **validation reference** or future enrichment layer.
2. **If integrating in Node**, prefer a thin **KBS adapter** (already prototyped in probe) over installing Python — document that this bypasses vnstock’s vnai rate-limit benefits unless a Python worker is added.
3. **Foreign flow & symbol detail** — strongest vnstock/KBS fit; lowest migration risk.
4. **Heatmap at scale** — stay on VPS; optionally use vnstock `Listing` group codes for VN100 universe expansion.
5. **Next step before Sprint wiring:** install Python + `pip install vnstock`, run `check_status()` to confirm Community tier, and compare Python vs Node field parity.
