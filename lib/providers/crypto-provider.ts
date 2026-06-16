import "server-only"

import { type Bi, type Trend, toTrend, spark } from "@/lib/market-utils"
import type { HeatmapTile } from "@/lib/providers/heatmap-provider"
import { CACHE_KEYS, CACHE_TTL } from "@/lib/providers/cache"
import { safeFetchJson } from "@/lib/providers/fetch-utils"
import { withFallback, type ProviderResult } from "@/lib/providers/fallback"
import { heatmapMarketToMarketHeatmap } from "@/lib/providers/mappers"
import type { MarketHeatmap } from "@/lib/providers/types"

export type CryptoAsset = {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  marketCapRank: number
}

/** @deprecated Use CryptoAsset — kept for dashboard overlay helpers */
export type CryptoQuote = {
  id: string
  symbol: string
  price: number
  changePercent: number
  trend: Trend
}

export type CryptoData = {
  assets: CryptoAsset[]
  quotes: CryptoQuote[]
  heatmapTiles: HeatmapTile[]
  source: "live" | "mock"
}

const HEATMAP_SIZE = 50

const TICKER_IDS = ["bitcoin", "ethereum", "binancecoin", "solana", "ripple"] as const

const TICKER_SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTC/USD",
  ethereum: "ETH/USD",
  binancecoin: "BNB/USD",
  solana: "SOL/USD",
  ripple: "XRP/USD",
}

const TOP_TILE_WEIGHTS: Record<string, number> = {
  BTC: 14,
  ETH: 11,
  BNB: 10,
  SOL: 7,
  XRP: 6,
}

type CoinGeckoMarketRow = {
  id?: string
  symbol?: string
  name?: string
  current_price?: number
  price_change_percentage_24h?: number
  market_cap?: number
  total_volume?: number
  market_cap_rank?: number
}

type MockCoinDef = [
  id: string,
  symbol: string,
  name: string,
  rank: number,
  price: number,
  change24h: number,
  marketCap: number,
  volume24h: number,
]

