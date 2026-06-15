import "server-only"

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
import { fearGreedData, type FearGreedItem } from "@/lib/fear-greed"

export type DashboardData = {
  dashboardTickerBarItems: TickerBarItem[]
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>
  heatmapMarkets: HeatmapMarket[]
  fearGreedItems: FearGreedItem[]
}

function pickHeatmapMarket(
  markets: HeatmapMarket[],
  id: HeatmapMarket["id"],
): HeatmapMarket | null {
  return markets.find((market) => market.id === id) ?? null
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
  const marketMock = getMarketMock()
  const heatmapMock = getHeatmapMock()

  let vietnamIndices: VietnamMarketIndex[] = []
  let globalQuotes: GlobalQuote[] = []
  let cryptoAssets: CryptoAsset[] = []
  let vnHeatmapMarket: HeatmapMarket | null = null

  try {
    const [vietnam, globalMarket, crypto] = await Promise.all([
      getVietnamMarketData(),
      getGlobalMarketData(),
      getCryptoData(),
    ])
    vietnamIndices = vietnam.indices ?? []
    globalQuotes = globalMarket.quotes ?? []
    cryptoAssets = crypto.assets ?? []
    vnHeatmapMarket = vietnam.heatmapMarket ?? pickHeatmapMarket(heatmapMock.markets, "vn")
  } catch {
    vnHeatmapMarket = pickHeatmapMarket(heatmapMock.markets, "vn")
  }

  const quoteMap = buildQuoteMap(vietnamIndices, globalQuotes, cryptoAssets)

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

  const heatmapMarkets: HeatmapMarket[] = vnHeatmapMarket ? [vnHeatmapMarket] : []

  return {
    dashboardTickerBarItems,
    overviewByCategory,
    heatmapMarkets,
    fearGreedItems: buildFearGreedItems(cryptoAssets),
  }
}
