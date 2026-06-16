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
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 45)

  const url =
    `${KBS_BASE}/index/${symbol}/data_day` +
    `?sdate=${formatKbsDate(start)}&edate=${formatKbsDate(end)}`

  try {
    const res = await fetchWithTimeout(url, { headers: kbsHeaders(), cache: "no-store" }, 15_000)
    if (!res.ok) return null

    const json = (await res.json()) as { data_day?: Array<{ c?: number }> }
    const bars = json.data_day ?? []
    if (bars.length <= MOMENTUM_LOOKBACK_BARS) return null

    const lastClose = bars[bars.length - 1]?.c
    const pastClose = bars[bars.length - 1 - MOMENTUM_LOOKBACK_BARS]?.c
    if (lastClose == null || pastClose == null) return null

    return returnPercent(lastClose, pastClose)
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
