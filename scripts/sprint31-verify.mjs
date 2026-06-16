#!/usr/bin/env node
const BASE = "https://btrading.org"

async function main() {
  const [heatmapRes, marketsRes, homeRes] = await Promise.all([
    fetch(`${BASE}/api/heatmaps/vietnam`),
    fetch(`${BASE}/api/vietnam-markets`),
    fetch(`${BASE}/`),
  ])

  const heatmap = await heatmapRes.json()
  const markets = await marketsRes.json()
  const homeHtml = await homeRes.text()

  const langMatch = homeHtml.match(/<html[^>]*lang="([^"]+)"/)
  const vnStrings =
    homeHtml.includes("Khối lượng cao nhất") ||
    homeHtml.includes("GTGD") ||
    homeHtml.includes("Bảng giá")

  const topVol = markets.dashboard?.topVolume ?? []
  const topVal = markets.dashboard?.topValue ?? []
  const ff = markets.analytics?.foreignFlow
  const prop = markets.analytics?.proprietary

  const sampleSymbols = ["HPG", "VCB", "SSI"]
  const samples = {}
  for (const sym of sampleSymbols) {
    const row = topVal.find((r) => r.symbol === sym) ?? topVol.find((r) => r.symbol === sym)
    if (row) samples[sym] = row
  }

  const out = {
    verifiedAt: new Date().toISOString(),
    heatmap: {
      source: heatmap.source,
      itemCount: heatmap.items?.length ?? heatmap.itemCount,
      volumeUnit: heatmap.volumeUnit,
      top5: (heatmap.items ?? []).slice(0, 5).map((i) => ({
        symbol: i.symbol,
        volume: i.volume,
        change: i.changePercent,
      })),
    },
    markets: {
      topVolumeCount: topVol.length,
      topValueCount: topVal.length,
      topVolume: topVol.map((r) => ({
        symbol: r.symbol,
        volumeShares: r.volumeShares,
        volume: r.volume,
        price: r.price,
      })),
      topValue: topVal.map((r) => ({
        symbol: r.symbol,
        tradingValue: r.tradingValue,
        volumeShares: r.volumeShares,
        price: r.price,
      })),
      foreignFlow: {
        available: ff?.available,
        topBuy: (ff?.topBuy ?? []).slice(0, 5),
        topSell: (ff?.topSell ?? []).slice(0, 5),
      },
      proprietary: prop,
      samples,
    },
    ui: {
      htmlLang: langMatch?.[1] ?? null,
      vnDashboardStrings: vnStrings,
    },
  }

  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
