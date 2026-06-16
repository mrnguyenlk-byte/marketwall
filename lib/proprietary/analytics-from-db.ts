import "server-only"

import { sectorForSymbol } from "@/lib/vietnam/symbol-sectors"
import type { VietnamMarketAnalytics } from "@/lib/vietnam/market-analytics"
import { emptyProprietaryAnalytics } from "@/lib/vietnam/market-analytics"

const HISTORY_SESSIONS = 10

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

async function getPrisma() {
  if (!hasDatabaseUrl()) return null
  try {
    const { prisma } = await import("@/lib/prisma")
    return prisma
  } catch {
    return null
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function loadProprietaryAnalyticsFromDb(): Promise<
  VietnamMarketAnalytics["proprietary"]
> {
  const empty = emptyProprietaryAnalytics()
  const prisma = await getPrisma()
  if (!prisma) return empty

  try {
    const rows = await prisma.proprietaryTradingDaily.findMany({
      orderBy: [{ date: "desc" }, { symbol: "asc" }],
      take: 5000,
    })

    if (!rows.length) return empty

    const dates = [...new Set(rows.map((r) => isoDate(r.date)))].sort().reverse()
    const latestDate = dates[0]
    const historyDates = dates.slice(0, HISTORY_SESSIONS).reverse()

    const latestRows = rows.filter((r) => isoDate(r.date) === latestDate)

    let buyValue = 0
    let sellValue = 0
    for (const row of latestRows) {
      buyValue += row.buyValue
      sellValue += row.sellValue
    }

    const history = historyDates.map((date) => {
      const dayRows = rows.filter((r) => isoDate(r.date) === date)
      const dayBuy = dayRows.reduce((s, r) => s + r.buyValue, 0)
      const daySell = dayRows.reduce((s, r) => s + r.sellValue, 0)
      return {
        date,
        buyValue: dayBuy,
        sellValue: daySell,
        netValue: dayBuy - daySell,
      }
    })

    const topBuy = [...latestRows]
      .filter((r) => r.buyValue > 0)
      .sort((a, b) => b.buyValue - a.buyValue)
      .slice(0, 10)
      .map((r) => ({
        symbol: r.symbol,
        sector: sectorForSymbol(r.symbol),
        buyValue: r.buyValue,
        sellValue: r.sellValue,
        netValue: r.netValue,
      }))

    const topSell = [...latestRows]
      .filter((r) => r.sellValue > 0)
      .sort((a, b) => b.sellValue - a.sellValue)
      .slice(0, 10)
      .map((r) => ({
        symbol: r.symbol,
        sector: sectorForSymbol(r.symbol),
        buyValue: r.buyValue,
        sellValue: r.sellValue,
        netValue: r.netValue,
      }))

    const topNetBuy = [...latestRows]
      .filter((r) => r.netValue > 0)
      .sort((a, b) => b.netValue - a.netValue)
      .slice(0, 10)
      .map((r) => ({
        symbol: r.symbol,
        sector: sectorForSymbol(r.symbol),
        buyValue: r.buyValue,
        sellValue: r.sellValue,
        netValue: r.netValue,
      }))

    const topNetSell = [...latestRows]
      .filter((r) => r.netValue < 0)
      .sort((a, b) => a.netValue - b.netValue)
      .slice(0, 10)
      .map((r) => ({
        symbol: r.symbol,
        sector: sectorForSymbol(r.symbol),
        buyValue: r.buyValue,
        sellValue: r.sellValue,
        netValue: r.netValue,
      }))

    return {
      available: buyValue > 0 || sellValue > 0,
      source: "cafef",
      buyValue,
      sellValue,
      netValue: buyValue - sellValue,
      history,
      topNetBuy,
      topNetSell,
      topBuy,
      topSell,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "proprietary db read failed"
    console.warn(`[proprietary:analytics] ${message}`)
    return empty
  }
}
