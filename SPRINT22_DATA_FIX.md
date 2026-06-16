# Sprint 22 — Data Accuracy Fix Audit

**Date:** 2026-06-16  
**Scope:** Fix VPS lot→shares trading value (GTGD) and wire VPS foreign flow for all symbols  
**Build:** `npm run build` ✅  

## Summary

VPS reports volume in **10-share lots** (`lot`, `fBVol`, `fSVolume`). MarketWall previously computed GTGD as `price × lot`, understating trading value by ~90% vs SSI. Foreign flow analytics used KBS `/foreignTotal` (top ~10 symbols only), leaving most symbols without foreign data.

**Fixes shipped:**
- **P0:** `vpsTradingValue = price × lot × 10` at VPS adapter + shared consumers (heatmap sizing, analytics, tooltips)
- **P1:** VPS `fBVol`/`fSVolume` → `foreignBuy`/`foreignSell` (shares) on all heatmap stocks; analytics foreign flow uses full VPS universe
- **P2:** `volumeUnit: "lot10"` on `/api/vietnam-markets` and `/api/heatmaps/vietnam`
- KBS retained for dashboard leaderboards (`topVolume`, `topValue`, `topForeignBuy`, `topForeignSell`) only

## GTGD (Trading Value) — Before / After

Formula change: `price × lot` → `price × lot × 10`

| Symbol | Before (MW) | After (fixed) | SSI reference | After vs SSI |
|--------|-------------|---------------|---------------|--------------|
| VCB | 19.16B | 191.58B | 192.49B | -0.47% ✅ |
| FPT | 42.83B | 428.34B | 427.59B | +0.17% ✅ |
| HPG | 34.45B | 344.45B | 342.80B | +0.48% ✅ |
| SSI | 62.72B | 627.24B | 637.08B | -1.54% ✅ |

*Live VPS + SSI iBoard snapshot, 2026-06-16. Before values from Sprint 21 audit (`DATA_ACCURACY_AUDIT.md`).*

Relative heatmap tile ranking is unchanged (all symbols scaled uniformly).

## Foreign Coverage — Before / After

| Symbol | Before (MW analytics) | After (VPS wired) | SSI foreign buy | SSI foreign sell |
|--------|----------------------|-------------------|-----------------|------------------|
| VCB | ❌ KBS top-10 only | ✅ 461,900 buy / 1,175,960 sell | 461,900 | 1,175,966 |
| FPT | ❌ | ✅ 960,680 buy / 1,647,020 sell | 960,689 | 1,647,021 |
| HPG | ✅ (KBS leaderboard) | ✅ 6,355,600 buy / 1,205,700 sell | 6,355,600 | 1,205,703 |
| SSI | ✅ (KBS leaderboard) | ✅ 3,029,330 buy / 1,212,030 sell | 3,029,330 | 1,212,039 |

VPS foreign volumes match SSI within 0.001% (lot × 10 convention).

## Files changed

| File | Change |
|------|--------|
| `lib/vietnam/volume-units.ts` | **New** — `VPS_SHARES_PER_LOT`, `vpsTradingValue`, `vpsLotToShares`, `VPS_VOLUME_UNIT` |
| `lib/vietnam/heatmap-sizing.ts` | GTGD uses `vpsTradingValue` (tooltips + tile sizing) |
| `lib/adapters/vietnam/vps-adapter.ts` | Correct `value`; parse `fBVol`/`fSVolume` → foreign shares |
| `lib/adapters/vietnam/normalize.ts` | Pass foreign fields through to heatmap stocks |
| `lib/vietnam/market-analytics.ts` | GTGD fallback ×10; `foreignRowsFromHeatmapStocks()` |
| `lib/providers/vietnam-market-provider.ts` | VPS foreign for analytics; `volumeUnit`; merge foreign on live overlay |
| `lib/market/heatmap.ts` | Expose `foreignBuy`/`foreignSell` on VN items; `volumeUnit` in API |
| `app/api/vietnam-markets/route.ts` | Include `volumeUnit` in response |
| `types/market.ts` | Optional `foreignBuy`/`foreignSell` on `HeatmapAsset` |
| `scripts/data-accuracy-audit.mjs` | Post-fix trading value + foreign MW↔VPS checks |

## Verification

- [x] Local build passed (`npm run build`)
- [x] VPS GTGD ×10 matches SSI within ~1.5% for VCB, FPT, HPG, SSI
- [x] VPS foreign buy/sell matches SSI within 0.001% for sample symbols
- [ ] Deploy to production (not committed in this session)
- [ ] Re-run `node scripts/data-accuracy-audit.mjs` against deployed btrading.org

## Follow-ups

- SSI iBoard per-symbol fallback when VPS batch row missing (P2 in roadmap, deferred)
- FireAnt integration remains blocked (HTTP 404 without API key)
- Mock seed volumes are placeholders — live VPS lot semantics apply when `source: "live"`
