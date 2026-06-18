import "server-only"

import { CRYPTO_HEATMAP_SIZE, US_HEATMAP_SEEDS, US_HEATMAP_SIZE, VN_HEATMAP_LIMIT } from "@/config/heatmap-symbols"
import { cryptoCategory } from "@/lib/market/crypto-categories"
import { usBroadSector } from "@/lib/market/us-sector-groups"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import { VPS_VOLUME_UNIT } from "@/lib/vietnam/volume-units"
import { vnHeatmapStockToAsset } from "@/lib/vietnam/vn-dashboard-from-vps"
import { getMockHeatmapAssets } from "@/lib/mockHeatmapData"
import { overlayHeatmapQuotes } from "@/lib/market/normalize"
import { limitHeatmapRows, sortHeatmapRows } from "@/lib/market/heatmap-limits"
import { CACHE_KEYS, CACHE_TTL, cachedProvider } from "@/lib/providers/cache"
import { getData as getCryptoData, getMockData as getCryptoMock } from "@/lib/providers/crypto-provider"
import {
  applyProprietaryOverlay,
  loadProprietaryHeatmapOverlay,
  type ProprietaryHeatmapStatus,
} from "@/lib/proprietary/heatmap-overlay"
import { getData as getVietnamData, getMockData as getVietnamMock, type VietnamMarketData } from "@/lib/providers/vietnam-market-provider"
import { fetchYahooStockQuotes } from "@/lib/providers/yahoo-finance"
import type { HeatmapAsset, MarketType } from "@/types/market"

const HEATMAP_CACHE_TTL_MS = CACHE_TTL.heatmap
const US_LIVE_MIN_PRICES = 5
const US_HEATMAP_MIN_ITEMS = US_HEATMAP_SIZE
const VN_HEATMAP_SIZE = VN_HEATMAP_LIMIT
const VN_HEATMAP_MIN_ITEMS = Math.min(100, VN_HEATMAP_LIMIT)

type HeatmapRowResult = {
  items: HeatmapAsset[]
  source: "live" | "mock"
  itemCount: number
  livePriceCount: number
  seedCount: number
  proprietaryStatus?: ProprietaryHeatmapStatus
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
  market: "us" | "vn" = "us",
): HeatmapAsset[] {
  return seeds.map((seed) => {
    const industry = market === "us" ? seed.sector : undefined
    const sector =
      market === "us" ? usBroadSector(seed.sector) : seed.sector
    return {
      symbol: seed.symbol,
      name: seed.name,
      price: 0,
      changePercent: 0,
      volume: 0,
      sector,
      industry,
      marketCap: seed.marketCap,
    }
  })
}

function mockAssetsToRows(market: "us" | "crypto"): HeatmapAsset[] {
  return getMockHeatmapAssets(market).map((asset) => ({
    symbol: asset.symbol,
    name: asset.name.en,
    price: asset.price,
    changePercent: asset.changePercent,
    volume: asset.volume,
    sector: market === "us" ? usBroadSector(asset.sector) : cryptoCategory(asset.symbol),
    industry: market === "us" ? asset.sector : undefined,
    marketCap: asset.marketCap,
  }))
}

function vnStocksToRows(data: VietnamMarketData): HeatmapAsset[] {
  const all = [...data.heatmapStocks.hose, ...data.heatmapStocks.hnx, ...data.heatmapStocks.upcom]
  return all.map((stock) => vnHeatmapStockToAsset(stock))
}

function sortByMarketCap(items: HeatmapAsset[]): HeatmapAsset[] {
  return [...items].sort((a, b) => b.marketCap - a.marketCap)
}

function finalizeHeatmapRows(items: HeatmapAsset[], market: MarketType): HeatmapAsset[] {
  return limitHeatmapRows(items, market)
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
  proprietaryStatus?: ProprietaryHeatmapStatus,
): HeatmapRowResult {
  return {
    items,
    source,
    itemCount: items.length,
    livePriceCount: countLivePrices(items),
    seedCount,
    proprietaryStatus,
  }
}

