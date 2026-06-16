#!/usr/bin/env node
/**
 * Sprint 30 — Vietnam data integrity audit (volume, GTGD, foreign flow, rankings).
 * Usage: node scripts/vn-data-integrity-audit.mjs
 */
const SYMBOLS = ["VCB", "FPT", "HPG", "SSI", "SHB", "VPB", "VIC", "VHM"]
const SHARES_PER_LOT = 10
const MW_API = process.env.MW_API_BASE ?? "https://btrading.org"

function pctDiff(a, b) {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null
  return ((a - b) / Math.abs(b)) * 100
}

function classify(pct) {
  if (pct == null) return "N/A"
  const ap = Math.abs(pct)
  if (ap < 1) return "Excellent"
  if (ap < 3) return "Good"
  if (ap < 5) return "Acceptable"
  return "Poor"
}

function gtgd(price, lots) {
  return Math.round(price * lots * SHARES_PER_LOT)
}

async function fetchVps(symbols) {
  const rows = await fetch(
    `https://bgapidatafeed.vps.com.vn/getliststockdata/${symbols.join(",")}`,
    { headers: { Accept: "application/json", "User-Agent": "MarketWall-Audit/1.0" } },
  ).then((r) => r.json())
  const map = {}
  for (const row of rows) {
    const sym = row.sym?.toUpperCase()
    const price = Number(row.closePrice ?? 0) || (row.lastPrice >= 1000 ? row.lastPrice : row.lastPrice * 1000)
    const volLots = row.lot ?? 0
    const fb = Number(row.fBVol ?? 0)
    const fs = Number(row.fSVolume ?? 0)
    map[sym] = {
      price,
      changePct: Number(row.changePc ?? 0),
      volumeLots: volLots,
      volumeShares: volLots * SHARES_PER_LOT,
      tradingValue: gtgd(price, volLots),
      foreignBuy: fb * SHARES_PER_LOT,
      foreignSell: fs * SHARES_PER_LOT,
      netForeign: (fb - fs) * SHARES_PER_LOT,
    }
  }
  return map
}

async function fetchHeatmap() {
  const hm = await fetch(`${MW_API}/api/heatmaps/vietnam`).then((r) => r.json())
  const map = {}
  for (const item of hm.items ?? []) {
    const lot = item.volumeLot ?? item.volume ?? 0
    const shares = item.volumeShares ?? lot * SHARES_PER_LOT
    map[item.symbol] = {
      price: item.price,
      changePct: item.changePercent,
      volumeLot: lot,
      volumeShares: shares,
      tradingValue: item.tradingValue ?? gtgd(item.price, lot),
      volumeUnit: item.volumeUnit ?? hm.volumeUnit,
      foreignBuy: item.foreignBuy,
      foreignSell: item.foreignSell,
    }
  }
  return { map, source: hm.source, volumeUnit: hm.volumeUnit, count: hm.items?.length ?? 0 }
}

async function fetchDashboard() {
  const res = await fetch(`${MW_API}/api/vietnam-markets`).then((r) => r.json())
  return res.dashboard ?? null
}

function verifyMonotonic(rows, field) {
  if (!rows?.length) return { ok: false, reason: `no ${field} rows` }
  let monotonic = true
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1][field] ?? 0
    const cur = rows[i][field] ?? 0
    if (cur > prev) monotonic = false
  }
  return { ok: monotonic, monotonic, field, sample: rows.slice(0, 3) }
}

function verifyRankingAgainstVps(rows, vpsAll, field, vpsField) {
  const base = verifyMonotonic(rows, field)
  const mismatches = []
  for (const row of (rows ?? []).slice(0, 5)) {
    const vps = vpsAll[row.symbol]
    if (!vps) continue
    const mwVal = row[field] ?? 0
    const vpsVal = vps[vpsField] ?? 0
    const grade = classify(pctDiff(mwVal, vpsVal))
    if (grade === "Poor" || grade === "Acceptable") {
      mismatches.push({ symbol: row.symbol, mw: mwVal, vps: vpsVal, grade })
    }
  }
  return { ...base, ok: base.ok && mismatches.length === 0, mismatches }
}

