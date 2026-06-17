import "server-only"

import { type Bi, type Trend, toTrend, spark } from "@/lib/market-utils"
import { CACHE_KEYS } from "@/lib/providers/cache"
import { getData as getCryptoData, getMockData as getCryptoMock } from "@/lib/providers/crypto-provider"
import { withFallback, type ProviderResult } from "@/lib/providers/fallback"
import { getData as getGlobalData, getMockData as getGlobalMock } from "@/lib/providers/global-market-provider"
import {
  cryptoAssetToMarketIndex,
  globalQuoteToMarketIndex,
  vietnamIndexToMarketIndex,
} from "@/lib/providers/mappers"
import type { MarketIndex } from "@/lib/providers/types"
import { getData as getVietnamData, getMockData as getVietnamMock } from "@/lib/providers/vietnam-market-provider"

export type TickerBarItem = {
  symbol: string
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

export type MarketTicker = {
  symbol: string
  name: Bi
  price: number
  change: number
  changePercent: number
  trend: Trend
  group: "commodities" | "currencies" | "crypto" | "indices"
}

export type SidebarOverviewItem = {
  symbol: string
  flag: string
  market: Bi
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

export type OverviewCategory = "indices" | "commodities" | "crypto" | "forex"

export type OverviewListItem = {
  symbol: string
  flag: string
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

export type MarketAsset = {
  symbol: string
  name: Bi
  region: Bi
  price: number
  change: number
  changePercent: number
  trend: Trend
  seed: number
}

export type MarketData = {
  tickerBarItems: TickerBarItem[]
  dashboardTickerBarItems: TickerBarItem[]
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>
}

export type MarketIndicesData = {
  indices: MarketIndex[]
}

export function getMockIndices(): MarketIndex[] {
  const vietnam = getVietnamMock()
  const global = getGlobalMock()
  const crypto = getCryptoMock()

  return [
    ...vietnam.indices.map(vietnamIndexToMarketIndex),
    ...global.quotes.map(globalQuoteToMarketIndex),
    ...crypto.assets.slice(0, 20).map((asset) => cryptoAssetToMarketIndex(asset, "mock")),
  ]
}

export async function getIndicesData(): Promise<ProviderResult<MarketIndex[]>> {
  return withFallback(
    async () => {
      const [vietnam, global, crypto] = await Promise.all([
        getVietnamData(),
        getGlobalData(),
        getCryptoData(),
      ])

      const indices = [
        ...vietnam.indices.map(vietnamIndexToMarketIndex),
        ...global.quotes.map(globalQuoteToMarketIndex),
        ...crypto.assets.slice(0, 20).map((asset) => cryptoAssetToMarketIndex(asset, crypto.source)),
      ]

      return indices.length ? indices : null
    },
    getMockIndices,
    { provider: "market-indices", cacheKey: CACHE_KEYS.marketIndices },
  )
}

export type { MarketIndex }

function tickerItem(
  symbol: string,
  price: number,
  changePercent: number,
  seed: number,
): TickerBarItem {
  const trend = toTrend(changePercent)
  return {
    symbol,
    price,
    changePercent,
    trend,
    sparkline: spark(seed, 14, trend === "up" ? 1 : -1),
  }
}

function sidebarOverviewItem(
  symbol: string,
  flag: string,
  market: Bi,
  price: number,
  changePercent: number,
  seed: number,
): SidebarOverviewItem {
  const trend = toTrend(changePercent)
  return {
    symbol,
    flag,
    market,
    price,
    changePercent,
    trend,
    sparkline: spark(seed, 12, trend === "up" ? 1 : -1),
  }
}

function overviewItem(
  symbol: string,
  flag: string,
  price: number,
  changePercent: number,
  seed: number,
): OverviewListItem {
  const trend = toTrend(changePercent)
  return {
    symbol,
    flag,
    price,
    changePercent,
    trend,
    sparkline: spark(seed, 14, trend === "up" ? 1 : -1),
  }
}

export function getMockData(): MarketData {
  return {
    tickerBarItems: [
      tickerItem("VN-INDEX", 1281.4, 0.53, 1),
      tickerItem("VN30", 1302.7, 0.56, 2),
      tickerItem("S&P 500", 5431.6, 0.34, 3),
      tickerItem("NASDAQ", 17688.9, 0.54, 4),
      tickerItem("BTC/USD", 68240, 2.12, 5),
      tickerItem("GOLD", 2347.8, 0.53, 6),
    ],
    dashboardTickerBarItems: [
      tickerItem("VN-INDEX", 1281.4, 0.53, 1),
      tickerItem("VN30", 1302.7, 0.56, 2),
      tickerItem("VN100", 1184.2, 0.20, 3),
      tickerItem("HNX-INDEX", 248.6, -0.48, 4),
      tickerItem("UPCOM-INDEX", 92.8, 0.65, 5),
      tickerItem("S&P 500", 5431.6, 0.34, 6),
      tickerItem("NASDAQ", 17688.9, 0.54, 7),
      tickerItem("DOW JONES", 38712.2, -0.28, 8),
      tickerItem("FTSE 100", 8224.5, 0.38, 9),
      tickerItem("NIKKEI 225", 38420.1, 0.63, 10),
      tickerItem("HANG SENG", 17842.3, -0.46, 11),
      tickerItem("GOLD", 2347.8, 0.53, 12),
      tickerItem("WTI OIL", 78.42, -1.08, 13),
      tickerItem("SILVER", 29.84, -0.70, 14),
      tickerItem("DXY", 104.32, -0.17, 15),
      tickerItem("BTC/USD", 68240, 2.12, 16),
      tickerItem("ETH/USD", 3548, -1.17, 17),
    ],
    overviewByCategory: {
      indices: [
        overviewItem("VN-INDEX", "🇻🇳", 1281.4, 0.53, 1),
        overviewItem("VN30", "🇻🇳", 1302.7, 0.56, 2),
        overviewItem("VN100", "🇻🇳", 1184.2, 0.20, 3),
        overviewItem("HNX-INDEX", "🇻🇳", 248.6, -0.48, 4),
        overviewItem("UPCOM-INDEX", "🇻🇳", 92.8, 0.65, 5),
        overviewItem("S&P 500", "🇺🇸", 5431.6, 0.34, 6),
        overviewItem("NASDAQ", "🇺🇸", 17688.9, 0.54, 7),
        overviewItem("DOW JONES", "🇺🇸", 38712.2, -0.28, 8),
        overviewItem("FTSE 100", "🇬🇧", 8224.5, 0.38, 9),
        overviewItem("NIKKEI 225", "🇯🇵", 38420.1, 0.63, 10),
        overviewItem("HANG SENG", "🇭🇰", 17842.3, -0.46, 11),
        overviewItem("SHANGHAI", "🇨🇳", 3042.8, 0.42, 12),
        overviewItem("KOSPI", "🇰🇷", 2684.5, 0.68, 13),
        overviewItem("DAX", "🇩🇪", 18244.7, 0.24, 14),
        overviewItem("GOLD", "🥇", 2347.8, 0.53, 15),
        overviewItem("BTC/USD", "₿", 68240, 2.12, 16),
        overviewItem("ETH/USD", "Ξ", 3548, -1.17, 17),
      ],
      commodities: [
        overviewItem("GOLD", "🥇", 2347.8, 0.53, 15),
        overviewItem("WTI OIL", "🛢️", 78.42, -1.08, 16),
        overviewItem("SILVER", "⚪", 29.84, -0.70, 17),
        overviewItem("BRENT", "🛢️", 82.16, -0.84, 18),
        overviewItem("COPPER", "🔶", 4.28, 0.42, 19),
      ],
      crypto: [
        overviewItem("BTC/USD", "₿", 68240, 2.12, 20),
        overviewItem("ETH/USD", "Ξ", 3548, -1.17, 21),
        overviewItem("BNB/USD", "🔶", 612.4, 0.84, 22),
        overviewItem("SOL/USD", "◎", 148.6, 4.62, 23),
      ],
      forex: [
        overviewItem("EUR/USD", "🇪🇺", 1.0852, 0.19, 24),
        overviewItem("GBP/USD", "🇬🇧", 1.2741, 0.27, 25),
        overviewItem("USD/JPY", "🇯🇵", 157.21, 0.22, 26),
        overviewItem("USD/VND", "🇻🇳", 25430, 0.05, 27),
        overviewItem("AUD/USD", "🇦🇺", 0.6642, -0.14, 28),
      ],
    },
  }
}

export function getData(): MarketData {
  return getMockData()
}

/** @deprecated Legacy flat exports — re-exported from market-data for backward compatibility */
export const marketTickers: MarketTicker[] = [
  { symbol: "GOLD", name: { vi: "Vàng", en: "Gold" }, price: 2347.8, change: 12.4, changePercent: 0.53, trend: "up", group: "commodities" },
  { symbol: "SILVER", name: { vi: "Bạc", en: "Silver" }, price: 29.84, change: -0.21, changePercent: -0.7, trend: "down", group: "commodities" },
  { symbol: "DXY", name: { vi: "Chỉ số USD", en: "Dollar Index" }, price: 104.32, change: -0.18, changePercent: -0.17, trend: "down", group: "currencies" },
  { symbol: "EUR/USD", name: { vi: "EUR/USD", en: "EUR/USD" }, price: 1.0852, change: 0.0021, changePercent: 0.19, trend: "up", group: "currencies" },
  { symbol: "USD/JPY", name: { vi: "USD/JPY", en: "USD/JPY" }, price: 157.21, change: 0.34, changePercent: 0.22, trend: "up", group: "currencies" },
  { symbol: "BTC", name: { vi: "Bitcoin", en: "Bitcoin" }, price: 68240, change: 1420, changePercent: 2.12, trend: "up", group: "crypto" },
  { symbol: "ETH", name: { vi: "Ethereum", en: "Ethereum" }, price: 3548, change: -42, changePercent: -1.17, trend: "down", group: "crypto" },
  { symbol: "S&P 500", name: { vi: "S&P 500", en: "S&P 500" }, price: 5431.6, change: 18.2, changePercent: 0.34, trend: "up", group: "indices" },
  { symbol: "NASDAQ", name: { vi: "Nasdaq", en: "Nasdaq" }, price: 17688.9, change: 95.4, changePercent: 0.54, trend: "up", group: "indices" },
  { symbol: "VNINDEX", name: { vi: "VN-Index", en: "VN-Index" }, price: 1281.4, change: -6.8, changePercent: -0.53, trend: "down", group: "indices" },
  { symbol: "VN30", name: { vi: "VN30", en: "VN30" }, price: 1302.7, change: -4.1, changePercent: -0.31, trend: "down", group: "indices" },
]

export const sidebarOverview: SidebarOverviewItem[] = [
  sidebarOverviewItem("VN-INDEX", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 1281.4, 0.53, 1),
  sidebarOverviewItem("VN30", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 1302.7, 0.56, 2),
  sidebarOverviewItem("VN100", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 1184.2, 0.20, 3),
  sidebarOverviewItem("HNX-INDEX", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 248.6, -0.48, 4),
  sidebarOverviewItem("UPCOM-INDEX", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 92.8, 0.65, 5),
  sidebarOverviewItem("S&P 500", "🇺🇸", { vi: "Hoa Kỳ", en: "United States" }, 5431.6, 0.34, 6),
  sidebarOverviewItem("NASDAQ", "🇺🇸", { vi: "Hoa Kỳ", en: "United States" }, 17688.9, 0.54, 7),
  sidebarOverviewItem("DOW JONES", "🇺🇸", { vi: "Hoa Kỳ", en: "United States" }, 38712.2, -0.28, 8),
  sidebarOverviewItem("FTSE 100", "🇬🇧", { vi: "Anh Quốc", en: "United Kingdom" }, 8224.5, 0.38, 9),
  sidebarOverviewItem("NIKKEI 225", "🇯🇵", { vi: "Nhật Bản", en: "Japan" }, 38420.1, 0.63, 10),
  sidebarOverviewItem("HANG SENG", "🇭🇰", { vi: "Hồng Kông", en: "Hong Kong" }, 17842.3, -0.46, 11),
  sidebarOverviewItem("SHANGHAI", "🇨🇳", { vi: "Trung Quốc", en: "China" }, 3042.8, 0.42, 12),
  sidebarOverviewItem("KOSPI", "🇰🇷", { vi: "Hàn Quốc", en: "South Korea" }, 2684.5, 0.68, 13),
  sidebarOverviewItem("DAX", "🇩🇪", { vi: "Đức", en: "Germany" }, 18244.7, 0.24, 14),
  sidebarOverviewItem("GOLD", "🥇", { vi: "Hàng hóa", en: "Commodity" }, 2347.8, 0.53, 15),
  sidebarOverviewItem("WTI OIL", "🛢️", { vi: "Hàng hóa", en: "Commodity" }, 78.42, -1.08, 16),
  sidebarOverviewItem("BTC/USD", "₿", { vi: "Crypto", en: "Crypto" }, 68240, 2.12, 17),
]

export const marketOverview: MarketAsset[] = [
  { symbol: "VN-INDEX", name: { vi: "VN-Index", en: "VN-Index" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 1281.4, change: -6.8, changePercent: -0.53, trend: "down", seed: 1 },
  { symbol: "VN30", name: { vi: "VN30", en: "VN30" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 1302.7, change: -4.1, changePercent: -0.31, trend: "down", seed: 2 },
  { symbol: "VN100", name: { vi: "VN100", en: "VN100" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 1184.2, change: 2.4, changePercent: 0.20, trend: "up", seed: 3 },
  { symbol: "HNX-INDEX", name: { vi: "HNX-Index", en: "HNX-Index" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 248.6, change: -1.2, changePercent: -0.48, trend: "down", seed: 4 },
  { symbol: "UPCOM-INDEX", name: { vi: "UPCoM-Index", en: "UPCoM-Index" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 92.8, change: 0.6, changePercent: 0.65, trend: "up", seed: 5 },
  { symbol: "S&P 500", name: { vi: "S&P 500", en: "S&P 500" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 5431.6, change: 18.2, changePercent: 0.34, trend: "up", seed: 6 },
  { symbol: "NASDAQ", name: { vi: "Nasdaq", en: "Nasdaq" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 17688.9, change: 95.4, changePercent: 0.54, trend: "up", seed: 7 },
  { symbol: "DOW JONES", name: { vi: "Dow Jones", en: "Dow Jones" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 38712.2, change: -110.5, changePercent: -0.28, trend: "down", seed: 8 },
  { symbol: "FTSE 100", name: { vi: "FTSE 100", en: "FTSE 100" }, region: { vi: "Anh Quốc", en: "United Kingdom" }, price: 8224.5, change: 31.2, changePercent: 0.38, trend: "up", seed: 9 },
  { symbol: "NIKKEI 225", name: { vi: "Nikkei 225", en: "Nikkei 225" }, region: { vi: "Nhật Bản", en: "Japan" }, price: 38420.1, change: 240.6, changePercent: 0.63, trend: "up", seed: 10 },
  { symbol: "HANG SENG", name: { vi: "Hang Seng", en: "Hang Seng" }, region: { vi: "Hồng Kông", en: "Hong Kong" }, price: 17842.3, change: -82.4, changePercent: -0.46, trend: "down", seed: 11 },
  { symbol: "SHANGHAI", name: { vi: "Thượng Hải", en: "Shanghai" }, region: { vi: "Trung Quốc", en: "China" }, price: 3042.8, change: 12.6, changePercent: 0.42, trend: "up", seed: 12 },
  { symbol: "KOSPI", name: { vi: "KOSPI", en: "KOSPI" }, region: { vi: "Hàn Quốc", en: "South Korea" }, price: 2684.5, change: 18.2, changePercent: 0.68, trend: "up", seed: 13 },
  { symbol: "DAX", name: { vi: "DAX", en: "DAX" }, region: { vi: "Đức", en: "Germany" }, price: 18244.7, change: 44.1, changePercent: 0.24, trend: "up", seed: 14 },
  { symbol: "GOLD", name: { vi: "Vàng", en: "Gold" }, region: { vi: "Hàng hóa", en: "Commodity" }, price: 2347.8, change: 12.4, changePercent: 0.53, trend: "up", seed: 15 },
  { symbol: "WTI OIL", name: { vi: "Dầu WTI", en: "WTI Oil" }, region: { vi: "Hàng hóa", en: "Commodity" }, price: 78.42, change: -0.86, changePercent: -1.08, trend: "down", seed: 16 },
  { symbol: "BTC/USD", name: { vi: "Bitcoin", en: "Bitcoin" }, region: { vi: "Tiền mã hóa", en: "Crypto" }, price: 68240, change: 1420, changePercent: 2.12, trend: "up", seed: 17 },
]