async function fetchVietnamRows(): Promise<HeatmapRowResult> {
  const mock = getVietnamMock()
  const seedCount = VN_HEATMAP_SIZE
  const baseItems = sortHeatmapRows(vnStocksToRows(mock), "vn").slice(0, VN_HEATMAP_SIZE)

  try {
    const data = await getVietnamData()
    const liveItems = sortHeatmapRows(vnStocksToRows(data), "vn")
    const liveBySymbol = new Map(liveItems.map((row) => [row.symbol.toUpperCase(), row]))

    let items = baseItems.map((row) => {
      const live = liveBySymbol.get(row.symbol.toUpperCase())
      if (!live || live.price <= 0) return row
      return {
        ...row,
        price: live.price,
        referencePrice: live.referencePrice ?? row.referencePrice,
        changePercent: live.changePercent,
        volume: live.volume || row.volume,
        volumeLot: live.volumeLot ?? live.volume ?? row.volumeLot,
        volumeShares: live.volumeShares ?? row.volumeShares,
        tradingValue: live.tradingValue ?? row.tradingValue,
        volumeUnit: live.volumeUnit ?? row.volumeUnit,
        sector: live.sector || row.sector,
        marketCap: row.marketCap || live.marketCap,
        foreignBuy: live.foreignBuy ?? row.foreignBuy,
        foreignSell: live.foreignSell ?? row.foreignSell,
        foreignNet: live.foreignNet ?? row.foreignNet,
        foreignBuyValue: live.foreignBuyValue ?? row.foreignBuyValue,
        foreignSellValue: live.foreignSellValue ?? row.foreignSellValue,
        foreignNetValue: live.foreignNetValue ?? row.foreignNetValue,
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

    items = finalizeHeatmapRows(items, "vn")

    const proprietaryLoad = await loadProprietaryHeatmapOverlay()
    const useProprietaryOverlay =
      proprietaryLoad.status.proprietarySource === "cafef-eod" &&
      !proprietaryLoad.status.isStale &&
      proprietaryLoad.overlay.size > 0
    if (useProprietaryOverlay) {
      items = items.map((row) => applyProprietaryOverlay(row, proprietaryLoad.overlay))
    }

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
      `[heatmap:vn] items=${items.length} livePrices=${livePriceCount} upstream=${data.source} source=${source} reason=${sourceReason} proprietary=${proprietaryLoad.status.proprietarySource} stale=${proprietaryLoad.status.isStale}`,
    )
    return buildHeatmapRowResult(items, source, seedCount, proprietaryLoad.status)
  } catch {
    console.log(`[heatmap:vn] items=${baseItems.length} livePrices=${countLivePrices(baseItems)}`)
    return buildHeatmapRowResult(baseItems, "mock", seedCount)
  }
}

async function fetchUsRows(): Promise<HeatmapRowResult> {
  const seedRows = seedsToRows(US_HEATMAP_SEEDS, "us")
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
      items = overlayHeatmapQuotes(seedRows, liveQuotes)
    }
  } catch {
    /* keep full seed universe */
  }

  if (items.length < US_HEATMAP_MIN_ITEMS) {
    items = ensureMinHeatmapRows(items, seedRows, US_HEATMAP_MIN_ITEMS)
  }

  items = finalizeHeatmapRows(items, "us")

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
      const items = data.assets.map((asset) => ({
        symbol: asset.symbol,
        name: asset.name,
        price: asset.price,
        changePercent: asset.change24h,
        volume: asset.volume24h,
        sector: cryptoCategory(asset.symbol),
        marketCap: asset.marketCap,
      }))
      return buildHeatmapRowResult(finalizeHeatmapRows(items, "crypto"), data.source, seedCount)
    }
  } catch {
    /* fall through */
  }

  try {
    const mock = getCryptoMock()
    const items = mock.assets.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      price: asset.price,
      changePercent: asset.change24h,
      volume: asset.volume24h,
      sector: cryptoCategory(asset.symbol),
      marketCap: asset.marketCap,
    }))
    return buildHeatmapRowResult(finalizeHeatmapRows(items, "crypto"), "mock", seedCount)
  } catch {
    return buildHeatmapRowResult(
      finalizeHeatmapRows(mockAssetsToRows("crypto"), "crypto"),
      "mock",
      seedCount,
    )
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
        volumeUnit: market === "vn" ? VPS_VOLUME_UNIT : undefined,
        unavailable: payload.unavailable,
        itemCount: payload.itemCount,
        livePriceCount: payload.livePriceCount,
        seedCount: payload.seedCount,
        ...(market === "vn" && payload.proprietaryStatus
          ? {
              proprietarySource: payload.proprietaryStatus.proprietarySource,
              lastUpdatedAt: payload.proprietaryStatus.lastUpdatedAt,
              coverageCount: payload.proprietaryStatus.coverageCount,
              proprietaryStale: payload.proprietaryStatus.isStale,
            }
          : {}),
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
