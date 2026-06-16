import "server-only"

import { fetchWithTimeout } from "@/lib/providers/fetch-utils"

/** KB Securities IIS — vnstock 4.x default source (free, no API key). */
export const KBS_BASE = "https://kbbuddywts.kbsec.com.vn/iis-server/investment"

export type KbsRawRow = Record<string, unknown>

export type KbsLeaderboardRow = {
  symbol: string
  exchange?: string
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  value?: number
  foreignBuy?: number
  foreignSell?: number
  rank: number
}

export type KbsMarketDashboard = {
  topVolume: KbsLeaderboardRow[]
  topValue: KbsLeaderboardRow[]
  topForeignBuy: KbsLeaderboardRow[]
  topForeignSell: KbsLeaderboardRow[]
  fetchedAt: string
}

const LEADERBOARD_LIMIT = 10

export function kbsHeaders(): HeadersInit {
  return {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    "x-lang": "vi",
  }
}

function num(value: unknown): number | undefined {
  if (value == null || value === "") return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim()
  return undefined
}

function formatKbsDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

async function kbsGet(path: string): Promise<unknown> {
  const res = await fetchWithTimeout(
    `${KBS_BASE}${path}`,
    { headers: kbsHeaders(), cache: "no-store" },
    15_000,
  )
  if (!res.ok) throw new Error(`KBS GET ${path} HTTP ${res.status}`)
  return res.json()
}

export async function fetchKbsPriceBoard(symbols: string[]): Promise<KbsRawRow[]> {
  if (!symbols.length) return []
  const res = await fetchWithTimeout(
    `${KBS_BASE}/stock/iss`,
    {
      method: "POST",
      headers: kbsHeaders(),
      body: JSON.stringify({ code: symbols.join(",") }),
      cache: "no-store",
    },
    15_000,
  )
  if (!res.ok) throw new Error(`KBS price_board HTTP ${res.status}`)
  const json = (await res.json()) as KbsRawRow[] | { data?: KbsRawRow[] }
  return Array.isArray(json) ? json : (json.data ?? [])
}

function parseRankingRow(row: KbsRawRow, rank: number): KbsLeaderboardRow {
  const symbol = str(row.sb ?? row.SB) ?? "?"
  const price = num(row.FMP ?? row.CP ?? row.FMP)
  const change = num(row.CH)
  const changePercent = num(row.CHPE ?? row.CHP)
  const volume = num(row.TT ?? row.ORIGINAL_VAL ?? row.CV)
  const value = num(row.TV ?? row.VAL ?? row.ORIGINAL_VAL)
  return {
    symbol,
    exchange: str(row.EX),
    price,
    change,
    changePercent,
    volume,
    value,
    rank,
  }
}

function parseForeignRow(row: KbsRawRow, rank: number): KbsLeaderboardRow {
  const symbol = str(row.SB ?? row.sb) ?? "?"
  return {
    symbol,
    exchange: str(row.EX),
    price: num(row.CP ?? row.FMP),
    change: num(row.CH),
    changePercent: num(row.CHP ?? row.CHPE),
    foreignBuy: num(row.FB),
    foreignSell: num(row.FS),
    volume: num(row.FT),
    rank,
  }
}

function rankRows<T>(rows: T[], map: (row: T, i: number) => KbsLeaderboardRow, limit = LEADERBOARD_LIMIT) {
  return rows.slice(0, limit).map((row, i) => map(row, i + 1))
}

