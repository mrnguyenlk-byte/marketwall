import "server-only"

export type VnOhlcBar = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type VnChartPayload = {
  symbol: string
  exchange: string
  source: "entrade"
  bars: VnOhlcBar[]
  barCount: number
}

type EntradeOhlcResponse = {
  t?: number[]
  o?: number[]
  h?: number[]
  l?: number[]
  c?: number[]
  v?: number[]
}

const ENTRADE_CHART_URL = "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock"
const DEFAULT_BAR_LIMIT = 252

/** Entrade returns equity prices in thousands of VND (e.g. 61.8 → 61,800). */
export function normalizeEntradePrice(value: number): number {
  if (!Number.isFinite(value)) return 0
  return value < 10_000 ? Math.round(value * 1000) : Math.round(value)
}

function unixToDateString(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().slice(0, 10)
}

function parseEntradeBars(json: EntradeOhlcResponse, limit: number): VnOhlcBar[] {
  const times = json.t ?? []
  const len = times.length
  if (len === 0) return []

  const start = Math.max(0, len - limit)
  const bars: VnOhlcBar[] = []

  for (let i = start; i < len; i++) {
    const open = json.o?.[i]
    const high = json.h?.[i]
    const low = json.l?.[i]
    const close = json.c?.[i]
    const volume = json.v?.[i]
    if (open == null || high == null || low == null || close == null) continue

    bars.push({
      time: unixToDateString(times[i]),
      open: normalizeEntradePrice(open),
      high: normalizeEntradePrice(high),
      low: normalizeEntradePrice(low),
      close: normalizeEntradePrice(close),
      volume: Math.round(volume ?? 0),
    })
  }

  return bars
}

/** Daily OHLCV history for Vietnam equities via Entrade public chart API. */
export async function fetchVietnamChartHistory(
  symbol: string,
  limit = DEFAULT_BAR_LIMIT,
): Promise<VnChartPayload | null> {
  const ticker = symbol.trim().toUpperCase()
  if (!ticker) return null

  const url = `${ENTRADE_CHART_URL}?symbol=${encodeURIComponent(ticker)}&resolution=1D&from=0&to=9999999999`

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "MarketWall/1.0" },
      cache: "no-store",
    })
    if (!res.ok) {
      console.warn(`[provider:vietnam-chart] symbol=${ticker} http=${res.status}`)
      return null
    }

    const json = (await res.json()) as EntradeOhlcResponse
    const bars = parseEntradeBars(json, limit)
    if (!bars.length) return null

    console.log(`[provider:vietnam-chart] symbol=${ticker} bars=${bars.length}`)

    return {
      symbol: ticker,
      exchange: "VN",
      source: "entrade",
      bars,
      barCount: bars.length,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "entrade chart fetch failed"
    console.warn(`[provider:vietnam-chart] symbol=${ticker} error=${message}`)
    return null
  }
}
