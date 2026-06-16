import {
  analyzeVnSectorTreemapLayout,
  buildVietnamSectorTreemapLayout,
  countVnSectorTreemapTiles,
} from "../lib/vietnam/vietnam-sector-grid-layout"
import { heatmapRowsToMarketAssets } from "../lib/market/heatmap-assets"
import { limitHeatmapAssets } from "../lib/market/heatmap-limits"

const BASE = process.argv[2] ?? "http://localhost:3015"

async function main() {
  const res = await fetch(`${BASE}/api/heatmaps/vn`)
  const data = await res.json()
  const assets = limitHeatmapAssets(
    heatmapRowsToMarketAssets(data.items ?? [], "vn"),
    "vn",
    "tradingValue",
  )
  const layout = buildVietnamSectorTreemapLayout(assets, "tradingValue")
  const counts = countVnSectorTreemapTiles(layout)
  const analysis = analyzeVnSectorTreemapLayout(layout)

  console.log(
    JSON.stringify(
      {
        inputAssets: assets.length,
        sectorCount: layout.sectors.length,
        renderedTiles: counts,
        maxTileAspectRatio: Number(analysis.maxTileAspect.toFixed(2)),
        maxSectorAspectRatio: Number(analysis.maxSectorAspect.toFixed(2)),
        maxTileSectorAreaShare: Number((analysis.maxTileSectorAreaShare * 100).toFixed(1)) + "%",
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