async function main() {
  const [vpsSample, hm, dashboard] = await Promise.all([
    fetchVps(SYMBOLS),
    fetchHeatmap(),
    fetchDashboard(),
  ])

  const allSymbols = [
    ...new Set([
      ...SYMBOLS,
      ...(dashboard?.topVolume ?? []).map((r) => r.symbol),
      ...(dashboard?.topValue ?? []).map((r) => r.symbol),
      ...(dashboard?.topForeignBuy ?? []).map((r) => r.symbol),
      ...(dashboard?.topForeignSell ?? []).map((r) => r.symbol),
    ]),
  ]
  const vpsLeader = await fetchVps(allSymbols)

  const symbolAudits = SYMBOLS.map((sym) => {
    const mw = hm.map[sym]
    const vps = vpsSample[sym]
    return {
      symbol: sym,
      volumeUnit: "lot10",
      formulas: {
        volumeShares: "lot × 10",
        gtgd: "price × lot × 10",
        foreignShares: "fBVol|fSVolume × 10",
      },
      marketwall: mw,
      vps,
      checks: {
        volumeShares: classify(pctDiff(mw?.volumeShares, vps?.volumeShares)),
        tradingValue: classify(pctDiff(mw?.tradingValue, vps?.tradingValue)),
        foreignBuy: classify(pctDiff(mw?.foreignBuy, vps?.foreignBuy)),
        foreignSell: classify(pctDiff(mw?.foreignSell, vps?.foreignSell)),
      },
      sampleGtgd: vps
        ? { price: vps.price, lots: vps.volumeLots, shares: vps.volumeShares, gtgd: vps.tradingValue }
        : null,
      sampleForeign: vps
        ? {
            fBVolLots: vps.foreignBuy / SHARES_PER_LOT,
            fSVolumeLots: vps.foreignSell / SHARES_PER_LOT,
            buyShares: vps.foreignBuy,
            sellShares: vps.foreignSell,
          }
        : null,
    }
  })

  const topVolumeRanking = verifyRankingAgainstVps(
    dashboard?.topVolume,
    vpsLeader,
    "volumeShares",
    "volumeShares",
  )
  const topValueRanking = verifyRankingAgainstVps(
    dashboard?.topValue,
    vpsLeader,
    "value",
    "tradingValue",
  )
  const topForeignBuyRanking = verifyRankingAgainstVps(
    dashboard?.topForeignBuy,
    vpsLeader,
    "foreignBuy",
    "foreignBuy",
  )
  const topForeignSellRanking = verifyRankingAgainstVps(
    dashboard?.topForeignSell,
    vpsLeader,
    "foreignSell",
    "foreignSell",
  )

  console.log(
    JSON.stringify(
      {
        auditedAt: new Date().toISOString(),
        apiBase: MW_API,
        heatmap: { source: hm.source, volumeUnit: hm.volumeUnit, itemCount: hm.count },
        dashboardSource: dashboard?.source,
        rankings: {
          topVolume: topVolumeRanking,
          topValue: topValueRanking,
          topForeignBuy: topForeignBuyRanking,
          topForeignSell: topForeignSellRanking,
        },
        symbolAudits,
        summary: {
          p0_volume: symbolAudits.every((r) => ["Excellent", "Good", "N/A"].includes(r.checks.volumeShares)),
          p0_gtgd: symbolAudits.every((r) => ["Excellent", "Good", "N/A"].includes(r.checks.tradingValue)),
          p0_foreign: symbolAudits.every(
            (r) =>
              ["Excellent", "Good", "N/A"].includes(r.checks.foreignBuy) &&
              ["Excellent", "Good", "N/A"].includes(r.checks.foreignSell),
          ),
          p0_topVolumeRanking: topVolumeRanking.ok,
          p0_topValueRanking: topValueRanking.ok,
          p0_foreignBuyRanking: topForeignBuyRanking.ok,
          p0_foreignSellRanking: topForeignSellRanking.ok,
        },
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
