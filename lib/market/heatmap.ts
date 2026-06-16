import "server-only"

import { CRYPTO_HEATMAP_SIZE, US_HEATMAP_SEEDS, US_HEATMAP_SIZE } from "@/config/heatmap-symbols"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import { getMockHeatmapAssets } from "@/lib/mockHeatmapData"
import { overlayHeatmapQuotes } from "@/lib/market/normalize"
import { CACHE_KEYS, CACHE_TTL, cachedProvider } from "@/lib/providers/cache"
import { getData as getCryptoData, getMockData as getCryptoMock } from "@/lib/providers/crypto-provider"
import { getData as getVietnamData, getMockData as getVietnamMock, type VietnamMarketData } from "@/lib/providers/vietnam-market-provider"
import { fetchYahooStockQuotes } from "@/lib/providers/yahoo-finance"
import type { HeatmapAsset, MarketType } from "@/types/market"

const HEATMAP_CACHE_TTL_MS = CACHE_TTL.heatmap
const US_LIVE_MIN_PRICES = 5
const US_HEATMAP_MIN_ITEMS = 50
const VN_HEATMAP_SIZE = 150
const VN_HEATMAP_MIN_ITEMS = 100

type HeatmapRowResult = {
  items: HeatmapAsset[]
  source: "live" | "mock"
  itemCount: number
  livePriceCount: number
  seedCount: number
}

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

function vnStocksToRows(data: VietnamMarketData): HeatmapAsset[] {
  const all = [...data.heatmapStocks.hose, ...data.heatmapStocks.hnx, ...data.heatmapStocks.upcom]
  return all.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name.en,
    price: stock.price,
    changePercent: stock.changePercent,
    volume: stock.volume,
    sector: stock.sector,
    marketCap: stock.marketCap,
  }))
}

function sortByMarketCap(items: HeatmapAsset[]): HeatmapAsset[] {
  return [...items].sort((a, b) => b.marketCap - a.marketCap)
}

function countLivePrices(items: HeatmapAsset[]): number {
  return items.filter((row) => row.price > 0).length
}

/** Pad rows from seed universe when live overlay returns fewer than minimum tiles. */
function ensureMinHeatmapRows(
  items: HeatmapAsset[],
  seedRows: HeatmapAsset[],
  minItems: number,
): HeatmapAsset[] {
  if (items.length >= minItems) return items

  const existing = new Set(items.map((row) => row.symbol.toUpperCase()))
  const padded = [...items]

  for (const seed of seedRows) {
    if (padded.length >= minItems) break
    const key = seed.symbol.toUpperCase()
    if (existing.has(key)) continue
    padded.push(seed)
    existing.add(key)
  }

  return sortByMarketCap(padded)
}

function buildHeatmapRowResult(
  items: HeatmapAsset[],
  source: "live" | "mock",
  seedCount: number,
): HeatmapRowResult {
  return {
    items,
    source,
    itemCount: items.length,
    livePriceCount: countLivePrices(items),
    seedCount,
  }
}

async function fetchVietnamRows(): Promise<HeatmapRowResult> {
  const mock = getVietnamMock()
  const seedCount = VN_HEATMAP_SIZE
  const baseItems = sortByMarketCap(vnStocksToRows(mock)).slice(0, VN_HEATMAP_SIZE)

  try {
    const data = await getVietnamData()
    const liveItems = sortByMarketCap(vnStocksToRows(data))
    const liveBySymbol = new Map(liveItems.map((row) => [row.symbol.toUpperCase(), row]))

    let items = baseItems.map((row) => {
      const live = liveBySymbol.get(row.symbol.toUpperCase())
      if (!live || live.price <= 0) return row
      return {
        ...row,
        price: live.price,
        changePercent: live.changePercent,
        volume: live.volume || row.volume,
        sector: live.sector || row.sector,
        marketCap: row.marketCap || live.marketCap,
      }
    })

    for (const live of liveItems) {
      if (items.length >= seedCount) break
      if (items.some((row) => row.symbol.toUpperCase() === live.symbol.toUpperCase())) continue
      items.push(live)
    }

    if (items.length < VN_HEATMAP_MIN_ITEMS) {
      items = ensureMinHeatmapRows(items, baseItems, VN_HEATMAP_MIN_ITEMS)
    }

    items = sortByMarketCap(items).slice(0, seedCount)

    const livePriceCount = countLivePrices(items)
    const source =
      data.source === "live" && livePriceCount >= US_LIVE_MIN_PRICES ? "live" : "mock"
    const sourceReason =
      data.source !== "live"
        ? "vietnam_provider_mock"
        : livePriceCount < US_LIVE_MIN_PRICES
          ? "live_prices_below_threshold"
          : "live"
    console.log(
      `[heatmap:vn] items=${items.length} livePrices=${livePriceCount} upstream=${data.source} source=${source} reason=${sourceReason}`,
    )
    return buildHeatmapRowResult(items, source, seedCount)
  } catch {
    console.log(`[heatmap:vn] items=${baseItems.length} livePrices=${countLivePrices(baseItems)}`)
    return buildHeatmapRowResult(baseItems, "mock", seedCount)
  }
}

async function fetchUsRows(): Promise<HeatmapRowResult> {
  const seedRows = seedsToRows(US_HEATMAP_SEEDS)
  const seedCount = US_HEATMAP_SIZE
  let items = sortByMarketCap(seedRows)

  try {
    const liveQuotes = await fetchYahooStockQuotes(
      US_HEATMAP_SEEDS.map((seed) => ({
        symbol: seed.symbol,
        apiSymbol: seed.apiSymbol,
        name: seed.name,
      })),
    )
    if (liveQuotes.length > 0) {
      items = sortByMarketCap(overlayHeatmapQuotes(seedRows, liveQuotes))
    }
  } catch {
    /* keep full seed universe */
  }

  if (items.length < US_HEATMAP_MIN_ITEMS) {
    items = ensureMinHeatmapRows(items, seedRows, US_HEATMAP_MIN_ITEMS)
  }

  const livePriceCount = countLivePrices(items)
  const source = livePriceCount >= US_LIVE_MIN_PRICES ? "live" : "mock"
  const sourceReason =
    livePriceCount === 0 ? "yahoo_zero_live_prices" : "live_prices_below_threshold"
  console.log(
    `[heatmap:us] items=${items.length} livePrices=${livePriceCount} source=${source} reason=${sourceReason}`,
  )

  return buildHeatmapRowResult(items, source, seedCount)
}

async function fetchCryptoRows(): Promise<HeatmapRowResult> {
  const seedCount = CRYPTO_HEATMAP_SIZE
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
      const sorted = sortByMarketCap(items)
      return buildHeatmapRowResult(sorted, data.source, seedCount)
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
    return buildHeatmapRowResult(sortByMarketCap(items), "mock", seedCount)
  } catch {
    return buildHeatmapRowResult(sortByMarketCap(mockAssetsToRows("crypto")), "mock", seedCount)
  }
}

export async function fetchHeatmapMarket(
  market: MarketType,
): Promise<HeatmapRowResult & { unavailable: boolean }> {
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
    return {
      items: [],
      source: "mock",
      itemCount: 0,
      livePriceCount: 0,
      seedCount: 0,
      unavailable: true,
    }
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
        itemCount: payload.itemCount,
        livePriceCount: payload.livePriceCount,
        seedCount: payload.seedCount,
      }),
    )
  } catch {
    return Response.json(
      toApiJsonFromMock({
        source: "mock",
        items: [],
        unavailable: true,
        itemCount: 0,
        livePriceCount: 0,
        seedCount: 0,
      }),
    )
  }
}
