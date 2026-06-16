import "server-only"

import { CURRENCY_STRENGTH_PAIRS } from "@/config/market-symbols"
import type { FxPairQuote } from "@/lib/forex/types"
import { CACHE_KEYS, CACHE_TTL, cachedProvider } from "@/lib/providers/cache"
import { round2 } from "@/lib/market/normalize"

import type { AlphaVantageFxDailyResponse } from "./types"

const BASE_URL = "https://www.alphavantage.co/query"
const FETCH_DELAY_MS = 250
const MAX_RETRIES = 2

function getApiKey(): string | null {
  try {
    const key = process.env.ALPHA_VANTAGE_API_KEY?.trim()
    return key || null
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parsePair(pair: string): { from: string; to: string } | null {
  const parts = pair.split("/")
  if (parts.length !== 2) return null
  const from = parts[0]?.trim().toUpperCase()
  const to = parts[1]?.trim().toUpperCase()
  if (!from || !to) return null
  return { from, to }
}

function isRateLimited(body: AlphaVantageFxDailyResponse): boolean {
  return Boolean(body.Note ?? body.Information ?? body["Error Message"])
}

async function avFetchFxDaily(from: string, to: string): Promise<AlphaVantageFxDailyResponse | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const params = new URLSearchParams({
    function: "FX_DAILY",
    from_symbol: from,
    to_symbol: to,
    outputsize: "compact",
    apikey: apiKey,
  })

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (!res.ok) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(400 * (attempt + 1))
          continue
        }
        return null
      }

      const json = (await res.json()) as AlphaVantageFxDailyResponse
      if (isRateLimited(json)) return null
      return json
    } catch {
      if (attempt < MAX_RETRIES - 1) await sleep(400 * (attempt + 1))
    }
  }
  return null
}

function dailyChangeFromSeries(json: AlphaVantageFxDailyResponse): {
  price: number
  changePercent: number
  updatedAt: string
} | null {
  const series = json["Time Series FX (Daily)"]
  if (!series) return null

  const dates = Object.keys(series).sort((a, b) => b.localeCompare(a))
  if (dates.length < 2) return null

  const latestDate = dates[0]
  const prevDate = dates[1]
  const latestClose = Number(series[latestDate]?.["4. close"])
  const prevClose = Number(series[prevDate]?.["4. close"])
  if (!Number.isFinite(latestClose) || !Number.isFinite(prevClose) || prevClose <= 0) {
    return null
  }

  return {
    price: latestClose,
    changePercent: round2(((latestClose - prevClose) / prevClose) * 100),
    updatedAt: new Date(`${latestDate}T00:00:00.000Z`).toISOString(),
  }
}

async function fetchSinglePair(pair: string): Promise<FxPairQuote | null> {
  const parsed = parsePair(pair)
  if (!parsed) return null

  const json = await avFetchFxDaily(parsed.from, parsed.to)
  if (!json) return null

  const row = dailyChangeFromSeries(json)
  if (!row) return null

  return {
    symbol: pair.replace("/", ""),
    price: row.price,
    changePercent: row.changePercent,
    updatedAt: row.updatedAt,
  }
}

/** Fetch 28 FX pairs for currency strength (Alpha Vantage FX_DAILY, 1D % change). */
async function fetchForexPairsUncached(): Promise<FxPairQuote[]> {
  if (!getApiKey()) return []

  const pairs: FxPairQuote[] = []

  for (const pair of CURRENCY_STRENGTH_PAIRS) {
    const quote = await fetchSinglePair(pair)
    if (quote) pairs.push(quote)
    await sleep(FETCH_DELAY_MS)
  }

  return pairs
}

/** Cached Alpha Vantage forex pairs for currency strength. */
export async function getForexPairsForCurrencyStrength(): Promise<FxPairQuote[]> {
  const cached = await cachedProvider(
    CACHE_KEYS.forexAlphaVantage,
    async () => {
      const data = await fetchForexPairsUncached()
      if (!data.length) return null
      return { data, source: "live" as const }
    },
    { ttlMs: CACHE_TTL.forex },
  )

  return cached?.data ?? fetchForexPairsUncached()
}

export function isAlphaVantageConfigured(): boolean {
  return Boolean(getApiKey())
}
