import "server-only"

import {
  type CafeFExchange,
  fetchCafefProprietaryAll,
  formatCafefUsDate,
} from "@/lib/providers/proprietary/cafef-provider"
import { isVietnamEquitySessionOpen } from "@/lib/vietnam/market-hours"

const DEFAULT_EXCHANGES: CafeFExchange[] = ["HOSE", "HNX", "UPCOM"]
const LOOKBACK_DAYS = 30

export type ProprietarySyncResult = {
  ok: boolean
  skipped?: boolean
  reason?: string
  rowsUpserted: number
  exchanges: CafeFExchange[]
  dateRange: { start: string; end: string }
}

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

async function getPrisma() {
  if (!hasDatabaseUrl()) return null
  const { prisma } = await import("@/lib/prisma")
  return prisma
}

function dateRangeWindow(): { start: string; end: string; startIso: string; endIso: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - LOOKBACK_DAYS)
  return {
    start: formatCafefUsDate(start),
    end: formatCafefUsDate(end),
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
  }
}

/**
 * Manual-first EOD sync from CafeF. Skips during Vietnam market hours unless `force`.
 * Does not poll intraday — proprietary data is post-market only.
 */
export async function syncCafefProprietaryEod(options?: {
  force?: boolean
  exchanges?: CafeFExchange[]
}): Promise<ProprietarySyncResult> {
  const exchanges = options?.exchanges ?? DEFAULT_EXCHANGES
  const range = dateRangeWindow()

  if (!options?.force && isVietnamEquitySessionOpen()) {
    return {
      ok: false,
      skipped: true,
      reason: "Vietnam market session open — EOD proprietary sync deferred until after close",
      rowsUpserted: 0,
      exchanges,
      dateRange: { start: range.start, end: range.end },
    }
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return {
      ok: false,
      reason: "DATABASE_URL not configured",
      rowsUpserted: 0,
      exchanges,
      dateRange: { start: range.start, end: range.end },
    }
  }

  let rowsUpserted = 0

  for (const exchange of exchanges) {
    const rows = await fetchCafefProprietaryAll(exchange, range.start, range.end)
    for (const row of rows) {
      const sessionDate = new Date(`${row.date}T00:00:00.000Z`)
      await prisma.proprietaryTradingDaily.upsert({
        where: {
          date_symbol_source: {
            date: sessionDate,
            symbol: row.symbol,
            source: row.source,
          },
        },
        create: {
          date: sessionDate,
          symbol: row.symbol,
          buyValue: row.buyValue,
          sellValue: row.sellValue,
          netValue: row.netValue,
          buyVolume: row.buyVolume,
          sellVolume: row.sellVolume,
          source: row.source,
        },
        update: {
          buyValue: row.buyValue,
          sellValue: row.sellValue,
          netValue: row.netValue,
          buyVolume: row.buyVolume,
          sellVolume: row.sellVolume,
        },
      })
      rowsUpserted++
    }
    console.log(`[proprietary:sync] exchange=${exchange} rows=${rows.length}`)
  }

  return {
    ok: true,
    rowsUpserted,
    exchanges,
    dateRange: { start: range.start, end: range.end },
  }
}
