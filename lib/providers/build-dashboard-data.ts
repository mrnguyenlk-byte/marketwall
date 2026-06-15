import { type Trend, toTrend, spark } from "@/lib/market-utils"
import { getMockData as getMarketMock } from "@/lib/providers/market-provider"
import type { TickerBarItem, OverviewCategory, OverviewListItem } from "@/lib/providers/market-provider"
import { getMockData as getHeatmapMock } from "@/lib/providers/heatmap-provider"
import type { HeatmapMarket } from "@/lib/providers/heatmap-provider"
import {
  getData as getCryptoData,
  deriveCryptoFearGreed,
  type CryptoAsset,
} from "@/lib/providers/crypto-provider"
import {
  getData as getGlobalMarketData,
  type GlobalQuote,
} from "@/lib/providers/global-market-provider"
import {
  getData as getVietnamMarketData,
  type VietnamMarketIndex,
} from "@/lib/providers/vietnam-market-provider"
import { buildVietnamMarketIndexQuoteMap } from "@/lib/vietnam-market-merge"
import { fearGreedData, type FearGreedItem } from "@/lib/market-data"

export type DashboardData = {
  dashboardTickerBarItems: TickerBarItem[]
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>
  heatmapMarkets: HeatmapMarket[]
  fearGreedItems: FearGreedItem[]
}

type QuoteOverlay = {
  price: number
  changePercent: number
  trend: Trend
}

function seedFromSymbol(symbol: string): number {
  return symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
}

function overlayTickerItem(item: TickerBarItem, quote?: QuoteOverlay): TickerBarItem {
  if (!quote) return item
  return {
    ...item,
    price: quote.price,
    changePercent: quote.changePercent,
    trend: quote.trend,
    sparkline: spark(seedFromSymbol(item.symbol), 14, quote.trend === "up" ? 1 : -1),
  }
}

function overlayOverviewItem(item: OverviewListItem, quote?: QuoteOverlay): OverviewListItem {
  if (!quote) return item
  return {
    ...item,
    price: quote.price,
    changePercent: quote.changePercent,
    trend: quote.trend,
    sparkline: spark(seedFromSymbol(item.symbol), 14, quote.trend === "up" ? 1 : -1),
  }
}

function buildCryptoQuoteMap(assets: CryptoAsset[]): Map<string, QuoteOverlay> {
  const map = new Map<string, QuoteOverlay>()

  for (const asset of assets) {
    const changePercent = Number(asset.change24h.toFixed(2))
    const overlay: QuoteOverlay = {
      price: asset.price,
      changePercent,
      trend: toTrend(changePercent),
    }

    map.set(`${asset.symbol}/USD`, overlay)
    map.set(asset.symbol, overlay)
  }

  return map
}

function buildQuoteMap(
  vnIndices: VietnamMarketIndex[],
  globalQuotes: GlobalQuote[],
  cryptoAssets: CryptoAsset[],
): Map<string, QuoteOverlay> {
  const map = new Map<string, QuoteOverlay>()

  for (const [symbol, overlay] of buildVietnamMarketIndexQuoteMap(vnIndices)) {
    map.set(symbol, overlay)
  }

  for (const q of globalQuotes) {
    map.set(q.symbol, {
      price: q.price,
      changePercent: q.changePercent,
      trend: toTrend(q.changePercent),
    })
  }

  for (const [symbol, overlay] of buildCryptoQuoteMap(cryptoAssets)) {
    map.set(symbol, overlay)
  }

  return map
}

function buildFearGreedItems(cryptoAssets: CryptoAsset[]): FearGreedItem[] {
  const cryptoValue = deriveCryptoFearGreed(cryptoAssets)
  return fearGreedData.map((item) =>
    item.key === "fg.crypto" ? { ...item, value: cryptoValue } : item,
  )
}

export async function buildDashboardData(): Promise<DashboardData> {
  const [vietnam, globalMarket, crypto] = await Promise.all([
    getVietnamMarketData(),
    getGlobalMarketData(),
    getCryptoData(),
  ])

  const marketMock = getMarketMock()
  const heatmapMock = getHeatmapMock()

  const quoteMap = buildQuoteMap(vietnam.indices, globalMarket.quotes, crypto.assets)

  const dashboardTickerBarItems = marketMock.dashboardTickerBarItems.map((item) =>
    overlayTickerItem(item, quoteMap.get(item.symbol)),
  )

  const overviewByCategory = Object.fromEntries(
    (Object.entries(marketMock.overviewByCategory) as [OverviewCategory, OverviewListItem[]][]).map(
      ([category, items]) => [
        category,
        items.map((item) => overlayOverviewItem(item, quoteMap.get(item.symbol))),
      ],
    ),
  ) as Record<OverviewCategory, OverviewListItem[]>

  const usMarket = heatmapMock.markets.find((m) => m.id === "us")!
  const cryptoMarket = heatmapMock.markets.find((m) => m.id === "crypto")!

  const heatmapMarkets: HeatmapMarket[] = [
    vietnam.heatmapMarket,
    usMarket,
    {
      ...cryptoMarket,
      tiles: crypto.heatmapTiles,
    },
  ]

  return {
    dashboardTickerBarItems,
    overviewByCategory,
    heatmapMarkets,
    fearGreedItems: buildFearGreedItems(crypto.assets),
  }
}
