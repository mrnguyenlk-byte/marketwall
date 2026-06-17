import { heatmapRowsToMarketAssets } from "@/lib/market/heatmap-assets"
import {
  HOSE_SEEDS,
  HNX_SEEDS,
  UPCOM_SEEDS,
} from "@/lib/vietnam-heatmap-seeds"
import type { Lang } from "@/lib/i18n"
import type { HeatmapAsset, MarketAsset } from "@/types/market"

function seedsToHeatmapRows(): HeatmapAsset[] {
  const rows: HeatmapAsset[] = []
  for (const seed of [...HOSE_SEEDS, ...HNX_SEEDS, ...UPCOM_SEEDS]) {
    rows.push({
      symbol: seed.symbol,
      name: seed.name.vi,
      price: seed.price,
      changePercent: seed.changePercent,
      volume: seed.volume,
      sector: seed.sector,
      marketCap: seed.marketCap,
    })
  }
  return rows
}

/** VN universe for header search — live heatmap rows with seed fallback. */
export function buildVnSearchAssets(rows?: HeatmapAsset[]): MarketAsset[] {
  const source = rows?.length ? rows : seedsToHeatmapRows()
  return heatmapRowsToMarketAssets(source, "vn")
}

export function filterSymbolSearch(
  assets: MarketAsset[],
  query: string,
  lang: Lang,
  limit = 8,
): MarketAsset[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const upper = trimmed.toUpperCase()
  const lower = trimmed.toLowerCase()
  const symbolMatches: MarketAsset[] = []
  const nameMatches: MarketAsset[] = []

  for (const asset of assets) {
    if (asset.symbol.toUpperCase().startsWith(upper)) {
      symbolMatches.push(asset)
      continue
    }
    if (
      asset.name[lang].toLowerCase().includes(lower) ||
      asset.name.en.toLowerCase().includes(lower) ||
      asset.name.vi.toLowerCase().includes(lower)
    ) {
      nameMatches.push(asset)
    }
  }

  const bySymbol = (a: MarketAsset, b: MarketAsset) => a.symbol.localeCompare(b.symbol)
  symbolMatches.sort(bySymbol)
  nameMatches.sort(bySymbol)

  return [...symbolMatches, ...nameMatches].slice(0, limit)
}
