# Sprint 26 — Proprietary Trading EOD Data

**Date:** 2026-06-16  
**Scope:** Post-market proprietary trading from CafeF GH3, stored in Postgres, served via `analytics.proprietary`  
**Build:** `npm run build` ✅

---

## Source tested

| Priority | Source | Result |
|----------|--------|--------|
| 1 | **CafeF GH3** (`GDTuDoanh.ashx`) | ✅ **Working** on `cafef.vn/du-lieu/` domain |
| 1b | CafeF `s.cafef.vn` mirror | ❌ Always returns `symbol is null or empty` |
| 2 | FireAnt REST | ❌ `404` on guessed proprietary paths |
| 3 | SSI FastConnect | ⏸ Deferred — paid phase only |

### CafeF endpoint (found)

```
GET https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/GDTuDoanh.ashx
  ?Symbol=ALL|{ticker}
  &Exchange=HOSE|HNX|UPCOM|VN30|HNX30
  &StartDate=MM/DD/YYYY
  &EndDate=MM/DD/YYYY
  &PageIndex=1
  &PageSize=100
```

**Critical:** Must use `cafef.vn/du-lieu/` base (page `domain = '/du-lieu/'`), not `s.cafef.vn`.

**Date format:** `MM/DD/YYYY` in query (US format per CafeF `moment.format('MM/DD/YYYY')`).

---

## Sample response (VCB, HOSE, 2026-06-01 → 2026-06-16)

```json
{
  "Data": {
    "TotalCount": 11,
    "DateIndex": "15/06/2026",
    "Index": "VNINDEX",
    "TradingReport": {
      "TongGtMua": 1872714782000,
      "TongGtBan": 652760494000,
      "TongKlMua": 56064190,
      "TongKlBan": 16128375
    },
    "Data": {
      "ListDataTudoanh": [
        {
          "Symbol": "VCB",
          "Date": "15/06/2026",
          "KLcpMua": 376400,
          "KlcpBan": 187100,
          "GtMua": 23322530000,
          "GtBan": 11540860000
        }
      ]
    }
  }
}
```

### Normalized row

```json
{
  "date": "2026-06-15",
  "symbol": "VCB",
  "buyValue": 23322530000,
  "sellValue": 11540860000,
  "netValue": 11781670000,
  "buyVolume": 376400,
  "sellVolume": 187100,
  "source": "cafef"
}
```

---

## Data accuracy caveats

| Topic | Note |
|-------|------|
| **EOD only** | CafeF publishes after session — not realtime |
| **Values** | `GtMua` / `GtBan` in VND (not billions) |
| **Volumes** | `KLcpMua` / `KlcpBan` in shares |
| **TradingReport** | Index-level summary for `DateIndex` — may not shift with narrow date filters |
| **History** | Built by paginating `Symbol=ALL` and aggregating per `Date` across symbols |
| **Exchanges** | Sync runs HOSE + HNX + UPCOM separately |
| **Zeros** | Rows with all-zero buy/sell are skipped (not stored) |
| **No polling** | Sync skips 09:00–15:00 ICT Mon–Fri unless `force=1` |

---

## DB schema changes

**Model:** `ProprietaryTradingDaily` (`prisma/schema.prisma`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | cuid | PK |
| `date` | Date | Session date |
| `symbol` | String | Ticker |
| `buyValue` | Float | VND |
| `sellValue` | Float | VND |
| `netValue` | Float | buy − sell |
| `buyVolume` | Float | shares |
| `sellVolume` | Float | shares |
| `source` | String | default `cafef` |
| `createdAt` / `updatedAt` | DateTime | audit |

**Unique:** `(date, symbol, source)`

**Migration:** `prisma/migrations/20250616140000_sprint26_proprietary/migration.sql`

Apply when Postgres is available:

```bash
npx prisma migrate deploy
```

---

## Architecture

| File | Role |
|------|------|
| `lib/providers/proprietary/cafef-provider.ts` | Fetch + normalize CafeF rows |
| `lib/proprietary/sync-cafef-eod.ts` | EOD upsert (manual / post-close) |
| `lib/proprietary/analytics-from-db.ts` | Build `analytics.proprietary` from DB |
| `lib/vietnam/market-hours.ts` | Skip sync during market session |
| `app/api/sync/proprietary-eod/route.ts` | Manual sync API |
| `scripts/sync-proprietary-eod.mjs` | CLI wrapper |

### API behavior (`/api/vietnam-markets`)

| DB state | `analytics.proprietary` |
|----------|-------------------------|
| **Has rows** | `available: true`, `source: "cafef"`, totals, 10-session `history`, `topNetBuy` / `topNetSell` |
| **Empty / no DB** | `available: false` — existing empty state UI |

### Manual sync

```bash
# Local (dev server running)
node scripts/sync-proprietary-eod.mjs --force

# Production
curl -X POST "https://btrading.org/api/sync/proprietary-eod" \
  -H "Authorization: Bearer $SYNC_SECRET"
```

---

## UI

- Proprietary chart remains below Foreign Flow
- New badge: **Cập nhật sau phiên** / *Updated after session*
- Empty state unchanged when DB has no data

---

## Build result

```
prisma generate && npm run build — passed ✅
```

---

## Production checklist

1. Run migration on Vercel Postgres
2. Set `DATABASE_URL` (already required for auth)
3. Optional: set `SYNC_SECRET` for sync API
4. Run manual sync after market close
5. Verify `analytics.proprietary.available === true` on `/api/vietnam-markets`
