# Sprint 15 — Foreign Flow Visualization

Replace duplicated Top Foreign Buy / Top Foreign Sell tables with a single **diverging bar chart** powered by KBS / Vnstock foreign-flow data.

---

## Summary

| Before | After |
|--------|-------|
| 4-column grid: Volume, Value, Foreign Buy table, Foreign Sell table | 2-column grid: Volume, Value + **full-width Foreign Flow chart** |
| Separate buy/sell leaderboards | Single diverging chart (sell left, buy right, zero center) |

---

## Chart layout

```
        Net Sell                    Net Buy
  [value] ████ TICKER  |  TICKER ████ [value]
  [value] ███ TICKER   |  TICKER █████ [value]
         ... rank 1–10 ...
              ↑ zero line (center)
```

- **Left:** Top 10 foreign **sell** (`FS` desc) — red bars grow toward center
- **Right:** Top 10 foreign **buy** (`FB` desc) — green bars grow from center
- **Center:** Vertical zero axis + rank index (1–10)

Each row pairs sell rank *n* with buy rank *n* (symbols may differ).

---

## Features

| Feature | Implementation |
|---------|----------------|
| **1D / 7D / 30D** | UI toggle; 1D = raw KBS daily `FB`/`FS`; 7D/30D = daily × 7 or × 30 (see Period note) |
| **Value mode (default)** | `shares × price / 1e9` → **billion VND** |
| **Volume mode** | `FB` / `FS` share counts (scaled by period) |
| **Top 10 buy / sell** | From existing `dashboard.topForeignBuy` / `topForeignSell` |
| **Hover tooltip** | Ticker, value (B VND), volume (shares), sector |
| **Provider** | Unchanged KBS `GET /rtranking/foreignTotal` via `fetchKbsMarketDashboard()` |

---

## Data source (KBS / Vnstock)

**Endpoint:** `https://kbbuddywts.kbsec.com.vn/iis-server/investment/rtranking/foreignTotal`

| Field | Meaning | Example (HPG) |
|-------|---------|---------------|
| `SB` | Symbol | HPG |
| `CP` | Price (VND) | 24,200 |
| `FB` | Foreign **buy** volume (shares) | 6,355,600 |
| `FS` | Foreign **sell** volume (shares) | 1,205,703 |
| `FT` | Total foreign volume | 7,561,303 |

Pipeline (unchanged):

```
fetchKbsMarketDashboard()
  → foreignTotal sorted by FB → topForeignBuy (10)
  → foreignTotal sorted by FS → topForeignSell (10)
  → /api/vietnam-markets → useVietnamMarkets() → ForeignFlowChart
```

---

## Formulas

### Volume mode (shares)

```
displayShares = FB or FS × periodDays
periodDays ∈ { 1, 7, 30 }
```

### Value mode (billion VND)

```
valueVnd     = displayShares × price
displayValue = valueVnd / 1_000_000_000
```

### Bar width

```
widthPct = (side.displayValue / max(all sides.displayValue)) × 100
min bar width = 6% for visibility
```

### Sector (tooltip)

Resolved from `lib/vietnam/symbol-sectors.ts` (150-symbol seed map). Unknown → `"Other"`.

---

## Validation example — HPG (live KBS, 1D, value mode)

| Input | Value |
|-------|-------|
| `FB` | 6,355,600 shares |
| `CP` | 24,200 VND |
| Period | 1D (×1) |

```
valueVnd     = 6,355,600 × 24,200 = 153,805,520,000 VND
displayValue = 153.81 billion VND  → shown as "153.8B"
```

**Volume mode (1D):** `6.4M` shares (compact notation)

---

## Period note (7D / 30D)

KBS `foreignTotal` exposes **daily** foreign buy/sell totals only. There is no verified multi-day aggregate endpoint in the current integration.

**Interim behavior:**

- **1D:** Live daily `FB` / `FS`
- **7D / 30D:** Same rankings; share counts scaled by `×7` or `×30`
- Footer label: *"7D/30D estimated from daily flow × sessions"*

Future sprint: wire true rolling foreign totals if KBS adds period parameters or historical `FB`/`FS` on `data_day`.

---

## Files changed

| File | Change |
|------|--------|
| `components/marketwall/foreign-flow-chart.tsx` | **New** — diverging bar chart |
| `components/marketwall/vietnam-market-dashboard.tsx` | Remove buy/sell tables; add chart |
| `lib/vietnam/foreign-flow.ts` | **New** — period/mode math, row builder |
| `lib/vietnam/symbol-sectors.ts` | **New** — ticker → sector lookup |
| `lib/i18n.tsx` | Foreign flow + sector label keys |

**Unchanged:** `lib/providers/kbs-client.ts`, `/api/vietnam-markets`, fear-greed foreign flow (still uses `topForeignBuy` / `topForeignSell` totals).

---

## Dashboard layout

```
┌─────────────────┬─────────────────┐
│  Top Volume     │  Top Value      │
├─────────────────┴─────────────────┤
│     Foreign Flow (diverging)      │
│  1D/7D/30D  |  Value | Volume     │
└───────────────────────────────────┘
```

---

## Screenshot checklist

- [ ] Top Foreign Buy / Sell **tables removed**
- [ ] Diverging chart spans full width below Volume/Value
- [ ] Center zero line visible
- [ ] Sell bars (red) on left, buy bars (green) on right
- [ ] 1D / 7D / 30D toggle works
- [ ] Value (B) default; Volume (shares) toggle works
- [ ] 10 rows each side
- [ ] Tooltip: ticker, value, volume, sector
- [ ] Live source badge: KBS / Vnstock when `dashboard.source === "live"`

---

## Build

```
npm run build  → passed
```
