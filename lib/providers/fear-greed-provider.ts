import "server-only"

import { fetchCryptoFearGreed } from "@/lib/fear-greed/crypto"
import { fearGreedData, type FearGreedItem } from "@/lib/fear-greed"
import { computeUsFearGreed } from "@/lib/fear-greed/us"
import { computeVietnamFearGreed } from "@/lib/fear-greed/vietnam"
import { fetchHeatmapMarket } from "@/lib/market/heatmap"
import {
  getData as getVietnamMarketData,
  getMockData as getVietnamMock,
  type VietnamMarketData,
} from "@/lib/providers/vietnam-market-provider"
import type { HeatmapAsset } from "@/types/market"

export type BuildFearGreedOptions = {
  vietnam?: VietnamMarketData
  usHeatmapItems?: HeatmapAsset[]
}

function fallbackItem(key: string, value: number): FearGreedItem {
  return { key, value }
}

function staticFallback(key: string): FearGreedItem {
  const row = fearGreedData.find((item) => item.key === key)
  return fallbackItem(key, row?.value ?? 50)
}

/** Build live Fear & Greed gauges for dashboard SSR. */
export async function buildFearGreedItems(
  options: BuildFearGreedOptions = {},
): Promise<FearGreedItem[]> {
  try {
    const [vietnam, usHeatmap, cryptoValue] = await Promise.all([
      options.vietnam ?? getVietnamMarketData().catch(() => getVietnamMock()),
      options.usHeatmapItems
        ? Promise.resolve({ items: options.usHeatmapItems })
        : fetchHeatmapMarket("us"),
      fetchCryptoFearGreed(),
    ])

    const [vnBreakdown, usBreakdown] = await Promise.all([
      computeVietnamFearGreed({
        heatmapStocks: vietnam.heatmapStocks,
        dashboard: vietnam.dashboard,
      }),
      computeUsFearGreed({ heatmapItems: usHeatmap.items }),
    ])

    return [
      fallbackItem("fg.vnindex", vnBreakdown.composite),
      fallbackItem("fg.crypto", cryptoValue ?? staticFallback("fg.crypto").value),
      fallbackItem("fg.usStocks", usBreakdown.composite),
    ]
  } catch {
    return [...fearGreedData]
  }
}
