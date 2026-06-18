import "server-only"

import { KBS_BASE, kbsHeaders } from "@/lib/providers/kbs-client"
import { fetchWithTimeout } from "@/lib/providers/fetch-utils"

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; MarketWall/1.0)",
  Accept: "application/json",
} as const

const MOMENTUM_LOOKBACK_BARS = 20

function formatKbsDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function returnPercent(current: number, past: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(past) || past === 0) return null
  return Number((((current - past) / past) * 100).toFixed(2))
}

/** VNINDEX (or other KBS index) 20-trading-day price momentum %. */
export async function fetchVnindexMomentum20d(
  symbol = "VNINDEX",
): Promise<number | null> {
  const ctx = await fetchVnindexIndexContext(symbol)
  return ctx?.momentum20d ?? null
}

export type VnindexIndexContext = {
  momentum20d: number | null
  ma20: number | null
  ma50: number | null
  lastClose: number | null
  /** Intraday range as % of last close (high-low)/close. */
  intradayRangePct: number | null
}

function simpleMa(closes: number[], period: number): number | null {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  const sum = slice.reduce((acc, c) => acc + c, 0)
  return sum / period
}

/** VNINDEX context: 20D momentum, MA20/MA50, intraday range. */
export async function fetchVnindexIndexContext(
  symbol = "VNINDEX",
): Promise<VnindexIndexContext | null> {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 90)

  const url =
    `${KBS_BASE}/index/${symbol}/data_day` +
    `?sdate=${formatKbsDate(start)}&edate=${formatKbsDate(end)}`

  try {
    const res = await fetchWithTimeout(url, { headers: kbsHeaders(), cache: "no-store" }, 15_000)
    if (!res.ok) return null

    const json = (await res.json()) as {
      data_day?: Array<{ c?: number; h?: number; l?: number }>
    }
    const bars = json.data_day ?? []
    if (bars.length < 2) return null

    const closes = bars
      .map((b) => b.c)
      .filter((c): c is number => c != null && Number.isFinite(c))
    if (closes.length < 2) return null

    const lastClose = closes[closes.length - 1]
    const pastClose =
      closes.length > MOMENTUM_LOOKBACK_BARS
        ? closes[closes.length - 1 - MOMENTUM_LOOKBACK_BARS]
        : null
    const momentum20d =
      pastClose != null ? returnPercent(lastClose, pastClose) : null

    const lastBar = bars[bars.length - 1]
    const high = lastBar?.h
    const low = lastBar?.l
    const intradayRangePct =
      high != null && low != null && lastClose > 0
        ? Number((((high - low) / lastClose) * 100).toFixed(2))
        : null

    return {
      momentum20d,
      ma20: simpleMa(closes, 20),
      ma50: simpleMa(closes, 50),
      lastClose,
      intradayRangePct,
    }
  } catch {
    return null
  }
}

/** S&P 500 (^GSPC) 20-trading-day price momentum % via Yahoo chart. */
export async function fetchSp500Momentum20d(): Promise<number | null> {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=3mo"

  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS, cache: "no-store" })
    if (!res.ok) return null

    const json = (await res.json()) as {
      chart?: { result?: Array<{ indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> }
    }
    const closes = json.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
      (c): c is number => c != null && Number.isFinite(c),
    )
    if (!closes || closes.length <= MOMENTUM_LOOKBACK_BARS) return null

    const current = closes[closes.length - 1]
    const past = closes[closes.length - 1 - MOMENTUM_LOOKBACK_BARS]
    return returnPercent(current, past)
  } catch {
    return null
  }
}
