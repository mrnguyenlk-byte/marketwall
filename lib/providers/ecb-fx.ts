import "server-only"

import { type StrengthPairSymbol } from "@/lib/currency-strength/types"
import type { FxPairQuote } from "@/lib/forex/types"

const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"

const ECB_CURRENCY_CODES = new Set<string>(["USD", "JPY", "GBP", "AUD", "NZD", "CAD", "CHF"])

const PAIR_TO_ECB: Partial<Record<StrengthPairSymbol, { base: string; quote: string }>> = {
  EURUSD: { base: "EUR", quote: "USD" },
  EURGBP: { base: "EUR", quote: "GBP" },
  EURJPY: { base: "EUR", quote: "JPY" },
  EURAUD: { base: "EUR", quote: "AUD" },
  EURNZD: { base: "EUR", quote: "NZD" },
  EURCHF: { base: "EUR", quote: "CHF" },
  EURCAD: { base: "EUR", quote: "CAD" },
}

function parseEcbRates(xml: string): Map<string, number> {
  const rates = new Map<string, number>([["EUR", 1]])
  const re = /<Cube currency='([A-Z]{3})' rate='([0-9.]+)'\/>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) != null) {
    const currency = match[1]
    const rate = Number(match[2])
    if (ECB_CURRENCY_CODES.has(currency) && rate > 0) {
      rates.set(currency, rate)
    }
  }
  return rates
}

function derivePairPrice(
  pair: string,
  rates: Map<string, number>,
): { price: number; changePercent: number } | null {
  const symbol = pair.replace("/", "") as StrengthPairSymbol
  const direct = PAIR_TO_ECB[symbol]
  if (direct) {
    const quoteRate = rates.get(direct.quote)
    if (!quoteRate) return null
    return { price: quoteRate, changePercent: 0 }
  }

  const [base, quote] = pair.split("/")
  const baseRate = rates.get(base)
  const quoteRate = rates.get(quote)
  if (!baseRate || !quoteRate) return null

  const price = baseRate / quoteRate
  if (!Number.isFinite(price) || price <= 0) return null
  return { price: Number(price.toFixed(5)), changePercent: 0 }
}

/** ECB daily reference rates — fallback when Yahoo misses pairs (0% change; daily snapshot). */
export async function fetchEcbFxPairQuotes(pairs: readonly string[]): Promise<FxPairQuote[]> {
  try {
    const res = await fetch(ECB_DAILY_URL, { cache: "no-store" })
    if (!res.ok) return []
    const xml = await res.text()
    const rates = parseEcbRates(xml)
    if (rates.size < 3) return []

    const updatedAt = new Date().toISOString()
    const quotes: FxPairQuote[] = []

    for (const pair of pairs) {
      const derived = derivePairPrice(pair, rates)
      if (!derived) continue
      quotes.push({
        symbol: pair.replace("/", ""),
        price: derived.price,
        changePercent: derived.changePercent,
        updatedAt,
      })
    }

    console.log(`[provider:ecb] parsed=${quotes.length} requested=${pairs.length}`)
    return quotes
  } catch (error) {
    const message = error instanceof Error ? error.message : "ecb fetch failed"
    console.warn(`[provider:ecb] error=${message}`)
    return []
  }
}
