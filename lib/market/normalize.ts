import type { MarketSymbolDef } from "@/config/market-symbols"
import type { MarketQuote } from "@/types/market"
import type { HeatmapAsset } from "@/types/market"
import type {
  TwelveDataQuoteResponse,
  TwelveDataQuoteRow,
  TwelveDataTimeSeriesResponse,
} from "@/lib/twelvedata/types"
import type { NormalizedTimeSeriesPoint } from "@/lib/twelvedata/types"

export function round2(value: number): number {
  return Number(value.toFixed(2))
}

export function parseNumber(value: string | number | undefined | null, fallback = 0): number {
  if (value == null || value === "") return fallback
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function extractQuoteRow(
  json: TwelveDataQuoteResponse,
  symbol: string,
): TwelveDataQuoteRow | null {
  if (!json || typeof json !== "object") return null
  if ("close" in json || "symbol" in json) return json as TwelveDataQuoteRow
  const keyed = json as Record<string, TwelveDataQuoteRow>
  return keyed[symbol] ?? null
}

export function normalizeQuoteRow(
  row: TwelveDataQuoteRow,
  def: Pick<MarketSymbolDef, "displaySymbol" | "name">,
): MarketQuote | null {
  try {
    const price = parseNumber(row.close)
    if (price <= 0) return null

    const change = parseNumber(row.change)
    const changePercent = parseNumber(row.percent_change)
    const open = parseNumber(row.open, price)
    const high = parseNumber(row.high, price)
    const low = parseNumber(row.low, price)
    const volume = parseNumber(row.volume)

    let updatedAt = new Date().toISOString()
    if (row.timestamp) {
      updatedAt = new Date(row.timestamp * 1000).toISOString()
    } else if (row.datetime) {
      const parsed = new Date(row.datetime)
      if (!Number.isNaN(parsed.getTime())) updatedAt = parsed.toISOString()
    }

    return {
      symbol: def.displaySymbol,
      name: def.name,
      price: round2(price),
      change: round2(change),
      changePercent: round2(changePercent),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      volume: round2(volume),
      updatedAt,
    }
  } catch {
    return null
  }
}

export function normalizeTimeSeries(
  response: TwelveDataTimeSeriesResponse,
): NormalizedTimeSeriesPoint[] {
  const values = response.values ?? []
  return values
    .map((row) => ({
      datetime: row.datetime,
      open: round2(parseNumber(row.open)),
      high: round2(parseNumber(row.high)),
      low: round2(parseNumber(row.low)),
      close: round2(parseNumber(row.close)),
      volume: round2(parseNumber(row.volume)),
    }))
    .filter((row) => row.close > 0)
}

export function pairDef(pair: string): MarketSymbolDef {
  return {
    id: pair.toLowerCase().replace("/", ""),
    apiSymbol: pair,
    displaySymbol: pair,
    name: pair,
    category: "forex",
  }
}

export function stockDef(ticker: string): MarketSymbolDef {
  const apiSymbol = ticker.trim()
  return {
    id: apiSymbol.toLowerCase().replace(/[./]/g, ""),
    apiSymbol,
    displaySymbol: apiSymbol.replace("/", ""),
    name: apiSymbol.replace("/", ""),
    category: "equity",
  }
}

export function defsFromSymbols(
  symbols: string[],
  registry: MarketSymbolDef[],
): MarketSymbolDef[] {
  const apiSet = new Set(symbols)
  return registry.filter((def) => apiSet.has(def.apiSymbol))
}

/** Map live quotes onto heatmap rows (price/change overlay). */
export function overlayHeatmapQuotes(
  rows: HeatmapAsset[],
  liveQuotes: MarketQuote[],
): HeatmapAsset[] {
  const bySymbol = new Map(liveQuotes.map((q) => [q.symbol.toUpperCase(), q]))
  return rows.map((row) => {
    const live =
      bySymbol.get(row.symbol.toUpperCase()) ??
      bySymbol.get(`${row.symbol}/USD`.toUpperCase())
    if (!live) return row
    return {
      ...row,
      price: live.price,
      changePercent: live.changePercent,
    }
  })
}
