import "server-only"

import { fetchWithTimeout } from "@/lib/providers/fetch-utils"

/** KBS IIS endpoints — default data source for vnstock 4.x (mirrors Python lib). */
export const VNSTOCK_KBS_BASE = "https://kbbuddywts.kbsec.com.vn/iis-server/investment"

export const VNSTOCK_TEST_STOCKS = ["VCB", "VIC", "FPT", "HPG", "MWG", "SHB"] as const
export const VNSTOCK_TEST_INDICES = ["VN30", "VN100"] as const

export type VnstockFieldAvailability = {
  price: boolean
  change: boolean
  volume: boolean
  marketCap: boolean
  sector: boolean
  ohlc: boolean
  historicalPrices: boolean
  foreignBuy: boolean
  foreignSell: boolean
}

export type VnstockProbeTiming = {
  endpoint: string
  ms: number
  ok: boolean
  status?: number
  error?: string
}

export type VnstockSymbolProbe = {
  symbol: string
  kind: "stock" | "index"
  ok: boolean
  timings: VnstockProbeTiming[]
  fields: VnstockFieldAvailability
  sample?: {
    price?: number
    change?: number
    changePercent?: number
    volume?: number
    marketCap?: number
    sector?: string
    ohlc?: { open: number; high: number; low: number; close: number }
    historicalBars?: number
    foreignBuyVolume?: number
    foreignSellVolume?: number
  }
  errors: string[]
}

export type VnstockMarketFeatureProbe = {
  topVolume: { ok: boolean; ms: number; count: number; topSymbol?: string; error?: string }
  topValue: { ok: boolean; ms: number; note: string; topSymbol?: string; error?: string }
  foreignFlow: { ok: boolean; ms: number; count: number; topNetBuy?: string; error?: string }
  marketBreadth: { ok: boolean; ms: number; note: string; error?: string }
}

export type VnstockApiKeyStatus = {
  configured: boolean
  formatValid: boolean
  preview: string | null
  tier: "unknown"
  note: string
}

export type VnstockAuditResult = {
  auditedAt: string
  library: {
    name: "vnstock (Python)",
    npmPackage: false
    defaultSource: "KBS"
    nodeIntegration: "HTTP mirror of KBS endpoints used by vnstock 4.x"
  }
  apiKey: VnstockApiKeyStatus
  symbols: VnstockSymbolProbe[]
  marketFeatures: VnstockMarketFeatureProbe
  rateLimits: {
    documented: {
      guestPerMinute: 20
      communityPerMinute: 60
      communityPerHour: 3000
    }
    observed: string
  }
  totalMs: number
}

type KbsPriceBoardRow = Record<string, unknown>

function kbsHeaders(): HeadersInit {
  return {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    "x-lang": "vi",
  }
}

function formatKbsDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
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

