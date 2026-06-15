import { spark, toTrend } from "@/lib/market-utils"
import type { CryptoAsset } from "@/lib/providers/crypto-provider"
import type {
  OverviewCategory,
  OverviewListItem,
  TickerBarItem,
} from "@/lib/providers/market-provider"

function seedFromSymbol(symbol: string): number {
  return symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
}

type QuoteOverlay = {
  price: number
  changePercent: number
  trend: ReturnType<typeof toTrend>
}

function assetToOverlay(asset: CryptoAsset): QuoteOverlay {
  const changePercent = Number(asset.change24h.toFixed(2))
  return {
    price: asset.price,
    changePercent,
    trend: toTrend(changePercent),
  }
}

export function buildCryptoAssetQuoteMap(assets: CryptoAsset[]): Map<string, QuoteOverlay> {
  const map = new Map<string, QuoteOverlay>()
  for (const asset of assets) {
    const overlay = assetToOverlay(asset)
    map.set(asset.symbol, overlay)
    map.set(`${asset.symbol}/USD`, overlay)
  }
  return map
}

function applyOverlay<T extends TickerBarItem | OverviewListItem>(
  item: T,
  map: Map<string, QuoteOverlay>,
): T {
  const overlay = map.get(item.symbol)
  if (!overlay) return item
  return {
    ...item,
    price: overlay.price,
    changePercent: overlay.changePercent,
    trend: overlay.trend,
    sparkline: spark(seedFromSymbol(item.symbol), 14, overlay.trend === "up" ? 1 : -1),
  }
}

export function mergeCryptoAssetsIntoTickerItems(
  items: TickerBarItem[],
  assets: CryptoAsset[],
): TickerBarItem[] {
  const map = buildCryptoAssetQuoteMap(assets)
  return items.map((item) => applyOverlay(item, map))
}

export function mergeCryptoAssetsIntoOverview(
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>,
  assets: CryptoAsset[],
): Record<OverviewCategory, OverviewListItem[]> {
  const map = buildCryptoAssetQuoteMap(assets)
  return Object.fromEntries(
    (Object.entries(overviewByCategory) as [OverviewCategory, OverviewListItem[]][]).map(
      ([category, items]) => [category, items.map((item) => applyOverlay(item, map))],
    ),
  ) as Record<OverviewCategory, OverviewListItem[]>
}
