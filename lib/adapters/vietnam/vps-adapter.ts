import "server-only"

import {
  HOSE_SEEDS,
  HNX_SEEDS,
  UPCOM_SEEDS,
} from "@/lib/vietnam-heatmap-seeds"
import {
  computeVnChangePercent,
  resolveVnChangePercent,
  signVnChangeAmount,
  vpsPriceToVnd,
} from "@/lib/vietnam/vn-change-sign"
import type {
  AdapterFetchResult,
  NormalizedVietnamMarket,
  NormalizedVietnamStock,
  VietnamMarketAdapter,
} from "./types"
import { vpsLotToShares, vpsTradingValue } from "@/lib/vietnam/volume-units"

import { groupStocksByExchange } from "./normalize"

const VPS_BASE = "https://bgapidatafeed.vps.com.vn"
const VPS_BATCH_SIZE = 40

type VpsQuoteRow = {
  sym?: string
  lastPrice?: number
  closePrice?: string
  changePc?: string
  r?: number
  lot?: number
  fBVol?: number
  fSVolume?: number
  avePrice?: string
}

export const VPS_ADAPTER_META = {
  id: "vps" as const,
  name: "VPS Datafeed",
  capabilities: ["stocks", "heatmap", "intraday"] as const,
  baseUrl: VPS_BASE,
  requiresAuth: false,
  notes: "Public bgapidatafeed endpoint — batch quotes, no API key.",
}

export function isVpsConfigured(): boolean {
  return process.env.VPS_ADAPTER_ENABLED !== "false"
}

/** Current traded price — prefer lastPrice (not closePrice, which is reference close in VND). */
function parseVpsCurrentPrice(row: VpsQuoteRow): number | null {
  const fromLast = vpsPriceToVnd(row.lastPrice)
  if (fromLast != null) return fromLast
  return vpsPriceToVnd(row.closePrice)
}

/** Reference / prior close — VPS field `r` (thousands) or closePrice (VND). */
function parseVpsReferencePrice(row: VpsQuoteRow): number | null {
  const fromR = vpsPriceToVnd(row.r)
  if (fromR != null) return fromR
  return vpsPriceToVnd(row.closePrice)
}

function seedLookup() {
  const all = [...HOSE_SEEDS, ...HNX_SEEDS, ...UPCOM_SEEDS]
  return new Map(all.map((seed) => [seed.symbol.toUpperCase(), seed]))
}

function normalizeVpsRow(row: VpsQuoteRow, seeds: ReturnType<typeof seedLookup>): NormalizedVietnamStock | null {
  const symbol = row.sym?.trim().toUpperCase()
  if (!symbol) return null

  const price = parseVpsCurrentPrice(row)
  if (price == null) return null

  const referencePrice = parseVpsReferencePrice(row)
  const rawChangePc = Number(row.changePc ?? NaN)
  const seed = seeds.get(symbol)
  const unsignedChangePercent = Number.isFinite(rawChangePc)
    ? rawChangePc
    : seed?.changePercent != null
      ? Math.abs(seed.changePercent)
      : 0

  const changePercent =
    referencePrice != null
      ? computeVnChangePercent(price, referencePrice)
      : resolveVnChangePercent(price, { rawChangePercent: unsignedChangePercent })

  const change = signVnChangeAmount(price, changePercent)
  const volume = row.lot ?? seed?.volume ?? 0
  const foreignBuyLots = row.fBVol ?? 0
  const foreignSellLots = row.fSVolume ?? 0

  return {
    symbol,
    name: seed?.name ?? { vi: symbol, en: symbol },
    exchange: seed
      ? HOSE_SEEDS.some((s) => s.symbol === symbol)
        ? "hose"
        : HNX_SEEDS.some((s) => s.symbol === symbol)
          ? "hnx"
          : "upcom"
      : "hose",
    sector: seed?.sector ?? "Equity",
    price,
    referencePrice: referencePrice ?? undefined,
    change,
    changePercent,
    marketCap: seed?.marketCap ?? 0,
    volume,
    value: vpsTradingValue(price, volume),
    foreignBuyVolume: foreignBuyLots > 0 ? vpsLotToShares(foreignBuyLots) : undefined,
    foreignSellVolume: foreignSellLots > 0 ? vpsLotToShares(foreignSellLots) : undefined,
    updatedAt: new Date().toISOString(),
  }
}

async function fetchVpsBatch(symbols: string[]): Promise<VpsQuoteRow[]> {
  const joined = symbols.join(",")
  const url = `${VPS_BASE}/getliststockdata/${encodeURIComponent(joined)}`

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "MarketWall/1.0" },
      cache: "no-store",
    })
    if (!res.ok) {
      console.warn(`[provider:vietnam:vps] http=${res.status} batch=${symbols.length}`)
      return []
    }
    const json = (await res.json()) as VpsQuoteRow[]
    return Array.isArray(json) ? json : []
  } catch (error) {
    const message = error instanceof Error ? error.message : "vps fetch failed"
    console.warn(`[provider:vietnam:vps] error=${message}`)
    return []
  }
}

export const vpsAdapter: VietnamMarketAdapter = {
  meta: {
    ...VPS_ADAPTER_META,
    capabilities: [...VPS_ADAPTER_META.capabilities],
  },

  isConfigured() {
    return isVpsConfigured()
  },

  async fetchMarketSnapshot(): Promise<AdapterFetchResult<NormalizedVietnamMarket>> {
    if (!isVpsConfigured()) {
      return {
        status: "not_configured",
        provider: "vps",
        reason: "VPS_ADAPTER_ENABLED is false",
      }
    }

    const seeds = seedLookup()
    const symbols = [...seeds.keys()]
    const stocks: NormalizedVietnamStock[] = []

    for (let i = 0; i < symbols.length; i += VPS_BATCH_SIZE) {
      const batch = symbols.slice(i, i + VPS_BATCH_SIZE)
      const rows = await fetchVpsBatch(batch)
      for (const row of rows) {
        const normalized = normalizeVpsRow(row, seeds)
        if (normalized) stocks.push(normalized)
      }
    }

    if (!stocks.length) {
      return { status: "error", provider: "vps", message: "VPS returned no stock quotes" }
    }

    const grouped = groupStocksByExchange(stocks)
    const data: NormalizedVietnamMarket = {
      provider: "vps",
      indices: [],
      stocks: grouped,
      fetchedAt: new Date().toISOString(),
    }

    console.log(
      `[provider:vietnam:vps] stocks=${stocks.length} hose=${grouped.hose.length} hnx=${grouped.hnx.length} upcom=${grouped.upcom.length}`,
    )

    return { status: "ok", provider: "vps", data, fetchedAt: data.fetchedAt }
  },
}
