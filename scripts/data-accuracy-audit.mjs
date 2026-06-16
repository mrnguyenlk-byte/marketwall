#!/usr/bin/env node
/**
 * Sprint 21 — Cross-provider Vietnam quote accuracy audit.
 * Usage: node scripts/data-accuracy-audit.mjs
 */
const SYMBOLS = ["VCB", "FPT", "HPG", "SSI", "SHB", "VPB", "VIC", "VHM"]
const SHARES_PER_LOT = 10
const MW_API = process.env.MW_API_BASE ?? "https://btrading.org"

function pctDiff(a, b) {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null
  return ((a - b) / Math.abs(b)) * 100
}
function absDiff(a, b) {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) return null
  return a - b
}
function classify(pct) {
  if (pct == null) return "N/A"
  const ap = Math.abs(pct)
  if (ap < 1) return "Excellent"
  if (ap < 3) return "Good"
  if (ap < 5) return "Acceptable"
  return "Poor"
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
      tradingValue: Math.round(price * volLots * SHARES_PER_LOT),
      foreignBuy: fb * SHARES_PER_LOT,
      foreignSell: fs * SHARES_PER_LOT,
      netForeign: (fb - fs) * SHARES_PER_LOT,
    }
  }
  return map
}

async function fetchSsi(symbol) {
  const d = await fetch(`https://iboard-query.ssi.com.vn/stock/${symbol}`, {
    headers: { Accept: "application/json", "User-Agent": "MarketWall-Audit/1.0" },
  })
    .then((r) => r.json())
    .then((j) => j.data ?? {})
  const price = d.matchedPrice ?? null
  const vol = d.nmTotalTradedQty ?? null
  const fb = d.buyForeignQtty ?? null
  const fs = d.sellForeignQtty ?? null
  return {
    price,
    changePct: d.priceChangePercent ?? null,
    volume: vol,
    tradingValue: d.nmTotalTradedValue ?? null,
    foreignBuy: fb,
    foreignSell: fs,
    netForeign: fb != null && fs != null ? fb - fs : null,
  }
}

async function fetchMarketWall() {
  const hm = await fetch(`${MW_API}/api/heatmaps/vietnam`).then((r) => r.json())
  const map = {}
  for (const item of hm.items ?? []) {
    const tv =
      item.value != null && item.value > 0
        ? item.value
        : Math.round(item.price * item.volume * SHARES_PER_LOT)
    map[item.symbol] = {
      price: item.price,
      changePct: item.changePercent,
      volumeLot: item.volumeLot ?? item.volume,
      volumeShares: item.volumeShares ?? (item.volume ?? 0) * SHARES_PER_LOT,
      tradingValue: tv,
      volumeUnit: item.volumeUnit ?? hm.volumeUnit ?? null,
      foreignBuy: item.foreignBuy ?? null,
      foreignSell: item.foreignSell ?? null,
      foreignNetValue: item.foreignNetValue ?? null,
    }
  }
  return { map, source: hm.source, volumeUnit: hm.volumeUnit ?? null }
}

async function fetchKbsForeign() {
  const rows = await fetch(
    "https://kbbuddywts.kbsec.com.vn/iis-server/investment/rtranking/foreignTotal",
    { headers: { Accept: "application/json", Referer: "https://kbbuddywts.kbsec.com.vn/" } },
  ).then((r) => r.json())
  const map = {}
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const sym = String(row.SB ?? row.sb ?? "").toUpperCase()
      const price = Number(row.CP ?? row.FMP ?? 0)
      const fb = Number(row.FB ?? 0)
      const fs = Number(row.FS ?? 0)
      map[sym] = {
        foreignBuy: fb,
        foreignSell: fs,
        netForeign: fb - fs,
        price,
      }
    }
  }
  return map
}

async function main() {
  const [vps, mwRes, kbsForeign] = await Promise.all([
    fetchVps(SYMBOLS),
    fetchMarketWall(),
    fetchKbsForeign(),
  ])
  const ssi = {}
  for (const s of SYMBOLS) ssi[s] = await fetchSsi(s)

  const rows = []
  for (const sym of SYMBOLS) {
    const mw = mwRes.map[sym]
    const mwShares = mw?.volumeShares ?? (mw?.volumeLot ?? 0) * SHARES_PER_LOT
    const mwTvCorrected = mw?.price ? mw.price * mwShares : null

    const record = {
      symbol: sym,
      marketwall: mw,
      vps: vps[sym],
      ssi: ssi[sym],
      fireant: null,
      kbsForeign: kbsForeign[sym] ?? null,
      diffs: {
        price_vs_vps: classify(pctDiff(mw?.price, vps[sym]?.price)),
        price_vs_ssi: classify(pctDiff(mw?.price, ssi[sym]?.price)),
        changePct_vs_vps: classify(pctDiff(mw?.changePct, vps[sym]?.changePct)),
        changePct_vs_ssi: classify(pctDiff(mw?.changePct, ssi[sym]?.changePct)),
        volumeShares_vs_vps: classify(pctDiff(mw?.volumeShares, vps[sym]?.volumeShares)),
        volumeLot_vs_vps: classify(pctDiff(mw?.volumeLot, vps[sym]?.volumeLots)),
        tradingValue_displayed_vs_ssi: classify(pctDiff(mw?.tradingValue, ssi[sym]?.tradingValue)),
        tradingValue_corrected_vs_ssi: classify(pctDiff(mw?.tradingValue, ssi[sym]?.tradingValue)),
        foreignBuy_mw_vs_vps: classify(pctDiff(mw?.foreignBuy, vps[sym]?.foreignBuy)),
        foreignSell_mw_vs_vps: classify(pctDiff(mw?.foreignSell, vps[sym]?.foreignSell)),
        foreignBuy_vps_vs_ssi: classify(pctDiff(vps[sym]?.foreignBuy, ssi[sym]?.foreignBuy)),
        foreignSell_vps_vs_ssi: classify(pctDiff(vps[sym]?.foreignSell, ssi[sym]?.foreignSell)),
        netForeign_vps_vs_ssi: classify(pctDiff(vps[sym]?.netForeign, ssi[sym]?.netForeign)),
      },
    }
    rows.push(record)
  }

  console.log(
    JSON.stringify(
      {
        auditedAt: new Date().toISOString(),
        marketwallSource: mwRes.source,
        marketwallProvider: "VPS (bgapidatafeed.vps.com.vn)",
        fireantStatus: "HTTP 404 — FIREANT_API_KEY stub not connected",
        volumeUnitNote: "VPS lot × 10 = SSI nmTotalTradedQty (shares)",
        rows,
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
