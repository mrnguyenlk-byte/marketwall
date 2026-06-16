# Sprint 10 — Production Cutover Verification

**Date:** 2026-06-16  
**Deploy commit:** `a04cd20` — Sprint 10: Yahoo + VPS provider cutover  
**Production:** https://btrading.org  
**Architecture:** Yahoo Finance (FX + US) · VPS (Vietnam) · ECB (FX fallback, unused when Yahoo full)

---

## Cutover Summary

| Goal | Status |
|------|--------|
| Remove Twelve Data from Currency Strength | ✅ `lib/forex/pairs-provider.ts` → Yahoo + ECB |
| Remove Twelve Data from US Heatmap | ✅ `lib/market/heatmap.ts` → Yahoo |
| Enable Yahoo Finance FX | ✅ 28/28 pairs live |
| Enable Yahoo Finance US stocks | ✅ 98/100 live prices |
| Enable VPS Vietnam adapter | ✅ VN heatmap + health `live` |
| Production deploy | ✅ Pushed `main` → Vercel |
| Endpoint verification | ✅ All four endpoints pass |

---

## Production URLs Tested

| URL | Verified (UTC) |
|-----|----------------|
| https://btrading.org/api/currency-strength | 2026-06-16T09:08:46Z |
| https://btrading.org/api/heatmaps/us | 2026-06-16T09:08:46Z |
| https://btrading.org/api/heatmaps/vietnam | 2026-06-16T09:08:46Z |
| https://btrading.org/api/health | 2026-06-16T09:08:47Z |

**Pre-cutover baseline (Twelve Data, commit `41cb7d3`):**

| Endpoint | Before | After |
|----------|--------|-------|
| `/api/currency-strength` | `pairCount=0`, `unavailable=true` | `pairCount=28`, `coverage=ideal` |
| `/api/heatmaps/us` | `source=mock`, `livePriceCount=0` | `source=live`, `livePriceCount=98` |
| `/api/heatmaps/vietnam` | `source=mock` | `source=live`, `livePriceCount=100` |
| `/api/health` → `vietnamMarkets` | `ok=false`, `mock` | `ok=true`, `live` |

---

## `/api/currency-strength`

**Provider used:** Yahoo Finance v8 chart API (`EURUSD=X`, …)

```json
{
  "source": "live",
  "pairCount": 28,
  "coverage": "ideal",
  "unavailable": false,
  "fallback": false,
  "items": 8,
  "updatedAt": "2026-06-16T09:08:46.157Z"
}
```

| Metric | Value | Pass |
|--------|-------|------|
| `pairCount` | **28** | ✅ (target ≥28 ideal) |
| `coverage` | **ideal** | ✅ |
| `unavailable` | **false** | ✅ |
| Currency rows | **8** (USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF) | ✅ |
| Twelve Data | **not used** | ✅ |

Sample strengths: EUR 50.27 (strongest), JPY 49.78 (weakest).

---

## `/api/heatmaps/us`

**Provider used:** Yahoo Finance v8 chart API (per seed symbol)

```json
{
  "source": "live",
  "itemCount": 100,
  "livePriceCount": 98,
  "seedCount": 100,
  "unavailable": false,
  "fallback": false,
  "updatedAt": "2026-06-16T09:08:46.xxxZ"
}
```

| Metric | Value | Pass |
|--------|-------|------|
| `itemCount` | **100** | ✅ |
| `livePriceCount` | **98** | ✅ (threshold ≥5) |
| `seedCount` | **100** | ✅ |
| `source` | **live** | ✅ |
| Twelve Data | **not used** | ✅ |

Symbols without live overlay (price=0): **MMC**, **BKNG** (Yahoo ticker mapping — minor; 98% coverage).

Sample live tiles: NVDA $212.45 +3.54%, AAPL $296.42 +1.82%, AMD $547.26 +6.98%.

---

## `/api/heatmaps/vietnam`

**Provider used:** VPS datafeed (`bgapidatafeed.vps.com.vn`)

```json
{
  "source": "live",
  "itemCount": 100,
  "livePriceCount": 100,
  "seedCount": 100,
  "unavailable": false,
  "fallback": false,
  "updatedAt": "2026-06-16T09:08:46.902Z"
}
```

| Metric | Value | Pass |
|--------|-------|------|
| `itemCount` | **100** | ✅ (VN100) |
| `livePriceCount` | **100** | ✅ |
| `source` | **live** | ✅ |
| TCBS | **bypassed** (VPS priority 1) | ✅ |

Sample live tiles: VCB 65,900 VND +0.32%, FPT 78,700 VND, VJC 183,700 VND +2.34%.

---

## `/api/health`

```json
{
  "status": "ok",
  "services": {
    "crypto":       { "ok": true,  "source": "live",  "fallback": false },
    "globalMarkets":{ "ok": true,  "source": "live",  "fallback": false },
    "vietnamMarkets":{ "ok": true, "source": "live",  "fallback": false },
    "calendar":     { "ok": false, "source": "cache", "fallback": true },
    "news":         { "ok": false, "source": "mock",  "fallback": true }
  }
}
```

| Service | Status | Provider | Sprint 10 scope |
|---------|--------|----------|-----------------|
| `vietnamMarkets` | **ok: true** | **VPS** | ✅ Cutover target |
| `globalMarkets` | ok: true | Yahoo/Stooq chain | Unaffected |
| `crypto` | ok: true | CoinGecko | Unaffected |
| `calendar` | fallback | cache | Out of scope |
| `news` | fallback | mock | Out of scope |

---

## Provider Matrix (post-cutover)

| Feature | Provider | API key required | Credits |
|---------|----------|------------------|---------|
| Currency Strength (28 FX) | **Yahoo Finance** | No | None |
| US Heatmap (100 US) | **Yahoo Finance** | No | None |
| VN Heatmap (100 VN) | **VPS** | No | None |
| FX fallback (if Yahoo gaps) | **ECB** daily XML | No | None |
| Overview / realtime (unchanged) | Twelve Data | Yes | Still on TD — Sprint 11 |

---

## Verification Commands

```bash
curl -s https://btrading.org/api/currency-strength \
  | jq '{pairCount,coverage,unavailable,items:(.items|length),source}'

curl -s https://btrading.org/api/heatmaps/us \
  | jq '{source,itemCount,livePriceCount,seedCount}'

curl -s https://btrading.org/api/heatmaps/vietnam \
  | jq '{source,itemCount,livePriceCount,seedCount}'

curl -s https://btrading.org/api/health \
  | jq '.services | {vietnamMarkets,globalMarkets,crypto}'
```

### Pass criteria (all met ✅)

- [x] `pairCount >= 28` and `coverage == "ideal"`
- [x] US `livePriceCount >= 5` and `source == "live"`
- [x] VN `itemCount == 100` and `source == "live"`
- [x] `vietnamMarkets.ok == true` on `/api/health`

---

## Deploy Log

| Step | Result |
|------|--------|
| `npm run build` | ✅ Pass (local pre-push) |
| `git push origin main` | ✅ `41cb7d3..a04cd20` |
| Vercel deploy | ✅ Live ~60s after push |
| Production probe attempt 1 | ❌ Old TD build (`pairCount=0`) |
| Production probe attempt 2+ | ✅ Yahoo + VPS live |

---

## Related docs

- `SPRINT9_PROVIDER_REPLACEMENT_AUDIT.md` — provider evaluation + implementation
- `SPRINT8_PROVIDER_FAILURE_AUDIT.md` — Twelve Data 429 root cause
- `SPRINT7_PRODUCTION_FIX_AUDIT.md` — soft coverage tiers
