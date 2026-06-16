# Sprint 25 — Proprietary Trading Chart

**Date:** 2026-06-16  
**Scope:** Add proprietary trading visualization below Foreign Flow in Vietnam Market Dashboard  
**Build:** `npm run build` ✅

---

## Provider search result

### KBS (KB Securities IIS — free, no API key)

| Endpoint | Result |
|----------|--------|
| `GET /rtranking/volume` | ✅ Top volume leaderboard |
| `GET /rtranking/value` | ✅ Top value leaderboard |
| `GET /rtranking/foreignTotal` | ✅ Foreign buy/sell (`FB`, `FS`) |
| `GET /rtranking/proprietary` | ❌ Invalid — API rejects unknown `what` values |
| `GET /rtranking/proprietaryTotal` | ❌ Invalid |
| `GET /rtranking/selfTrading` | ❌ Invalid |
| `GET /rtranking/tudoanh` | ❌ Invalid |

KBS error payload lists allowed ranking types only:

`change`, `volume`, `value`, `volitile`, `cap`, `foreignBuy`, `foreignTotal`

**No proprietary / tự doanh ranking endpoint** on the free KBS IIS API.

### VPS (`bgapidatafeed.vps.com.vn`)

| Field | Meaning | Proprietary? |
|-------|---------|--------------|
| `fBVol` / `fSVolume` | Foreign buy/sell lots | Foreign flow (already wired Sprint 22) |
| `ptVol` | Put-through (thỏa thuận) volume | **Not** proprietary; all sampled symbols return `0` |
| No `propBuy` / `propSell` fields | — | No per-symbol proprietary split |

### VNStock (Python / KBS mirror)

Same KBS endpoints — no additional proprietary surface in `vnstock-capability-probe.ts`.

### Conclusion

**Real proprietary trading data is NOT available** from current free providers. No mock or estimated numbers are generated.

---

## Whether real proprietary data is available

| Check | Status |
|-------|--------|
| Per-symbol proprietary buy/sell value | ❌ |
| Market-wide proprietary totals | ❌ |
| 10-session proprietary history | ❌ |
| Top net proprietary buy/sell symbols | ❌ |

`analytics.proprietary.available` remains **`false`** in production.

---

## API fields added

Extended `analytics.proprietary` shape on `/api/vietnam-markets`:

```json
{
  "available": false,
  "source": null,
  "buyValue": null,
  "sellValue": null,
  "netValue": null,
  "history": [],
  "topNetBuy": [],
  "topNetSell": []
}
```

When a future free provider is found, populate:

| Field | Type | Notes |
|-------|------|-------|
| `available` | `boolean` | `true` when any real proprietary field exists |
| `source` | `string \| null` | e.g. `"kbs"`, `"vps"` |
| `buyValue` | `number \| null` | Total proprietary buy value (VND) |
| `sellValue` | `number \| null` | Total proprietary sell value (VND) |
| `netValue` | `number \| null` | `buyValue - sellValue` |
| `history` | `array` | Up to 10 sessions: `{ date, buyValue, sellValue, netValue }` |
| `topNetBuy` | `array` | `{ symbol, sector, buyValue, sellValue, netValue }` |
| `topNetSell` | `array` | Same shape, negative net |

Implementation: `lib/vietnam/market-analytics.ts` → `emptyProprietaryAnalytics()` until provider wired.

---

## UI behavior

### Vietnam Market Dashboard order

1. Top Volume  
2. Top Value  
3. Foreign Flow Chart *(unchanged)*  
4. **Proprietary Trading Chart** *(new)*

### Component

`components/marketwall/proprietary-trading-chart.tsx`

- Reads `data.analytics.proprietary` from `useVietnamMarkets()`
- `md:col-span-2` — same width as Foreign Flow
- Title: **Tự doanh - Giá trị mua bán ròng**

### When data becomes available

- Summary row: total buy / sell / net value  
- Historical bar chart: green bars above zero (net buy), red below (net sell), center zero line  
- Top net buy / top net sell symbol rows  
- Badge: **Hôm nay** or **10 phiên** when `history.length > 1`

### Empty state behavior

When `available === false`:

```
Dữ liệu tự doanh chưa khả dụng từ nguồn miễn phí hiện tại.
```

Dashed border panel — no placeholder bars, no fake totals.

Analytics tab **Tự doanh** uses the same empty message.

---

## Files changed

| File | Change |
|------|--------|
| `lib/vietnam/market-analytics.ts` | Full `proprietary` type + `emptyProprietaryAnalytics()` |
| `lib/vietnam/proprietary-trading.ts` | **New** — chart formatting helpers |
| `components/marketwall/proprietary-trading-chart.tsx` | **New** — dashboard chart + empty/live UI |
| `components/marketwall/vietnam-market-dashboard.tsx` | Mount chart below Foreign Flow |
| `components/marketwall/vietnam-market-analytics.tsx` | Align empty message with dashboard |
| `lib/i18n.tsx` | `proprietaryTrading.*` strings |

**Not changed:** layout grid, sidebars, heatmap, auth, brokers, database, Foreign Flow chart logic.

---

## Build result

```
npm run build — passed ✅
```

---

## Follow-up (when provider found)

1. Add parser in `lib/providers/kbs-client.ts` or VPS adapter for proprietary fields  
2. Implement `computeProprietaryAnalytics()` in `market-analytics.ts`  
3. Chart will auto-render live data — component already handles `available: true`
