import type { VietnamHeatmapStock } from "@/lib/providers/vietnam-market-provider"
import { sectorForSymbol } from "@/lib/vietnam/symbol-sectors"
import { vpsTradingValue } from "@/lib/vietnam/volume-units"

export type VietnamForeignNetRow = {
  symbol: string
  sector: string
  netVolume: number
  netValue: number
  price: number
}

export type VietnamLiquiditySymbol = {
  symbol: string
  sector: string
  value: number
  volume: number
}

export type VietnamLiquidityPoint = {
  time: string
  cumulativeValue: number
}

export type VietnamProprietaryNetRow = {
  symbol: string
  sector: string
  buyValue: number
  sellValue: number
  netValue: number
}

export type VietnamProprietaryHistoryPoint = {
  date: string
  buyValue: number
  sellValue: number
  netValue: number
}

export type VietnamMarketAnalytics = {
  breadth: {
    available: boolean
    advancingCount: number
    decliningCount: number
    unchangedCount: number
    advancingValue: number
    decliningValue: number
    unchangedValue: number
  }
  foreignFlow: {
    available: boolean
    historicalAvailable: boolean
    range: "today"
    buyVolume: number
    sellVolume: number
    netVolume: number
    buyValue: number
    sellValue: number
    netValue: number
    topNetBuy: VietnamForeignNetRow[]
    topNetSell: VietnamForeignNetRow[]
  }
  proprietary: {
    available: boolean
    source: string | null
    buyValue: number | null
    sellValue: number | null
    netValue: number | null
    history: VietnamProprietaryHistoryPoint[]
    topNetBuy: VietnamProprietaryNetRow[]
    topNetSell: VietnamProprietaryNetRow[]
  }
  liquidity: {
    available: boolean
    totalValue: number
    totalVolume: number
    previousSessionValue: number | null
    previousSessionVolume: number | null
    topLiquidity: VietnamLiquiditySymbol[]
    intradayAvailable: boolean
    intradaySeries: {
      today: VietnamLiquidityPoint[]
      previous: VietnamLiquidityPoint[]
    }
  }
}

export type KbsForeignTotalRow = {
  symbol: string
  price: number
  foreignBuy: number
  foreignSell: number
}

function stockTradingValue(stock: VietnamHeatmapStock): number {
  if (stock.value > 0) return stock.value
  return vpsTradingValue(stock.price, stock.volume)
}

export function foreignRowsFromHeatmapStocks(stocks: {
  hose: VietnamHeatmapStock[]
  hnx: VietnamHeatmapStock[]
  upcom: VietnamHeatmapStock[]
}): KbsForeignTotalRow[] {
  const rows: KbsForeignTotalRow[] = []

  for (const stock of [...stocks.hose, ...stocks.hnx, ...stocks.upcom]) {
    const foreignBuy = stock.foreignBuy ?? 0
    const foreignSell = stock.foreignSell ?? 0
    if (foreignBuy === 0 && foreignSell === 0) continue
    rows.push({
      symbol: stock.symbol,
      price: stock.price,
      foreignBuy,
      foreignSell,
    })
  }

  return rows
}

function flattenStocks(stocks: {
  hose: VietnamHeatmapStock[]
  hnx: VietnamHeatmapStock[]
  upcom: VietnamHeatmapStock[]
}): VietnamHeatmapStock[] {
  return [...stocks.hose, ...stocks.hnx, ...stocks.upcom]
}

export function computeBreadthAnalytics(
  stocks: {
    hose: VietnamHeatmapStock[]
    hnx: VietnamHeatmapStock[]
    upcom: VietnamHeatmapStock[]
  },
  hasLiveStocks: boolean,
  liveSymbols?: Set<string>,
): VietnamMarketAnalytics["breadth"] {
  const empty = {
    available: false,
    advancingCount: 0,
    decliningCount: 0,
    unchangedCount: 0,
    advancingValue: 0,
    decliningValue: 0,
    unchangedValue: 0,
  }

  if (!hasLiveStocks) return empty

  let advancingCount = 0
  let decliningCount = 0
  let unchangedCount = 0
  let advancingValue = 0
  let decliningValue = 0
  let unchangedValue = 0

  for (const stock of flattenStocks(stocks)) {
    if (stock.price <= 0) continue
    if (liveSymbols && !liveSymbols.has(stock.symbol.toUpperCase())) continue
    const value = stockTradingValue(stock)
    if (stock.changePercent > 0) {
      advancingCount++
      advancingValue += value
    } else if (stock.changePercent < 0) {
      decliningCount++
      decliningValue += value
    } else {
      unchangedCount++
      unchangedValue += value
    }
  }

  const total = advancingCount + decliningCount + unchangedCount
  if (total === 0) return empty

  return {
    available: true,
    advancingCount,
    decliningCount,
    unchangedCount,
    advancingValue,
    decliningValue,
    unchangedValue,
  }
}