const MOCK_COIN_DEFS: MockCoinDef[] = [
  ["bitcoin", "BTC", "Bitcoin", 1, 68240, 2.12, 1_340_000_000_000, 28_500_000_000],
  ["ethereum", "ETH", "Ethereum", 2, 3548, -1.17, 426_000_000_000, 14_200_000_000],
  ["tether", "USDT", "Tether", 3, 1.0, 0.01, 118_000_000_000, 62_000_000_000],
  ["binancecoin", "BNB", "BNB", 4, 612.4, 0.84, 94_000_000_000, 1_800_000_000],
  ["solana", "SOL", "Solana", 5, 148.6, 4.62, 68_000_000_000, 3_400_000_000],
  ["ripple", "XRP", "XRP", 6, 0.62, -0.74, 34_000_000_000, 1_200_000_000],
  ["usd-coin", "USDC", "USDC", 7, 1.0, 0.0, 32_000_000_000, 5_500_000_000],
  ["cardano", "ADA", "Cardano", 8, 0.58, 1.28, 20_500_000_000, 420_000_000],
  ["dogecoin", "DOGE", "Dogecoin", 9, 0.158, -2.05, 22_800_000_000, 980_000_000],
  ["tron", "TRX", "TRON", 10, 0.12, 0.65, 10_500_000_000, 310_000_000],
  ["chainlink", "LINK", "Chainlink", 11, 14.2, 0.46, 8_400_000_000, 380_000_000],
  ["avalanche-2", "AVAX", "Avalanche", 12, 36.2, 3.11, 14_200_000_000, 520_000_000],
  ["shiba-inu", "SHIB", "Shiba Inu", 13, 0.000024, -1.42, 14_100_000_000, 290_000_000],
  ["polkadot", "DOT", "Polkadot", 14, 6.18, -1.62, 8_900_000_000, 210_000_000],
  ["bitcoin-cash", "BCH", "Bitcoin Cash", 15, 432.5, 0.88, 8_500_000_000, 280_000_000],
  ["near", "NEAR", "NEAR Protocol", 16, 5.42, 2.15, 5_800_000_000, 190_000_000],
  ["litecoin", "LTC", "Litecoin", 17, 84.2, 0.86, 6_300_000_000, 340_000_000],
  ["uniswap", "UNI", "Uniswap", 18, 7.85, -0.42, 4_700_000_000, 160_000_000],
  ["internet-computer", "ICP", "Internet Computer", 19, 12.4, 1.05, 5_600_000_000, 95_000_000],
  ["ethereum-classic", "ETC", "Ethereum Classic", 20, 26.8, -0.55, 3_900_000_000, 120_000_000],
  ["render-token", "RNDR", "Render", 21, 7.2, 3.8, 3_700_000_000, 180_000_000],
  ["hedera-hashgraph", "HBAR", "Hedera", 22, 0.078, 1.12, 2_800_000_000, 85_000_000],
  ["cosmos", "ATOM", "Cosmos Hub", 23, 8.45, -0.28, 3_300_000_000, 110_000_000],
  ["filecoin", "FIL", "Filecoin", 24, 5.62, 0.72, 3_100_000_000, 140_000_000],
  ["stellar", "XLM", "Stellar", 25, 0.11, 0.35, 3_200_000_000, 75_000_000],
  ["monero", "XMR", "Monero", 26, 165.0, -0.18, 3_000_000_000, 62_000_000],
  ["okb", "OKB", "OKB", 27, 48.5, 1.45, 2_900_000_000, 48_000_000],
  ["arbitrum", "ARB", "Arbitrum", 28, 0.82, 2.05, 2_700_000_000, 210_000_000],
  ["maker", "MKR", "Maker", 29, 1580, -0.92, 1_450_000_000, 55_000_000],
  ["vechain", "VET", "VeChain", 30, 0.028, 0.58, 2_100_000_000, 42_000_000],
  ["optimism", "OP", "Optimism", 31, 1.85, 1.88, 1_980_000_000, 95_000_000],
  ["injective-protocol", "INJ", "Injective", 32, 24.5, 4.2, 2_350_000_000, 120_000_000],
  ["the-graph", "GRT", "The Graph", 33, 0.18, -1.05, 1_720_000_000, 38_000_000],
  ["immutable-x", "IMX", "Immutable", 34, 1.42, 2.65, 2_050_000_000, 44_000_000],
  ["aave", "AAVE", "Aave", 35, 92.5, 0.55, 1_380_000_000, 180_000_000],
  ["algorand", "ALGO", "Algorand", 36, 0.15, -0.38, 1_250_000_000, 28_000_000],
  ["fantom", "FTM", "Fantom", 37, 0.62, 1.95, 1_750_000_000, 52_000_000],
  ["theta-token", "THETA", "Theta Network", 38, 1.95, -0.65, 1_950_000_000, 35_000_000],
  ["flow", "FLOW", "Flow", 39, 0.72, 0.42, 1_120_000_000, 22_000_000],
  ["quant-network", "QNT", "Quant", 40, 98.0, 0.18, 1_420_000_000, 18_000_000],
  ["the-sandbox", "SAND", "The Sandbox", 41, 0.38, -1.25, 820_000_000, 45_000_000],
  ["decentraland", "MANA", "Decentraland", 42, 0.35, -0.88, 680_000_000, 32_000_000],
  ["axie-infinity", "AXS", "Axie Infinity", 43, 6.2, 1.35, 920_000_000, 28_000_000],
  ["eos", "EOS", "EOS", 44, 0.72, -0.45, 780_000_000, 24_000_000],
  ["tezos", "XTZ", "Tezos", 45, 0.88, 0.62, 850_000_000, 19_000_000],
  ["neo", "NEO", "NEO", 46, 12.5, 1.08, 880_000_000, 42_000_000],
  ["kucoin-shares", "KCS", "KuCoin", 47, 8.2, 0.25, 980_000_000, 12_000_000],
  ["iota", "IOTA", "IOTA", 48, 0.18, -0.32, 620_000_000, 15_000_000],
  ["zcash", "ZEC", "Zcash", 49, 28.5, 0.95, 460_000_000, 48_000_000],
  ["dash", "DASH", "Dash", 50, 28.0, -0.15, 520_000_000, 38_000_000],
]

function mockFromDefs(defs: MockCoinDef[]): CryptoAsset[] {
  return defs.map(([id, symbol, name, rank, price, change24h, marketCap, volume24h]) => ({
    id,
    symbol,
    name,
    price,
    change24h,
    marketCap,
    volume24h,
    marketCapRank: rank,
  }))
}

const MOCK_ASSETS = mockFromDefs(MOCK_COIN_DEFS)

function isCoingeckoEnabled(): boolean {
  return process.env.COINGECKO_ENABLED !== "false"
}