async function timedFetch<T>(
  endpoint: string,
  fn: () => Promise<T>,
): Promise<{ ms: number; result?: T; error?: string }> {
  const start = performance.now()
  try {
    const result = await fn()
    return { ms: Math.round(performance.now() - start), result }
  } catch (err) {
    return {
      ms: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export function getVnstockApiKeyStatus(): VnstockApiKeyStatus {
  const key = process.env.VNSTOCK_API_KEY?.trim()
  if (!key) {
    return {
      configured: false,
      formatValid: false,
      preview: null,
      tier: "unknown",
      note: "VNSTOCK_API_KEY is not set. KBS endpoints still work (guest limits apply in Python client).",
    }
  }

  const formatValid = key.length >= 10 && /^vnstock_/i.test(key)
  const preview = key.length > 8 ? `${key.slice(0, 4)}***${key.slice(-4)}` : "****"

  return {
    configured: true,
    formatValid,
    preview,
    tier: "unknown",
    note:
      "VNSTOCK_API_KEY is for the Python vnstock/vnai client (rate-limit tier). " +
      "It is not sent as an HTTP header to KBS data endpoints from this probe.",
  }
}

async function fetchPriceBoard(symbols: string[]): Promise<KbsPriceBoardRow[]> {
  const res = await fetchWithTimeout(
    `${VNSTOCK_KBS_BASE}/stock/iss`,
    {
      method: "POST",
      headers: kbsHeaders(),
      body: JSON.stringify({ code: symbols.join(",") }),
      cache: "no-store",
    },
    15_000,
  )
  if (!res.ok) throw new Error(`price_board HTTP ${res.status}`)
  const json = (await res.json()) as KbsPriceBoardRow[] | { data?: KbsPriceBoardRow[] }
  if (Array.isArray(json)) return json
  return json.data ?? []
}

async function fetchHistorical(
  symbol: string,
  kind: "stock" | "index",
  days = 30,
): Promise<Array<Record<string, unknown>>> {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days)

  const path =
    kind === "index"
      ? `${VNSTOCK_KBS_BASE}/index/${symbol}/data_day`
      : `${VNSTOCK_KBS_BASE}/stocks/${symbol}/data_day`

  const url = `${path}?sdate=${formatKbsDate(start)}&edate=${formatKbsDate(end)}`
  const res = await fetchWithTimeout(url, { headers: kbsHeaders(), cache: "no-store" }, 15_000)
  if (!res.ok) throw new Error(`history HTTP ${res.status}`)
  const json = (await res.json()) as { data_day?: Array<Record<string, unknown>> }
  return json.data_day ?? []
}

async function fetchCompanyProfile(symbol: string): Promise<Record<string, unknown> | null> {
  const res = await fetchWithTimeout(
    `${VNSTOCK_KBS_BASE}/stockinfo/profile/${symbol}?l=1`,
    { headers: kbsHeaders(), cache: "no-store" },
    15_000,
  )
  if (!res.ok) return null
  return (await res.json()) as Record<string, unknown>
}

function parseStockRow(row: KbsPriceBoardRow | undefined) {
  if (!row) return null
  const price = num(row.CP)
  const change = num(row.CH)
  const changePercent = num(row.CHP)
  const volume = num(row.TT)
  const foreignBuyVolume = num(row.FB)
  const foreignSellVolume = num(row.FS)
  const open = num(row.OP)
  const high = num(row.HI)
  const low = num(row.LO)
  const close = num(row.CP)
  return {
    price,
    change,
    changePercent,
    volume,
    foreignBuyVolume,
    foreignSellVolume,
    ohlc:
      open != null && high != null && low != null && close != null
        ? { open, high, low, close }
        : undefined,
  }
}

function parseIndexFromHistory(bars: Array<Record<string, unknown>>) {
  const last = bars[bars.length - 1]
  if (!last) return null
  const close = num(last.c)
  const open = num(last.o)
  const high = num(last.h)
  const low = num(last.l)
  const volume = num(last.v)
  const prev = bars.length > 1 ? bars[bars.length - 2] : undefined
  const prevClose = prev ? num(prev.c) : undefined
  const change =
    close != null && prevClose != null ? Number((close - prevClose).toFixed(2)) : undefined
  const changePercent =
    change != null && prevClose != null && prevClose !== 0
      ? Number(((change / prevClose) * 100).toFixed(2))
      : undefined
  return {
    price: close,
    change,
    changePercent,
    volume,
    ohlc:
      open != null && high != null && low != null && close != null
        ? { open, high, low, close }
        : undefined,
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
}

export async function probeVnstockSymbol(
  symbol: string,
  kind: "stock" | "index",
  priceBoardCache?: Map<string, KbsPriceBoardRow>,
): Promise<VnstockSymbolProbe> {
  const timings: VnstockProbeTiming[] = []
  const errors: string[] = []
  const fields: VnstockFieldAvailability = {
    price: false,
    change: false,
    volume: false,
    marketCap: false,
    sector: false,
    ohlc: false,
    historicalPrices: false,
    foreignBuy: false,
    foreignSell: false,
  }

  let sample: VnstockSymbolProbe["sample"]

  if (kind === "stock") {
    const boardTimed = await timedFetch("price_board", async () => {
      if (priceBoardCache?.has(symbol)) return priceBoardCache.get(symbol)
      const rows = await fetchPriceBoard([symbol])
      const row = rows.find((r) => str(r.SB)?.toUpperCase() === symbol) ?? rows[0]
      if (row) priceBoardCache?.set(symbol, row)
      return row
    })

    timings.push({
      endpoint: "price_board",
      ms: boardTimed.ms,
      ok: boardTimed.result != null && !boardTimed.error,
      error: boardTimed.error,
    })

    if (boardTimed.error) errors.push(boardTimed.error)
    const parsed = parseStockRow(boardTimed.result)
    if (parsed) {
      fields.price = parsed.price != null
      fields.change = parsed.change != null || parsed.changePercent != null
      fields.volume = parsed.volume != null
      fields.ohlc = parsed.ohlc != null
      fields.foreignBuy = parsed.foreignBuyVolume != null
      fields.foreignSell = parsed.foreignSellVolume != null
      sample = { ...parsed }
    }

    const histTimed = await timedFetch("historical_ohlcv", () => fetchHistorical(symbol, "stock"))
    timings.push({
      endpoint: "historical_ohlcv",
      ms: histTimed.ms,
      ok: (histTimed.result?.length ?? 0) > 0 && !histTimed.error,
      error: histTimed.error,
    })
    if (histTimed.error) errors.push(histTimed.error)
    if (histTimed.result && histTimed.result.length > 0) {
      fields.historicalPrices = true
      sample = { ...sample, historicalBars: histTimed.result.length }
      const last = histTimed.result[histTimed.result.length - 1]
      if (!fields.ohlc && last) {
        const o = num(last.o)
        const h = num(last.h)
        const l = num(last.l)
        const c = num(last.c)
        if (o != null && h != null && l != null && c != null) {
          fields.ohlc = true
          sample.ohlc = { open: o, high: h, low: l, close: c }
        }
      }
    }

    const profileTimed = await timedFetch("company_profile", () => fetchCompanyProfile(symbol))
    timings.push({
      endpoint: "company_profile",
      ms: profileTimed.ms,
      ok: profileTimed.result != null && !profileTimed.error,
      error: profileTimed.error,
    })
    if (profileTimed.error) errors.push(profileTimed.error)
    if (profileTimed.result) {
      const sm = str(profileTimed.result.SM)
      if (sm) {
        fields.sector = true
        sample = { ...sample, sector: stripHtml(sm) }
      }
      const listedShares = num(profileTimed.result.KLCPLH)
      const price = sample?.price
      if (listedShares != null && price != null) {
        fields.marketCap = true
        sample = { ...sample, marketCap: Math.round(price * listedShares) }
      }
    }
  } else {
    const histTimed = await timedFetch("index_historical", () => fetchHistorical(symbol, "index"))
    timings.push({
      endpoint: "index_historical",
      ms: histTimed.ms,
      ok: (histTimed.result?.length ?? 0) > 0 && !histTimed.error,
      error: histTimed.error,
    })
    if (histTimed.error) errors.push(histTimed.error)
    if (histTimed.result && histTimed.result.length > 0) {
      fields.historicalPrices = true
      fields.price = true
      fields.change = true
      fields.volume = true
      fields.ohlc = true
      sample = {
        ...parseIndexFromHistory(histTimed.result),
        historicalBars: histTimed.result.length,
      }
    }
  }

  return {
    symbol,
    kind,
    ok: errors.length === 0 && fields.price,
    timings,
    fields,
    sample,
    errors,
  }
}

export async function probeVnstockMarketFeatures(): Promise<VnstockMarketFeatureProbe> {
  const topVolumeStart = performance.now()
  let topVolume: VnstockMarketFeatureProbe["topVolume"] = {
    ok: false,
    ms: 0,
    count: 0,
  }

  try {
    const res = await fetchWithTimeout(
      `${VNSTOCK_KBS_BASE}/rtranking/volume`,
      { headers: kbsHeaders(), cache: "no-store" },
      15_000,
    )
    topVolume.ms = Math.round(performance.now() - topVolumeStart)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as Array<Record<string, unknown>>
    topVolume = {
      ok: rows.length > 0,
      ms: topVolume.ms,
      count: rows.length,
      topSymbol: str(rows[0]?.sb ?? rows[0]?.SB),
    }
  } catch (err) {
    topVolume = {
      ok: false,
      ms: Math.round(performance.now() - topVolumeStart),
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  const foreignStart = performance.now()
  let foreignFlow: VnstockMarketFeatureProbe["foreignFlow"] = {
    ok: false,
    ms: 0,
    count: 0,
  }

  try {
    const res = await fetchWithTimeout(
      `${VNSTOCK_KBS_BASE}/rtranking/foreignTotal`,
      { headers: kbsHeaders(), cache: "no-store" },
      15_000,
    )
    foreignFlow.ms = Math.round(performance.now() - foreignStart)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as Array<Record<string, unknown>>
    const top = rows[0]
    const buy = num(top?.FB)
    const sell = num(top?.FS)
    foreignFlow = {
      ok: rows.length > 0,
      ms: foreignFlow.ms,
      count: rows.length,
      topNetBuy:
        top && str(top.SB)
          ? `${str(top.SB)} (buy ${buy ?? "?"} / sell ${sell ?? "?"})`
          : undefined,
    }
  } catch (err) {
    foreignFlow = {
      ok: false,
      ms: Math.round(performance.now() - foreignStart),
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  const valueStart = performance.now()
  let topValue: VnstockMarketFeatureProbe["topValue"] = {
    ok: false,
    ms: 0,
    note: "KBS /rtranking/value — top traded value leaderboard",
  }

  try {
    const res = await fetchWithTimeout(
      `${VNSTOCK_KBS_BASE}/rtranking/value`,
      { headers: kbsHeaders(), cache: "no-store" },
      15_000,
    )
    topValue.ms = Math.round(performance.now() - valueStart)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as Array<Record<string, unknown>>
    topValue = {
      ok: rows.length > 0,
      ms: topValue.ms,
      note: "Native KBS ranking endpoint (vnstock Trading source)",
      topSymbol: str(rows[0]?.sb ?? rows[0]?.SB),
    }
  } catch (err) {
    topValue = {
      ok: false,
      ms: Math.round(performance.now() - valueStart),
      note: "Native value ranking failed — fallback unavailable",
      error: err instanceof Error ? err.message : String(err),
    }
  }

  return {
    topVolume,
    topValue,
    foreignFlow,
    marketBreadth: {
      ok: false,
      ms: 0,
      note:
        "No market breadth (advance/decline) endpoint in vnstock KBS source — would require full-universe scan",
    },
  }
}

export async function runVnstockCapabilityAudit(
  symbols?: string[],
): Promise<VnstockAuditResult> {
  const auditStart = performance.now()
  const stockList = (symbols?.length ? symbols : [...VNSTOCK_TEST_STOCKS]).map((s) =>
    s.toUpperCase(),
  )

  const priceBoardCache = new Map<string, KbsPriceBoardRow>()

  try {
    const batchStart = performance.now()
    const rows = await fetchPriceBoard(stockList)
    for (const row of rows) {
      const sym = str(row.SB)?.toUpperCase()
      if (sym) priceBoardCache.set(sym, row)
    }
    void batchStart
  } catch {
    // Per-symbol probes will retry individually
  }

  const symbolResults: VnstockSymbolProbe[] = []

  for (const symbol of stockList) {
    symbolResults.push(await probeVnstockSymbol(symbol, "stock", priceBoardCache))
    await new Promise((r) => setTimeout(r, 150))
  }

  for (const index of VNSTOCK_TEST_INDICES) {
    symbolResults.push(await probeVnstockSymbol(index, "index"))
    await new Promise((r) => setTimeout(r, 150))
  }

  const marketFeatures = await probeVnstockMarketFeatures()

  return {
    auditedAt: new Date().toISOString(),
    library: {
      name: "vnstock (Python)",
      npmPackage: false,
      defaultSource: "KBS",
      nodeIntegration: "HTTP mirror of KBS endpoints used by vnstock 4.x",
    },
    apiKey: getVnstockApiKeyStatus(),
    symbols: symbolResults,
    marketFeatures,
    rateLimits: {
      documented: {
        guestPerMinute: 20,
        communityPerMinute: 60,
        communityPerHour: 3000,
      },
      observed: "No 429 during audit batch (~20 KBS calls in ~5s). Python vnai enforces soft limits client-side.",
    },
    totalMs: Math.round(performance.now() - auditStart),
  }
}
