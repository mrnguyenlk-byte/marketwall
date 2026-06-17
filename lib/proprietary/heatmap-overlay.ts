import "server-only"

import {
  type CafeFExchange,
  fetchCafefProprietaryAll,
  formatCafefUsDate,
  type NormalizedProprietaryRow,
} from "@/lib/providers/proprietary/cafef-provider"

const DEFAULT_EXCHANGES: CafeFExchange[] = ["HOSE", "HNX", "UPCOM"]
const CAFEF_LOOKBACK_DAYS = 7

export type ProprietaryHeatmapFields = {
  proprietaryBuyValue: number
  proprietarySellValue: number
  proprietaryNetValue: number
  /** Gross proprietary trading value (buy + sell) in VND. */
  proprietaryTradingValue: number
}

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

function rowToHeatmapFields(row: {
  buyValue: number
  sellValue: number
  netValue: number
}): ProprietaryHeatmapFields {
  return {
    proprietaryBuyValue: row.buyValue,
    proprietarySellValue: row.sellValue,
    proprietaryNetValue: row.netValue,
    proprietaryTradingValue: row.buyValue + row.sellValue,
  }
}

function mergeCafefRows(rows: NormalizedProprietaryRow[]): Map<string, ProprietaryHeatmapFields> {
  const bySymbol = new Map<string, NormalizedProprietaryRow>()
  for (const row of rows) {
    const key = row.symbol.toUpperCase()
    const existing = bySymbol.get(key)
    if (!existing || row.date > existing.date) {
      bySymbol.set(key, row)
    }
  }

  const overlay = new Map<string, ProprietaryHeatmapFields>()
  for (const [symbol, row] of bySymbol) {
    if (row.buyValue === 0 && row.sellValue === 0) continue
    overlay.set(symbol, rowToHeatmapFields(row))
  }
  return overlay
}

/** Latest-session per-symbol proprietary fields from ProprietaryTradingDaily (CafeF EOD sync). */
export async function loadProprietaryHeatmapOverlayFromDb(): Promise<
  Map<string, ProprietaryHeatmapFields>
> {
  const prisma = await getPrisma()
  if (!prisma) return new Map()

  try {
    const latest = await prisma.proprietaryTradingDaily.findFirst({
      orderBy: { date: "desc" },
      select: { date: true },
    })
    if (!latest) return new Map()

    const rows = await prisma.proprietaryTradingDaily.findMany({
      where: { date: latest.date },
    })

    const overlay = new Map<string, ProprietaryHeatmapFields>()
    for (const row of rows) {
      if (row.buyValue === 0 && row.sellValue === 0) continue
      overlay.set(row.symbol.toUpperCase(), rowToHeatmapFields(row))
    }
    return overlay
  } catch (error) {
    const message = error instanceof Error ? error.message : "proprietary heatmap db read failed"
    console.warn(`[proprietary:heatmap] ${message}`)
    return new Map()
  }
}

async function loadProprietaryHeatmapOverlayFromCafef(): Promise<
  Map<string, ProprietaryHeatmapFields>
> {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - CAFEF_LOOKBACK_DAYS)
  const startDate = formatCafefUsDate(start)
  const endDate = formatCafefUsDate(end)

  const allRows: NormalizedProprietaryRow[] = []
  for (const exchange of DEFAULT_EXCHANGES) {
    try {
      const rows = await fetchCafefProprietaryAll(exchange, startDate, endDate)
      allRows.push(...rows)
    } catch (error) {
      const message = error instanceof Error ? error.message : "cafef fetch failed"
      console.warn(`[proprietary:heatmap] exchange=${exchange} ${message}`)
    }
  }

  return mergeCafefRows(allRows)
}

/**
 * Overlay for VN heatmap proprietary-flow mode.
 * Primary: ProprietaryTradingDaily (POST /api/sync/proprietary-eod).
 * Fallback: live CafeF scrape when DB empty and HEATMAP_PROPRIETARY_FALLBACK=cafef.
 */
export async function loadProprietaryHeatmapOverlay(): Promise<
  Map<string, ProprietaryHeatmapFields>
> {
  const fromDb = await loadProprietaryHeatmapOverlayFromDb()
  if (fromDb.size > 0) {
    console.log(`[proprietary:heatmap] source=db symbols=${fromDb.size}`)
    return fromDb
  }

  if (process.env.HEATMAP_PROPRIETARY_FALLBACK?.trim().toLowerCase() !== "cafef") {
    console.log("[proprietary:heatmap] source=none (run proprietary EOD sync or set HEATMAP_PROPRIETARY_FALLBACK=cafef)")
    return fromDb
  }

  const fromCafef = await loadProprietaryHeatmapOverlayFromCafef()
  console.log(`[proprietary:heatmap] source=cafef symbols=${fromCafef.size}`)
  return fromCafef
}

export function applyProprietaryOverlay(
  row: import("@/types/market").HeatmapAsset,
  overlay: Map<string, ProprietaryHeatmapFields>,
): import("@/types/market").HeatmapAsset {
  const fields = overlay.get(row.symbol.toUpperCase())
  if (!fields) return row
  return { ...row, ...fields }
}