/** Top-volume / top-value / foreign-flow leaderboards from KBS ranking APIs. */
export async function fetchKbsMarketDashboard(): Promise<KbsMarketDashboard | null> {
  if (process.env.KBS_ADAPTER_ENABLED === "false") return null

  try {
    const [volumeJson, valueJson, foreignJson] = await Promise.all([
      kbsGet("/rtranking/volume"),
      kbsGet("/rtranking/value"),
      kbsGet("/rtranking/foreignTotal"),
    ])

    const volumeRows = Array.isArray(volumeJson) ? volumeJson : []
    const valueRows = Array.isArray(valueJson) ? valueJson : []
    const foreignRows = Array.isArray(foreignJson) ? foreignJson : []

    const foreignBuySorted = [...foreignRows].sort(
      (a, b) => (num((b as KbsRawRow).FB) ?? 0) - (num((a as KbsRawRow).FB) ?? 0),
    )
    const foreignSellSorted = [...foreignRows].sort(
      (a, b) => (num((b as KbsRawRow).FS) ?? 0) - (num((a as KbsRawRow).FS) ?? 0),
    )

    return {
      topVolume: rankRows(volumeRows, parseRankingRow),
      topValue: rankRows(valueRows, parseRankingRow),
      topForeignBuy: rankRows(foreignBuySorted, parseForeignRow),
      topForeignSell: rankRows(foreignSellSorted, parseForeignRow),
      fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "KBS dashboard fetch failed"
    console.warn(`[provider:kbs] dashboard error=${message}`)
    return null
  }
}

/** Full foreign-flow ranking rows from KBS (aggregated across HOSE/HNX/UPCOM). */
export async function fetchKbsForeignTotalRows(): Promise<KbsRawRow[]> {
  if (process.env.KBS_ADAPTER_ENABLED === "false") return []

  try {
    const json = await kbsGet("/rtranking/foreignTotal")
    return Array.isArray(json) ? json : []
  } catch (error) {
    const message = error instanceof Error ? error.message : "KBS foreignTotal fetch failed"
    console.warn(`[provider:kbs] foreignTotal error=${message}`)
    return []
  }
}

export function parseKbsForeignTotalRow(row: KbsRawRow) {
  const symbol = str(row.SB ?? row.sb)?.toUpperCase()
  if (!symbol) return null
  const price = num(row.CP ?? row.FMP) ?? 0
  const foreignBuy = num(row.FB) ?? 0
  const foreignSell = num(row.FS) ?? 0
  if (foreignBuy === 0 && foreignSell === 0) return null
  return { symbol, price, foreignBuy, foreignSell }
}

/** Last N daily index bars (close + volume) for session comparison. */
export async function fetchKbsIndexDailyBars(
  symbol: string,
  days = 5,
): Promise<Array<{ date: string; close: number; volume: number }>> {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days)

  const url = `${KBS_BASE}/index/${symbol}/data_day?sdate=${formatKbsDate(start)}&edate=${formatKbsDate(end)}`
  const res = await fetchWithTimeout(url, { headers: kbsHeaders(), cache: "no-store" }, 15_000)
  if (!res.ok) return []

  const json = (await res.json()) as { data_day?: Array<Record<string, unknown>> }
  const bars = json.data_day ?? []

  return bars
    .map((bar) => {
      const close = num(bar.c)
      const volume = num(bar.v)
      const date = str(bar.d) ?? str(bar.date) ?? ""
      if (close == null || volume == null) return null
      return { date, close, volume }
    })
    .filter((bar): bar is { date: string; close: number; volume: number } => bar != null)
}

/** Latest index close from KBS daily chart (VNINDEX, VN30, HNX, UPCOM). */
export async function fetchKbsIndexSnapshot(symbol: string): Promise<{
  price: number
  change: number
  changePercent: number
  volume: number
} | null> {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 7)

  const url = `${KBS_BASE}/index/${symbol}/data_day?sdate=${formatKbsDate(start)}&edate=${formatKbsDate(end)}`
  const res = await fetchWithTimeout(url, { headers: kbsHeaders(), cache: "no-store" }, 15_000)
  if (!res.ok) return null

  const json = (await res.json()) as { data_day?: Array<Record<string, unknown>> }
  const bars = json.data_day ?? []
  if (!bars.length) return null

  const last = bars[bars.length - 1]
  const prev = bars.length > 1 ? bars[bars.length - 2] : undefined
  const close = num(last.c)
  if (close == null) return null
  const prevClose = prev ? num(prev.c) : undefined
  const change =
    prevClose != null ? Number((close - prevClose).toFixed(2)) : 0
  const changePercent =
    prevClose != null && prevClose !== 0
      ? Number(((change / prevClose) * 100).toFixed(2))
      : 0

  return {
    price: close,
    change,
    changePercent,
    volume: num(last.v) ?? 0,
  }
}

export function parseKbsPriceBoardRow(row: KbsRawRow) {
  const symbol = str(row.SB)?.toUpperCase()
  if (!symbol) return null

  const price = num(row.CP)
  if (price == null) return null

  const change = num(row.CH) ?? 0
  const changePercent = num(row.CHP) ?? 0
  const volume = num(row.TT) ?? 0
  const exchangeRaw = str(row.EX)?.toUpperCase()

  return {
    symbol,
    price,
    change,
    changePercent,
    volume,
    value: Math.round(price * volume),
    foreignBuy: num(row.FB),
    foreignSell: num(row.FS),
    exchange:
      exchangeRaw === "HSX" || exchangeRaw === "HOSE"
        ? ("hose" as const)
        : exchangeRaw === "HNX"
          ? ("hnx" as const)
          : exchangeRaw === "UPCOM"
            ? ("upcom" as const)
            : ("hose" as const),
  }
}
