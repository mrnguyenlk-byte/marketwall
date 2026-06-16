# Sprint 10B — Vietnam Native Chart

**Date:** 2026-06-16  
**Goal:** Match FireAnt-style chart behavior for Vietnam equities (HOSE / HNX / UPCOM) using **Lightweight Charts**, not TradingView.  
**Production:** https://btrading.org (deploy after push)

---

## Problem

Vietnam heatmap detail modals used the **TradingView embed** (`HOSE:{symbol}`) for all chart tabs. That caused:

| Issue | Impact |
|-------|--------|
| TradingView free widget limits VN symbol coverage | Missing or delayed HOSE/HNX/UPCOM charts |
| No native OHLCV in our stack | Historical tab showed empty `historicalPrices: []` for VN assets |
| FireAnt parity gap | No candlesticks, volume histogram, or MA overlays from our data |

**Decision:** Route `marketType === 'vn'` to a native Lightweight Charts component. Keep TradingView only for Forex, Crypto, US stocks, Commodities, and Indices.

---

## Architecture

```
StockDetailModal
  └── StockTabs
        ├── useVietnamChart(symbol)     [SWR, VN only]
        └── StockChart                  [router]
              ├── marketType === 'vn' → VietnamNativeChart (Lightweight Charts v5)
              └── else                → TradingViewChart (unchanged)
```

### Data flow

| Layer | File | Role |
|-------|------|------|
| Provider | `lib/providers/vietnam-chart-provider.ts` | Entrade OHLCV fetch + VND price normalization |
| Indicators | `lib/vietnam/chart-indicators.ts` | SMA MA10 / MA20 / MA50 on close |
| API | `app/api/vietnam/chart/[symbol]/route.ts` | Server route, 5 min cache, returns bars + MAs |
| Hook | `hooks/useVietnamChart.ts` | Client SWR (`dedupingInterval: 120s`) |
| Chart UI | `components/heatmap/VietnamNativeChart.tsx` | Candlestick + volume + MA lines |
| Router | `components/heatmap/StockChart.tsx` | VN vs non-VN switch |
| Tabs | `components/heatmap/StockTabs.tsx` | Overview/chart/historical wired to native data |

### Data source

**Entrade public chart API** (no API key):

```
GET https://services.entrade.com.vn/chart-api/v2/ohlcs/stock
  ?symbol={SYMBOL}&resolution=1D&from=0&to=9999999999
```

- Returns parallel arrays: `t`, `o`, `h`, `l`, `c`, `v`
- Prices are in **thousands of VND** when value &lt; 10,000 → normalized via `normalizeEntradePrice()`
- API route trims to **252 trading days** (~1 year) for chart performance

### Chart features (`VietnamNativeChart`)

| Series | Lightweight Charts type | Notes |
|--------|-------------------------|-------|
| OHLC | `CandlestickSeries` | Green/red from CSS `--gain` / `--loss` |
| Volume | `HistogramSeries` | Separate `volume` price scale, tinted by candle direction |
| MA10 | `LineSeries` | `#fbbf24` |
| MA20 | `LineSeries` | `#22d3ee` |
| MA50 | `LineSeries` | `#a78bfa` |

### TradingView retained for

- Forex (`FX:…`)
- Crypto (`BINANCE:…`)
- US stocks (`NASDAQ:…`, `NYSE:…`)
- Commodities / indices (non-VN `tradingViewSymbol`)

---

## Verification — Five symbols

Tested **2026-06-16** against Entrade (upstream) and local API (`next start -p 3099`).

### Entrade upstream (raw)

| Symbol | HTTP | Total bars | Last date | Close (VND) | Volume |
|--------|------|------------|-----------|-------------|--------|
| VCB | 200 | 3553 | 2026-06-16 | 61,800 | 3,110,000 |
| VIC | 200 | 3553 | 2026-06-16 | 194,000 | 2,893,300 |
| FPT | 200 | 3553 | 2026-06-16 | 73,200 | 5,819,800 |
| HPG | 200 | 3549 | 2026-06-16 | 24,200 | 14,145,800 |
| SHB | 200 | 3552 | 2026-06-16 | 13,900 | 47,856,000 |

### `/api/vietnam/chart/{symbol}` (trimmed + MAs)

| Symbol | HTTP | `barCount` | MA10 | MA20 | MA50 | Last close | Last volume |
|--------|------|------------|------|------|------|------------|-------------|
| VCB | 200 | 252 | 243 | 233 | 203 | 61,800 | 3,110,000 |
| VIC | 200 | 252 | 243 | 233 | 203 | 194,000 | 2,893,300 |
| FPT | 200 | 252 | 243 | 233 | 203 | 73,200 | 5,819,800 |
| HPG | 200 | 252 | 243 | 233 | 203 | 24,200 | 14,145,800 |
| SHB | 200 | 252 | 243 | 233 | 203 | 13,900 | 47,856,000 |

**Build:** `npm run build` — TypeScript ✅, route registered as `ƒ /api/vietnam/chart/[symbol]`

### Production smoke (after deploy)

```bash
curl -s https://btrading.org/api/vietnam/chart/VCB | jq '{symbol, barCount, ma10: (.ma10|length), last: .bars[-1]}'
curl -s https://btrading.org/api/vietnam/chart/VIC | jq '{symbol, barCount, ma10: (.ma10|length), last: .bars[-1]}'
curl -s https://btrading.org/api/vietnam/chart/FPT | jq '{symbol, barCount, ma10: (.ma10|length), last: .bars[-1]}'
curl -s https://btrading.org/api/vietnam/chart/HPG | jq '{symbol, barCount, ma10: (.ma10|length), last: .bars[-1]}'
curl -s https://btrading.org/api/vietnam/chart/SHB | jq '{symbol, barCount, ma10: (.ma10|length), last: .bars[-1]}'
```

**UI check:** Open Vietnam heatmap → click VCB / VIC / FPT / HPG / SHB → Overview & Chart tabs show native candlesticks + volume + MA legend; Historical tab lists last 30 OHLCV rows.

---

## Files changed / added

| File | Change |
|------|--------|
| `lib/providers/vietnam-chart-provider.ts` | **New** — Entrade OHLCV provider |
| `lib/vietnam/chart-indicators.ts` | **New** — MA10/20/50 SMA |
| `app/api/vietnam/chart/[symbol]/route.ts` | **New** — chart API |
| `hooks/useVietnamChart.ts` | **New** — SWR hook |
| `components/heatmap/VietnamNativeChart.tsx` | **New** — Lightweight Charts candlestick UI |
| `components/heatmap/StockChart.tsx` | **New** — VN / TradingView router |
| `components/heatmap/StockTabs.tsx` | **Updated** — `StockChart` + VN historical from live bars |

---

## Constraints respected

- No heatmap modal redesign — same tabs, swapped chart backend for VN only
- API keys remain server-only (Entrade is public; fetch runs in API route)
- VPS adapter unchanged for live VN quotes on heatmap tiles
- TradingView widget untouched for non-VN markets

---

## Follow-ups (optional)

- Intraday resolutions (`resolution=15`, `60`) for 1D / 1W / 1M timeframe buttons
- Crosshair legend with OHLCV + MA values on hover
- Extend `barCount` limit via query param for power users
- Production deploy + verify `btrading.org` endpoints post-push
