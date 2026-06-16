# Sprint 29 — Heatmap Refinement Audit

**Date:** 2026-06-16  
**Scope:** sqrt tile sizing, 20% area cap, expanded VN/crypto universes, 220px sidebars at ≥1440px  
**Build:** `npm run build` ✅

---

## Summary

Sprint 29 refines heatmap tile sizing across Vietnam, US, and Crypto using **sqrt(metric)** weighting with a **20% max leaf area** cap, expands the VN seed universe to **160 symbols** (120 displayed), raises crypto display to **50 coins**, improves Finviz-style group header contrast, and locks the dashboard to **220px | 1fr | 220px** columns at **≥1440px** with all three rails visible.

---

## 1. Sqrt sizing formula

Raw metric from `assetSizeMetric()` (unchanged by market):

| Market | Default sizing mode | Raw metric |
|--------|---------------------|------------|
| VN | `tradingValue` | GTGD (VND) or price × volume |
| US | `marketCap` | Market cap (USD) |
| Crypto | `volume` | 24h volume (USD) |

**Layout weight:**

```
layoutWeight = max(sqrt(rawMetric), MIN_TILE_VALUE)
```

Implemented in `lib/treemap/heatmap-engine.ts` via `applySqrtSizing()` → `capLeafWeights()`.

---

## 2. 20% area cap logic

Before squarify, each leaf weight is capped so no single tile can dominate:

```
total = sum(layoutWeight for all leaves)
cap   = total × MAX_LEAF_AREA_FRACTION   // 0.20
finalWeight = clamp(layoutWeight, MIN_TILE_VALUE, cap)
```

Group and sector weights use the **sum of capped leaf weights** in each bucket.

In a flat squarify over the unit square, this guarantees `rect.w × rect.h ≤ 0.20` for any leaf. Hierarchical sector→industry layouts inherit proportional caps within each group.

**Constant:** `MAX_LEAF_AREA_FRACTION = 0.2` (exported from `heatmap-engine.ts`).

---

## 3. Symbol counts & display limits

| Market | Seed / fetch universe | Display limit | Notes |
|--------|----------------------|---------------|-------|
| **VN** | 160 seeds (97 HOSE + 31 HNX + 32 UPCOM) | **120** (`VN_HEATMAP_LIMIT`) | Banking, securities, RE, steel, oil & gas leaders; VPS batches of 40 |
| **US** | 100 seeds | **40** (`US_HEATMAP_LIMIT`) | Sector → industry hierarchy; sqrt(marketCap) default |
| **Crypto** | 50 (CoinGecko + mock) | **50** (`CRYPTO_HEATMAP_LIMIT`) | Category grouping; sqrt(volume24h) default |

**VN minimum floor:** `VN_HEATMAP_MIN_ITEMS = 100` (pad from seeds when live overlay sparse).

**New VN seeds (Sprint 29):** TVN, TLH, BSR, FTS, BAB, AGR, VFS, GEG, AAA.

---

## 4. Layout grid values

**File:** `app/page.tsx`

| Breakpoint | Grid template | Behavior |
|------------|---------------|----------|
| `< lg` (<1024px) | `grid-cols-1` | Stack: left → center → right |
| `lg` – `1439px` | `220px minmax(0,1fr)` | Left sticky + center; right below center |
| `≥ 1440px` | `220px minmax(0,1fr) 220px` | All three columns visible; left + right sticky |

Tailwind classes:

```
grid-cols-1
lg:grid-cols-[220px_minmax(0,1fr)]
min-[1440px]:grid-cols-[220px_minmax(0,1fr)_220px]
```

No `xl:hidden` or sidebar hiding on desktop. Banners and right panel preserved.

---

## 5. Label visibility (FinvizTreemap)

Group headers: larger min height (14px), **bold** 10–12px type, `bg-black/65` contrast, subtle inset shadow. Sector-industry header band increased to 6% / max 2.8% of parent height.

---

## Files changed

| File | Change |
|------|--------|
| `lib/treemap/heatmap-engine.ts` | sqrt sizing, 20% cap, `capLeafWeights`, layout helpers |
| `config/heatmap-symbols.ts` | VN limit 120, crypto limit 50 |
| `lib/market/heatmap-limits.ts` | (via config) updated display limits |
| `lib/market/heatmap.ts` | VN min items floor 100 |
| `lib/vietnam-heatmap-seeds.ts` | +9 sector leaders (160 total seeds) |
| `components/heatmap/FinvizTreemap.tsx` | Group header contrast & font size |
| `app/page.tsx` | 220px sidebars, 3-column at ≥1440px |

---

## Verification

- [x] Local build passed (`npm run build`)
- [x] sqrt(metric) applied for VN / US / Crypto layout weights
- [x] 20% leaf weight cap before squarify
- [x] VN universe ≥100 seeds; display limit 120
- [x] Crypto display limit 50
- [x] 3-column layout at ≥1440px with 220px fixed sidebars
- [ ] Production deploy (pending user commit/push)
