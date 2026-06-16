import "server-only"

import { safeFetchJson } from "@/lib/providers/fetch-utils"

import type { NormalizedMarketQuote } from "./types"

/** Requires env: TWELVE_DATA_API_KEY */
const BASE_URL = "https://api.twelvedata.com"

export type TwelveDataSymbolDef = {
  /** Twelve Data symbol (e.g. XAU/USD, SPX). */
  apiSymbol: string
  /** Dashboard display symbol (e.g. GOLD, S&P 500). */
  displaySymbol: string
  name: string
}

type TwelveDataQuoteRow = {
  symbol?: string
  name?: string
  open?: string
  high?: string
  low?: string
  close?: string
  volume?: string
  change?: string
  percent_change?: string
  datetime?: string
  timestamp?: number
}

type TwelveDataQuoteResponse =
  | TwelveDataQuoteRow
  | Record<string, TwelveDataQuoteRow>

function getApiKey(): string | null {
  try {
    const key = process.env.TWELVE_DATA_API_KEY?.trim()
    return key || null
  } catch {
    return null
  }
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function parseNumber(value: string | number | undefined | null, fallback = 0): number {
  if (value == null || value === "") return fallback
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeRow(
  row: TwelveDataQuoteRow,
  def: TwelveDataSymbolDef,
): NormalizedMarketQuote | null {
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

function extractRow(
  json: TwelveDataQuoteResponse,
  def: TwelveDataSymbolDef,
): TwelveDataQuoteRow | null {
  if (!json || typeof json !== "object") return null

  if ("close" in json || "symbol" in json) {
    return json as TwelveDataQuoteRow
  }

  const keyed = json as Record<string, TwelveDataQuoteRow>
  return keyed[def.apiSymbol] ?? keyed[def.displaySymbol] ?? null
}

/** Fetch a single quote from Twelve Data. */
export async function fetchTwelveDataQuote(
  def: TwelveDataSymbolDef,
): Promise<NormalizedMarketQuote | null> {
  try {
    const apiKey = getApiKey()
    if (!apiKey) return null

    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(def.apiSymbol)}&apikey=${encodeURIComponent(apiKey)}`
    const json = await safeFetchJson<TwelveDataQuoteResponse>(url, { cache: "no-store" })
    const row = extractRow(json ?? {}, def)
    if (!row) return null
    return normalizeRow(row, def)
  } catch {
    return null
  }
}

/** Fetch multiple quotes in one batch request. */
export async function fetchTwelveDataQuotes(
  defs: TwelveDataSymbolDef[],
): Promise<NormalizedMarketQuote[]> {
  try {
    const apiKey = getApiKey()
    if (!apiKey || defs.length === 0) return []

    const symbols = defs.map((d) => d.apiSymbol).join(",")
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbols)}&apikey=${encodeURIComponent(apiKey)}`
    const json = await safeFetchJson<TwelveDataQuoteResponse>(url, { cache: "no-store" })
    if (!json) return []

    const quotes: NormalizedMarketQuote[] = []
    for (const def of defs) {
      try {
        const row = extractRow(json, def)
        if (!row) continue
        const quote = normalizeRow(row, def)
        if (quote) quotes.push(quote)
      } catch {
        continue
      }
    }

    return quotes
  } catch {
    return []
  }
}

/** Fetch FX pair price + change for currency strength. */
export async function fetchTwelveDataFxPair(
  pair: string,
): Promise<{ symbol: string; price: number; changePercent: number; updatedAt: string } | null> {
  try {
    const quote = await fetchTwelveDataQuote({
      apiSymbol: pair,
      displaySymbol: pair.replace("/", ""),
      name: pair,
    })
    if (!quote) return null

    return {
      symbol: pair.replace("/", ""),
      price: quote.price,
      changePercent: quote.changePercent,
      updatedAt: quote.updatedAt,
    }
  } catch {
    return null
  }
}