export function heatmapWeight(asset: CryptoAsset): number {
  const top = TOP_TILE_WEIGHTS[asset.symbol]
  if (top) return top
  if (asset.marketCapRank <= 10) return 5
  if (asset.marketCapRank <= 20) return 4
  if (asset.marketCapRank <= 35) return 3
  return 3
}

export function assetsToHeatmapTiles(assets: CryptoAsset[]): HeatmapTile[] {
  return assets.slice(0, HEATMAP_SIZE).map((asset) => ({
    symbol: asset.symbol,
    name: { vi: asset.name, en: asset.name },
    changePercent: Number(asset.change24h.toFixed(2)),
    weight: heatmapWeight(asset),
    price: asset.price,
  }))
}

export function assetsToQuotes(assets: CryptoAsset[]): CryptoQuote[] {
  return assets
    .filter((asset) => TICKER_IDS.includes(asset.id as (typeof TICKER_IDS)[number]))
    .map((asset) => {
      const changePercent = Number(asset.change24h.toFixed(2))
      return {
        id: asset.id,
        symbol: TICKER_SYMBOL_MAP[asset.id] ?? `${asset.symbol}/USD`,
        price: asset.price,
        changePercent,
        trend: toTrend(changePercent),
      }
    })
}

function buildCryptoData(assets: CryptoAsset[], source: "live" | "mock"): CryptoData {
  return {
    assets,
    quotes: assetsToQuotes(assets),
    heatmapTiles: assetsToHeatmapTiles(assets),
    source,
  }
}

export function getMockData(): CryptoData {
  return buildCryptoData(MOCK_ASSETS, "mock")
}

function mapMarketRow(row: CoinGeckoMarketRow, fallbackRank: number): CryptoAsset | null {
  if (!row.id || row.current_price == null) return null

  return {
    id: row.id,
    symbol: (row.symbol ?? row.id).toUpperCase(),
    name: row.name ?? row.id,
    price: row.current_price,
    change24h: Number((row.price_change_percentage_24h ?? 0).toFixed(2)),
    marketCap: row.market_cap ?? 0,
    volume24h: row.total_volume ?? 0,
    marketCapRank: row.market_cap_rank ?? fallbackRank,
  }
}

async function fetchCoinGeckoMarkets(): Promise<CryptoAsset[] | null> {
  if (!isCoingeckoEnabled()) return null

  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    "?vs_currency=usd&order=market_cap_desc&per_page=50&page=1" +
    "&sparkline=false&price_change_percentage=24h"

  const rows = await safeFetchJson<CoinGeckoMarketRow[]>(url, { cache: "no-store" })
  if (!rows?.length) return null

  const assets = rows
    .map((row, index) => mapMarketRow(row, index + 1))
    .filter((a): a is CryptoAsset => a != null)

  return assets.length >= 10 ? assets.slice(0, HEATMAP_SIZE) : null
}

export async function getData(): Promise<CryptoData> {
  const resolved = await withFallback(
    fetchCoinGeckoMarkets,
    () => MOCK_ASSETS,
    { provider: "coingecko", cacheKey: CACHE_KEYS.crypto, cacheTtlMs: CACHE_TTL.crypto },
  )

  const source = resolved.source === "mock" ? "mock" : "live"
  return buildCryptoData(resolved.data, source)
}

export async function getHeatmapData(): Promise<ProviderResult<MarketHeatmap>> {
  const crypto = await getData()
  const heatmap = heatmapMarketToMarketHeatmap(
    {
      id: "crypto",
      labelKey: "heatmap.crypto",
      flag: "₿",
      tiles: crypto.heatmapTiles,
    },
    crypto.source,
    new Date().toISOString(),
  )

  return {
    data: heatmap,
    source: crypto.source,
    fallback: crypto.source !== "live",
    provider: "coingecko",
    fetchedAt: new Date().toISOString(),
  }
}

/** @deprecated Sprint 14 — use Alternative.me via `lib/fear-greed/crypto.ts`. */
export function deriveCryptoFearGreed(assets: CryptoAsset[]): number {
  const btc = assets.find((a) => a.id === "bitcoin" || a.symbol === "BTC")
  const change = btc?.change24h ?? 0
  return Math.round(Math.min(100, Math.max(0, 50 + change * 4)))
}

export function cryptoSparkline(symbol: string, trend: Trend): number[] {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return spark(seed, 14, trend === "up" ? 1 : -1)
}
