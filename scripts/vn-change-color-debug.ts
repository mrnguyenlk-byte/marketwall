#!/usr/bin/env node
/**
 * Debug VN heatmap tile colors — 20 sample symbols with price vs reference.
 * Usage: npx tsx scripts/vn-change-color-debug.ts
 */
import {
  computeVnChangePercent,
  heatmapColorLabel,
  resolveVnChangePercent,
  vpsPriceToVnd,
} from "@/lib/vietnam/vn-change-sign"
import { heatmapRowsToMarketAssets } from "@/lib/market/heatmap-assets"
import type { HeatmapAsset } from "@/types/market"

const VPS_BASE = "https://bgapidatafeed.vps.com.vn"
const SAMPLE_SYMBOLS = [
  "VCB", "FPT", "HPG", "VIC", "VHM", "TCB", "MBB", "SSI", "VND", "HDB",
  "VPB", "STB", "ACB", "MWG", "GAS", "PLX", "NVL", "HCM", "VIX", "PDR",
]

type VpsRow = {
  sym?: string
  lastPrice?: number
  closePrice?: string
  changePc?: string
  r?: number
  avePrice?: string
}

function parseCurrent(row: VpsRow): number | null {
  return vpsPriceToVnd(row.lastPrice) ?? vpsPriceToVnd(row.avePrice)
}

function parseRef(row: VpsRow): number | null {
  return vpsPriceToVnd(row.r) ?? vpsPriceToVnd(row.closePrice)
}

async function main() {
  const url = `${VPS_BASE}/getliststockdata/${SAMPLE_SYMBOLS.join(",")}`
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "MarketWall-Debug/1.0" },
  })
  if (!res.ok) {
    console.error(`VPS HTTP ${res.status}`)
    process.exit(1)
  }

  const rows = (await res.json()) as VpsRow[]
  console.log("VN heatmap color debug — 20 symbols")
  console.log(
    "symbol\tprice\trefPrice\trawChangePc\tadapterPct\ttilePct\tcolor",
  )
  console.log("-".repeat(72))

  for (const sym of SAMPLE_SYMBOLS) {
    const row = rows.find((r) => r.sym?.toUpperCase() === sym)
    if (!row) {
      console.log(`${sym}\t—\t—\t—\t—\tmissing`)
      continue
    }
    const price = parseCurrent(row)
    const refPrice = parseRef(row)
    const rawChangePc = Number(row.changePc ?? 0)
    const adapterChangePercent =
      price != null && refPrice != null
        ? computeVnChangePercent(price, refPrice)
        : price != null
          ? resolveVnChangePercent(price, {
              referencePrice: refPrice,
              rawChangePercent: rawChangePc,
              unsignedMagnitude: true,
            })
          : 0
    const heatmapRow: HeatmapAsset = {
      symbol: sym,
      name: sym,
      price: price ?? 0,
      referencePrice: refPrice ?? undefined,
      changePercent: adapterChangePercent,
      volume: 0,
      sector: "Equity",
      marketCap: 0,
    }
    const tileChangePercent = heatmapRowsToMarketAssets([heatmapRow], "vn")[0]?.changePercent ?? 0
    const color = heatmapColorLabel(tileChangePercent)
    const refCheck =
      price != null && refPrice != null
        ? computeVnChangePercent(price, refPrice)
        : null
    if (refCheck != null && refCheck !== adapterChangePercent) {
      console.warn(`[warn] ${sym} ref-check mismatch ${refCheck} vs ${adapterChangePercent}`)
    }
    console.log(
      [
        sym,
        price?.toFixed(0) ?? "—",
        refPrice?.toFixed(0) ?? "—",
        rawChangePc.toFixed(2),
        adapterChangePercent.toFixed(2),
        tileChangePercent.toFixed(2),
        color,
      ].join("\t"),
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
