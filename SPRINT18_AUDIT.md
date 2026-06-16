# Sprint 18 — Currency Strength Stability Audit

**Date:** 2026-06-16  
**Scope:** Stabilize currency strength formula, caching, and API  
**Build:** `npm run build` ✅  
**Deploy:** https://btrading.org — commit `c9238c7` ✅

## Summary

Currency Strength now uses a **z-score normalization** model (`strength = clamp(50 + zScore × 10, 0, 100)`) over 28 FX pairs, with **5-minute server and client caching** and **no realtime SSE overlay**. Scores stay stable within the cache window and spread more naturally (typical 40–60, rare extremes).

This deploy also ships accumulated work from Sprints 14–17 (real fear & greed, VN heatmap/foreign flow, VN analytics tabs).

## Git

| Step | Result |
|------|--------|
| Commit | `c9238c7` — Sprint 18 complete: stabilize currency strength, VN analytics, fear-greed |
| Push | `7e5afcc..c9238c7  main -> main` ✅ |
| Files | 43 files changed, 3233 insertions(+), 205 deletions(-) |

## Vercel deployment

| Item | Result |
|------|--------|
| Production status | **Ready** (~41s build) |
| Deployment URL | https://marketwall-bexoxxz7w-mrnguyenlk-2465s-projects.vercel.app |
| Aliases | https://btrading.org, https://www.btrading.org |

## Production verification

| Check | Result |
|-------|--------|
| Homepage `https://btrading.org` | **200** |
| `GET /api/currency-strength` items | **8** |
| `pairCount` | **28** |
| `source` | **yahoo** |
| `updatedAt` / `nextUpdateAt` | Present (5 min window) |
| Cache stability (2 rapid requests) | **PASS** — identical `updatedAt` and scores |
| Sample scores | EUR 61.8, JPY 30.9, others ~43–60 |
| `GET /api/vietnam-markets` analytics | **PASS** — `breadth` + `foreign` available (live) |

## Key behavior changes (Currency Strength)

| Before | After |
|--------|-------|
| ~60s refresh, scores flickered | 5 min server + client cache |
| Linear scaling, compressed ~49–51 | Z-score spread, centered at 50 |
| Realtime SSE overlay | REST only |
| `source: "live"` | `source: "yahoo"` / `"yahoo+ecb"` |

## Files changed (Sprint 18 core)

| File | Change |
|------|--------|
| `lib/currency-strength/calculate-strength.ts` | Z-score formula |
| `lib/providers/cache.ts` | `currencyStrength: 300_000` + cache timing |
| `app/api/currency-strength/route.ts` | `nextUpdateAt`, stable timestamps |
| `hooks/useCurrencyStrength.ts` | 5 min SWR, no realtime overlay |
| `components/marketwall/currency-strength.tsx` | Last updated + 5 min footer |
| `SPRINT18_CURRENCY_STRENGTH_STABILITY.md` | Sprint doc |

## Verification checklist

- [x] Local build passed
- [x] Pushed to `main`
- [x] Vercel production Ready
- [x] btrading.org serves latest deployment
- [x] Currency strength API returns 8 items + cache metadata
- [x] Scores stable within 5-minute window
