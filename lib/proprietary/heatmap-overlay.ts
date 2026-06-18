import "server-only"

import {
  type CafeFExchange,
  fetchCafefProprietaryAll,
  formatCafefUsDate,
  type NormalizedProprietaryRow,
} from "@/lib/providers/proprietary/cafef-provider"
import { syncCafefProprietaryEod } from "@/lib/proprietary/sync-cafef-eod"
import {
  EMPTY_PROPRIETARY_STATUS,
  resolveProprietaryHeatmapStatus,
  type ProprietaryHeatmapStatus,
  vietnamTodayIso,
} from "@/lib/proprietary/proprietary-status"
import { isVietnamEquitySessionOpen } from "@/lib/vietnam/market-hours"

const DEFAULT_EXCHANGES: CafeFExchange[] = ["HOSE", "HNX", "UPCOM"]
const CAFEF_LOOKBACK_DAYS = 7

export type ProprietaryHeatmapFields = {
  proprietaryBuyValue: number
  proprietarySellValue: number
  proprietaryNetValue: number
  /** Gross proprietary trading value (buy + sell) in VND. */
  proprietaryTradingValue: number
}

export type ProprietaryHeatmapLoadResult = {
  overlay: Map<string, ProprietaryHeatmapFields>
  status: ProprietaryHeatmapStatus
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

function mergeCafefRows(rows: NormalizedProprietaryRow[]): {
  overlay: Map<string, ProprietaryHeatmapFields>
  latestDate: string | null
} {
  const bySymbol = new Map<string, NormalizedProprietaryRow>()
  for (const row of rows) {
    const key = row.symbol.toUpperCase()
    const existing = bySymbol.get(key)
    if (!existing || row.date > existing.date) {
      bySymbol.set(key, row)
    }
  }

  const overlay = new Map<string, ProprietaryHeatmapFields>()
  let latestDate: string | null = null
  for (const [, row] of bySymbol) {
    if (row.buyValue === 0 && row.sellValue === 0) continue
    overlay.set(row.symbol.toUpperCase(), rowToHeatmapFields(row))
    if (!latestDate || row.date > latestDate) latestDate = row.date
  }
  return { overlay, latestDate }
}

function overlayFromDbRows(
  rows: Array<{
    symbol: string
    buyValue: number
    sellValue: number
    netValue: number
    date: Date
  }>,
  sessionDate: string,
): Map<string, ProprietaryHeatmapFields> {
  const overlay = new Map<string, ProprietaryHeatmapFields>()
  for (const row of rows) {
    if (row.buyValue === 0 && row.sellValue === 0) continue
    overlay.set(row.symbol.toUpperCase(), rowToHeatmapFields(row))
  }
  if (overlay.size === 0) return overlay
  console.log(`[proprietary:heatmap] source=db session=${sessionDate} symbols=${overlay.size}`)
  return overlay
}

/** Latest-session per-symbol proprietary fields from ProprietaryTradingDaily (CafeF EOD sync). */
async function loadProprietaryHeatmapOverlayFromDb(): Promise<{
  overlay: Map<string, ProprietaryHeatmapFields>
  latestSessionDate: string | null
}> {
  const prisma = await getPrisma()
  if (!prisma) return { overlay: new Map(), latestSessionDate: null }

  try {
    const latest = await prisma.proprietaryTradingDaily.findFirst({
      orderBy: { date: "desc" },
      select: { date: true },
    })
    if (!latest) return { overlay: new Map(), latestSessionDate: null }

    const latestSessionDate = latest.date.toISOString().slice(0, 10)
    const rows = await prisma.proprietaryTradingDaily.findMany({
      where: { date: latest.date },
    })

    return {
      overlay: overlayFromDbRows(rows, latestSessionDate),
      latestSessionDate,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "proprietary heatmap db read failed"
    console.warn(`[proprietary:heatmap] ${message}`)
    return { overlay: new Map(), latestSessionDate: null }
  }
}

async function loadProprietaryHeatmapOverlayFromCafef(): Promise<{
  overlay: Map<string, ProprietaryHeatmapFields>
  latestDate: string | null
}> {
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

let syncInFlight: Promise<void> | null = null

/**
 * Fire-and-forget CafeF EOD sync when data is missing or stale (after market close).
 * Deduped per runtime — cron / manual sync remain primary.
 */
export function scheduleProprietaryEodSyncIfNeeded(status: ProprietaryHeatmapStatus): void {
  if (isVietnamEquitySessionOpen()) return
  if (status.proprietarySource === "cafef-eod" && !status.isStale) return
  if (!hasDatabaseUrl()) return
  if (syncInFlight) return

  syncInFlight = syncCafefProprietaryEod({ force: false })
    .then((result) => {
      console.log(
        `[proprietary:heatmap] auto-sync ok=${result.ok} skipped=${result.skipped ?? false} rows=${result.rowsUpserted}`,
      )
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "auto-sync failed"
      console.warn(`[proprietary:heatmap] auto-sync ${message}`)
    })
    .finally(() => {
      syncInFlight = null
    })
}

/**
 * Overlay for VN heatmap proprietary-flow mode.
 * Primary: ProprietaryTradingDaily (POST /api/sync/proprietary-eod).
 * Fallback: live CafeF scrape when DB empty/stale.
 */
export async function loadProprietaryHeatmapOverlay(): Promise<ProprietaryHeatmapLoadResult> {
  const today = vietnamTodayIso()
  const fromDb = await loadProprietaryHeatmapOverlayFromDb()

  let overlay = fromDb.overlay
  let latestSessionDate = fromDb.latestSessionDate

  const needsLiveCafef =
    overlay.size === 0 || (latestSessionDate != null && latestSessionDate !== today)

  if (needsLiveCafef) {
    const fromCafef = await loadProprietaryHeatmapOverlayFromCafef()
    if (fromCafef.overlay.size > 0) {
      const cafefToday = fromCafef.latestDate === today
      if (overlay.size === 0 || (cafefToday && fromCafef.latestDate! >= (latestSessionDate ?? ""))) {
        overlay = fromCafef.overlay
        latestSessionDate = fromCafef.latestDate
        console.log(
          `[proprietary:heatmap] source=cafef symbols=${overlay.size} session=${latestSessionDate}`,
        )
      }
    } else if (process.env.HEATMAP_PROPRIETARY_FALLBACK?.trim().toLowerCase() !== "cafef") {
      console.log(
        "[proprietary:heatmap] source=none (run proprietary EOD sync or set HEATMAP_PROPRIETARY_FALLBACK=cafef)",
      )
    }
  } else {
    console.log(`[proprietary:heatmap] source=db symbols=${overlay.size} session=${latestSessionDate}`)
  }

  const status = resolveProprietaryHeatmapStatus({
    overlaySize: overlay.size,
    latestSessionDate,
    fetchedAt: latestSessionDate,
  })

  scheduleProprietaryEodSyncIfNeeded(status)

  return { overlay, status }
}

export function applyProprietaryOverlay(
  row: import("@/types/market").HeatmapAsset,
  overlay: Map<string, ProprietaryHeatmapFields>,
): import("@/types/market").HeatmapAsset {
  const fields = overlay.get(row.symbol.toUpperCase())
  if (!fields) return row
  return { ...row, ...fields }
}

export { EMPTY_PROPRIETARY_STATUS, type ProprietaryHeatmapStatus }
