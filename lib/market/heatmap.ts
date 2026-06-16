import "server-only"

import {
  CRYPTO_HEATMAP_SIZE,
  getUsHeatmapApiSymbols,
  US_HEATMAP_SEEDS,
} from "@/config/heatmap-symbols"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import { getMockHeatmapAssets } from "@/lib/mockHeatmapData"
import { overlayHeatmapQuotes } from "@/lib/market/normalize"
import { CACHE_KEYS, CACHE_TTL, cachedProvider } from "@/lib/providers/cache"
import { getData as getCryptoData, getMockData as getCryptoMock } from "@/lib/providers/crypto-provider"
import { getData as getVietnamData, getMockData as getVietnamMock } from "@/lib/providers/vietnam-market-provider"
import { getStockQuotes } from "@/lib/twelvedata/client"
import type { HeatmapAsset, MarketType } from "@/types/market"

const HEATMAP_CACHE_TTL_MS = CACHE_TTL.heatmap
const US_LIVE_MIN_PRICES = 5
const VN_HEATMAP_SIZE = 100

const CACHE_BY_MARKET: Record<MarketType, string> = {
  vn: CACHE_KEYS.heatmapVietnam,
  us: CACHE_KEYS.heatmapUs,
  crypto: CACHE_KEYS.heatmapCrypto,
}

function seedsToRows(
  seeds: Array<{
    symbol: string
    name: string
    sector: string
    marketCap: number
  }>,
): HeatmapAsset[] {
  return seeds.map((seed) => ({
    symbol: seed.symbol,
    name: seed.name,
    price: 0,
    changePercent: 0,
    volume: 0,
    sector: seed.sector,
    marketCap: seed.marketCap,
  }))
}

function mockAssetsToRows(market: "us" | "crypto"): HeatmapAsset[] {
  return getMockHeatmapAssets(market).map((asset) => ({
    symbol: asset.symbol,
    name: asset.name.en,
    price: asset.price,
    changePercent: asset.changePercent,
    volume: asset.volume,
    sector: asset.sector,
    marketCap: asset.marketCap,
  }))
}

function vnTilesToRows(
  heatmapMarket: Awaited<ReturnType<typeof getVietnamData>>["heatmapMarket"],
): HeatmapAsset[] {
  const tiles = heatmapMarket.exchanges?.flatMap((ex) => ex.tiles) ?? heatmapMarket.tiles ?? []
  return tiles.map((tile) => ({
    symbol: tile.symbol,
    name: tile.name.en,
    price: tile.price ?? 0,
    changePercent: tile.changePercent,
    volume: 0,
    sector: "Equity",
    marketCap: 0,
  }))
}

function sortByMarketCap(items: HeatmapAsset[]): HeatmapAsset[] {
  return [...items].sort((a, b) => b.marketCap - a.marketCap)
}

async function fetchVietnamRows(): Promise<{ items: HeatmapAsset[]; source: "live" | "mock" }> {
  const mock = getVietnamMock()
  const baseItems = sortByMarketCap(vnTilesToRows(mock.heatmapMarket)).slice(0, VN_HEATMAP_SIZE)

  try {
    const data = await getVietnamData()
    const liveItems = sortByMarketCap(vnTilesToRows(data.heatmapMarket))
    const liveBySymbol = new Map(liveItems.map((row) => [row.symbol.toUpperCase(), row]))

    const items = baseItems.map((row) => {
      const live = liveBySymbol.get(row.symbol.toUpperCase())
      if (!live || live.price <= 0) return row
      return {
        ...row,
        price: live.price,
        changePercent: live.changePercent,
        marketCap: row.marketCap || live.marketCap,
      }
    })

    const livePriceCount = items.filter((row) => row.price > 0).length
    const source =
      data.source === "live" && livePriceCount >= US_LIVE_MIN_PRICES ? "live" : "mock"
    return { items, source }
  } catch {
    return { items: baseItems, source: "mock" }
  }
}

async function fetchUsRows(): Promise<{ items: HeatmapAsset[]; source: "live" | "mock" }> {
  const seedRows = seedsToRows(US_HEATMAP_SEEDS)
  let items = sortByMarketCap(seedRows)

  try {
    const liveQuotes = await getStockQuotes(getUsHeatmapApiSymbols())
    if (liveQuotes.length > 0) {
      items = sortByMarketCap(overlayHeatmapQuotes(seedRows, liveQuotes))
    }
    const livePriceCount = items.filter((row) => row.price > 0).length
    return {
      items,
      source: livePriceCount >= US_LIVE_MIN_PRICES ? "live" : "mock",
    }
  } catch {
    return { items, source: "mock" }
  }
}

async function fetchCryptoRows(): Promise<{ items: HeatmapAsset[]; source: "live" | "mock" }> {
  try {
    const data = await getCryptoData()
    if (data.assets.length >= 10) {
      const items = data.assets.slice(0, CRYPTO_HEATMAP_SIZE).map((asset) => ({
        symbol: asset.symbol,
        name: asset.name,
        price: asset.price,
        changePercent: asset.change24h,
        volume: asset.volume24h,
        sector: "Crypto",
        marketCap: asset.marketCap,
      }))
      return { items: sortByMarketCap(items), source: data.source }
    }
  } catch {
    /* fall through */
  }

  try {
    const mock = getCryptoMock()
    const items = mock.assets.slice(0, CRYPTO_HEATMAP_SIZE).map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      price: asset.price,
      changePercent: asset.change24h,
      volume: asset.volume24h,
      sector: "Crypto",
      marketCap: asset.marketCap,
    }))
    return { items: sortByMarketCap(items), source: "mock" }
  } catch {
    return { items: sortByMarketCap(mockAssetsToRows("crypto")), source: "mock" }
  }
}

export async function fetchHeatmapMarket(
  market: MarketType,
): Promise<{ items: HeatmapAsset[]; source: "live" | "mock"; unavailable: boolean }> {
  try {
    if (market === "vn") {
      const result = await fetchVietnamRows()
      return { ...result, unavailable: result.items.length === 0 }
    }
    if (market === "us") {
      const result = await fetchUsRows()
      return { ...result, unavailable: result.items.length === 0 }
    }
    const result = await fetchCryptoRows()
    return { ...result, unavailable: result.items.length === 0 }
  } catch {
    return { items: [], source: "mock", unavailable: true }
  }
}

const MARKET_ALIASES: Record<string, MarketType> = {
  vn: "vn",
  vietnam: "vn",
  us: "us",
  crypto: "crypto",
}

export function resolveHeatmapMarketParam(raw: string): MarketType | null {
  return MARKET_ALIASES[raw.trim().toLowerCase()] ?? null
}

export async function serveHeatmapMarket(market: MarketType) {
  try {
    const cacheKey = CACHE_BY_MARKET[market]
    const cached = await cachedProvider(
      cacheKey,
      async () => {
        const data = await fetchHeatmapMarket(market)
        return { data, source: data.source === "live" ? ("live" as const) : ("mock" as const) }
      },
      { ttlMs: HEATMAP_CACHE_TTL_MS },
    )

    const payload = cached?.data ?? (await fetchHeatmapMarket(market))

    return Response.json(
      toApiJson({
        source: payload.source,
        items: payload.items,
        unavailable: payload.unavailable,
      }),
    )
  } catch {
    return Response.json(
      toApiJsonFromMock({
        source: "mock",
        items: [],
        unavailable: true,
      }),
    )
  }
}