export function computeForeignFlowAnalytics(
  rows: KbsForeignTotalRow[],
): VietnamMarketAnalytics["foreignFlow"] {
  const empty = {
    available: false,
    historicalAvailable: false,
    range: "today" as const,
    buyVolume: 0,
    sellVolume: 0,
    netVolume: 0,
    buyValue: 0,
    sellValue: 0,
    netValue: 0,
    topNetBuy: [] as VietnamForeignNetRow[],
    topNetSell: [] as VietnamForeignNetRow[],
  }

  if (!rows.length) return empty

  let buyVolume = 0
  let sellVolume = 0
  let buyValue = 0
  let sellValue = 0
  const netRows: VietnamForeignNetRow[] = []

  for (const row of rows) {
    const fb = row.foreignBuy ?? 0
    const fs = row.foreignSell ?? 0
    const price = row.price ?? 0
    buyVolume += fb
    sellVolume += fs
    buyValue += fb * price
    sellValue += fs * price

    const netVolume = fb - fs
    if (netVolume === 0) continue
    netRows.push({
      symbol: row.symbol,
      sector: sectorForSymbol(row.symbol),
      netVolume,
      netValue: netVolume * price,
      price,
    })
  }

  const topNetBuy = [...netRows]
    .filter((r) => r.netVolume > 0)
    .sort((a, b) => b.netValue - a.netValue)
    .slice(0, 10)

  const topNetSell = [...netRows]
    .filter((r) => r.netVolume < 0)
    .sort((a, b) => a.netValue - b.netValue)
    .slice(0, 10)

  return {
    available: buyVolume > 0 || sellVolume > 0,
    historicalAvailable: false,
    range: "today",
    buyVolume,
    sellVolume,
    netVolume: buyVolume - sellVolume,
    buyValue,
    sellValue,
    netValue: buyValue - sellValue,
    topNetBuy,
    topNetSell,
  }
}

export function computeLiquidityAnalytics(
  stocks: {
    hose: VietnamHeatmapStock[]
    hnx: VietnamHeatmapStock[]
    upcom: VietnamHeatmapStock[]
  },
  hasLiveStocks: boolean,
  previousSession?: { volume: number | null; value: number | null },
  liveSymbols?: Set<string>,
): VietnamMarketAnalytics["liquidity"] {
  const empty = {
    available: false,
    totalValue: 0,
    totalVolume: 0,
    previousSessionValue: null,
    previousSessionVolume: null,
    topLiquidity: [] as VietnamLiquiditySymbol[],
    intradayAvailable: false,
    intradaySeries: { today: [], previous: [] },
  }

  if (!hasLiveStocks) return empty

  const all = flattenStocks(stocks).filter(
    (s) => s.price > 0 && (!liveSymbols || liveSymbols.has(s.symbol.toUpperCase())),
  )
  if (!all.length) return empty

  const totalValue = all.reduce((sum, s) => sum + stockTradingValue(s), 0)
  const totalVolume = all.reduce((sum, s) => sum + (s.volume ?? 0), 0)

  const topLiquidity = [...all]
    .sort((a, b) => stockTradingValue(b) - stockTradingValue(a))
    .slice(0, 10)
    .map((s) => ({
      symbol: s.symbol,
      sector: s.sector || sectorForSymbol(s.symbol),
      value: stockTradingValue(s),
      volume: s.volume ?? 0,
    }))

  return {
    available: totalValue > 0 || totalVolume > 0,
    totalValue,
    totalVolume,
    previousSessionValue: previousSession?.value ?? null,
    previousSessionVolume: previousSession?.volume ?? null,
    topLiquidity,
    intradayAvailable: false,
    intradaySeries: { today: [], previous: [] },
  }
}

export function emptyProprietaryAnalytics(): VietnamMarketAnalytics["proprietary"] {
  return {
    available: false,
    source: null,
    buyValue: null,
    sellValue: null,
    netValue: null,
    history: [],
    topNetBuy: [],
    topNetSell: [],
  }
}

export function buildUnavailableAnalytics(): VietnamMarketAnalytics {
  return {
    breadth: computeBreadthAnalytics({ hose: [], hnx: [], upcom: [] }, false),
    foreignFlow: computeForeignFlowAnalytics([]),
    proprietary: emptyProprietaryAnalytics(),
    liquidity: computeLiquidityAnalytics({ hose: [], hnx: [], upcom: [] }, false),
  }
}

export function buildVietnamMarketAnalytics(input: {
  stocks: {
    hose: VietnamHeatmapStock[]
    hnx: VietnamHeatmapStock[]
    upcom: VietnamHeatmapStock[]
  }
  hasLiveStocks: boolean
  foreignRows: KbsForeignTotalRow[]
  previousSession?: { volume: number | null; value: number | null }
  liveSymbols?: Set<string>
}): VietnamMarketAnalytics {
  return {
    breadth: computeBreadthAnalytics(input.stocks, input.hasLiveStocks, input.liveSymbols),
    foreignFlow: computeForeignFlowAnalytics(input.foreignRows),
    proprietary: emptyProprietaryAnalytics(),
    liquidity: computeLiquidityAnalytics(
      input.stocks,
      input.hasLiveStocks,
      input.previousSession,
      input.liveSymbols,
    ),
  }
}
