#!/usr/bin/env node
const BASE = process.env.API_BASE ?? "https://btrading.org"

async function main() {
  const [heatmapRes, marketsRes, homeRes] = await Promise.all([
    fetch(`${BASE}/api/heatmaps/vietnam`),
    fetch(`${BASE}/api/vietnam-markets`),
    fetch(`${BASE}/`),
  ])
  const heatmap = await heatmapRes.json()
  const markets = await marketsRes.json()
  const home = await homeRes.text()

  const prop = markets.analytics?.proprietary
  const out = {
    verifiedAt: new Date().toISOString(),
    base: BASE,
    heatmap: {
      source: heatmap.source,
      itemCount: heatmap.items?.length ?? heatmap.itemCount,
      volumeUnit: heatmap.volumeUnit,
    },
    markets: {
      topVolume: (markets.dashboard?.topVolume ?? []).slice(0, 5).map((r) => r.symbol),
      topValue: (markets.dashboard?.topValue ?? []).slice(0, 5).map((r) => r.symbol),
      foreignFlowAvailable: markets.analytics?.foreignFlow?.available,
      proprietary: {
        available: prop?.available,
        source: prop?.source,
        historyLen: prop?.history?.length ?? 0,
        topNetBuy: prop?.topNetBuy?.length ?? 0,
        topNetSell: prop?.topNetSell?.length ?? 0,
      },
    },
    ui: {
      htmlLang: home.match(/<html[^>]*lang="([^"]+)"/)?.[1] ?? null,
    },
  }
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
