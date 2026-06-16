import {
  buildVietnamSectorGridLayout,
  countVnSectorGridTiles,
} from "../lib/vietnam/vietnam-sector-grid-layout"
import { heatmapRowsToMarketAssets } from "../lib/market/heatmap-assets"
import { limitHeatmapAssets } from "../lib/market/heatmap-limits"
import type { TreemapRect } from "../lib/treemap/squarify"

const BASE = process.argv[2] ?? "http://localhost:3016"

function aspectRatio(rect: TreemapRect): number {
  const minEdge = Math.max(Math.min(rect.w, rect.h), 1e-9)
  return Math.max(rect.w, rect.h) / minEdge
}

async function main() {
  const res = await fetch(`${BASE}/api/heatmaps/vn`)
  const data = await res.json()
  const assets = limitHeatmapAssets(
    heatmapRowsToMarketAssets(data.items ?? [], "vn"),
    "vn",
    "tradingValue",
  )
  const layout = buildVietnamSectorGridLayout(assets, "tradingValue")
  const counts = countVnSectorGridTiles(layout)

  let maxAspect = 0
  let maxSectorShare = 0
  for (const sector of layout.sectors) {
    const headerH = Math.min(sector.rect.h * 0.07, 0.032)
    const innerArea = sector.rect.w * Math.max(sector.rect.h - headerH, 0)
    for (const tile of sector.tiles) {
      maxAspect = Math.max(maxAspect, aspectRatio(tile.rect))
      maxSectorShare = Math.max(maxSectorShare, (tile.rect.w * tile.rect.h) / innerArea)
    }
  }

  console.log(
    JSON.stringify(
      {
        inputAssets: assets.length,
        renderedTiles: counts,
        maxAspectRatio: Number(maxAspect.toFixed(2)),
        maxTileSectorAreaShare: Number((maxSectorShare * 100).toFixed(1)) + "%",
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
