import type { VietnamDashboardRow } from "@/lib/providers/vietnam-market-provider"

export type ForeignFlowPeriod = "1d" | "7d" | "30d"
export type ForeignFlowDisplayMode = "value" | "volume"

const PERIOD_DAYS: Record<ForeignFlowPeriod, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
}

export type ForeignFlowBarRow = {
  rank: number
  buy?: ForeignFlowSide
  sell?: ForeignFlowSide
}

export type ForeignFlowSide = {
  symbol: string
  sector: string
  price: number
  shares: number
  valueVnd: number
  displayValue: number
}

export function periodMultiplier(period: ForeignFlowPeriod): number {
  return PERIOD_DAYS[period]
}

/** Share count scaled by period (KBS foreignTotal is daily; 7D/30D extrapolated). */
export function scaledShares(shares: number, period: ForeignFlowPeriod): number {
  return shares * periodMultiplier(period)
}

export function sharesToValueVnd(shares: number, price: number): number {
  return shares * price
}

export function valueToBillionVnd(valueVnd: number): number {
  return valueVnd / 1_000_000_000
}

export function foreignDisplayValue(
  row: VietnamDashboardRow,
  side: "buy" | "sell",
  period: ForeignFlowPeriod,
  mode: ForeignFlowDisplayMode,
): number {
  const rawShares = side === "buy" ? row.foreignBuy : row.foreignSell
  if (rawShares == null || rawShares <= 0) return 0
  const shares = scaledShares(rawShares, period)
  return mode === "value"
    ? valueToBillionVnd(sharesToValueVnd(shares, row.price ?? 0))
    : shares
}

function sortForeignRowsDesc(
  rows: VietnamDashboardRow[],
  side: "buy" | "sell",
  period: ForeignFlowPeriod,
  mode: ForeignFlowDisplayMode,
): VietnamDashboardRow[] {
  return [...rows]
    .filter((row) => foreignDisplayValue(row, side, period, mode) > 0)
    .sort(
      (a, b) =>
        foreignDisplayValue(b, side, period, mode) - foreignDisplayValue(a, side, period, mode),
    )
}

export function rowToForeignSide(
  row: VietnamDashboardRow,
  side: "buy" | "sell",
  period: ForeignFlowPeriod,
  mode: ForeignFlowDisplayMode,
  sector: string,
): ForeignFlowSide | undefined {
  const rawShares = side === "buy" ? row.foreignBuy : row.foreignSell
  if (rawShares == null || rawShares <= 0) return undefined

  const price = row.price ?? 0
  const shares = scaledShares(rawShares, period)
  const valueVnd = sharesToValueVnd(shares, price)

  return {
    symbol: row.symbol,
    sector,
    price,
    shares,
    valueVnd,
    displayValue: mode === "value" ? valueToBillionVnd(valueVnd) : shares,
  }
}

export function buildDivergingRows(
  buyRows: VietnamDashboardRow[],
  sellRows: VietnamDashboardRow[],
  period: ForeignFlowPeriod,
  mode: ForeignFlowDisplayMode,
  sectorLookup: (symbol: string) => string,
): ForeignFlowBarRow[] {
  const limit = 10
  const sortedBuy = sortForeignRowsDesc(buyRows, "buy", period, mode).slice(0, limit)
  const sortedSell = sortForeignRowsDesc(sellRows, "sell", period, mode).slice(0, limit)
  const rows: ForeignFlowBarRow[] = []

  for (let i = 0; i < limit; i++) {
    const buyRow = sortedBuy[i]
    const sellRow = sortedSell[i]
    rows.push({
      rank: i + 1,
      buy: buyRow
        ? rowToForeignSide(buyRow, "buy", period, mode, sectorLookup(buyRow.symbol))
        : undefined,
      sell: sellRow
        ? rowToForeignSide(sellRow, "sell", period, mode, sectorLookup(sellRow.symbol))
        : undefined,
    })
  }

  return rows
}

export function maxDisplayMagnitude(rows: ForeignFlowBarRow[]): number {
  let max = 0
  for (const row of rows) {
    if (row.buy) max = Math.max(max, row.buy.displayValue)
    if (row.sell) max = Math.max(max, row.sell.displayValue)
  }
  return max || 1
}
