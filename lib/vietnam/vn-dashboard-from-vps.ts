import type { VietnamHeatmapStock } from "@/lib/providers/vietnam-market-provider"
import type { VietnamDashboardRow } from "@/lib/providers/vietnam-market-provider"
import type { VietnamMarketData } from "@/lib/providers/vietnam-market-provider"
import { enrichVnForeignFlow, enrichVnQuoteVolume } from "@/lib/vietnam/vn-quote-fields"

const LEADERBOARD_LIMIT = 18

export const VN_LEADERBOARD_LIMIT = LEADERBOARD_LIMIT

function flattenLiveStocks(stocks: VietnamMarketData["heatmapStocks"]): VietnamHeatmapStock[] {
  return [...stocks.hose, ...stocks.hnx, ...stocks.upcom].filter((s) => s.price > 0)
}

function stockToDashboardRow(stock: VietnamHeatmapStock, rank: number): VietnamDashboardRow {
  const vol = enrichVnQuoteVolume(stock.price, stock.volume)
  const foreign =
    stock.foreignBuy != null || stock.foreignSell != null
      ? enrichVnForeignFlow(stock.price, stock.foreignBuy ?? 0, stock.foreignSell ?? 0)
      : null

  return {
    rank,
    symbol: stock.symbol,
    exchange: stock.exchange === "hose" ? "HOSE" : stock.exchange === "hnx" ? "HNX" : "UPCOM",
    price: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
    volume: vol.volumeShares,
    volumeLot: vol.volumeLot,
    volumeShares: vol.volumeShares,
    volumeUnit: vol.volumeUnit,
    value: stock.value > 0 ? stock.value : vol.tradingValue,
    foreignBuy: foreign?.foreignBuy ?? stock.foreignBuy,
    foreignSell: foreign?.foreignSell ?? stock.foreignSell,
  }
}

/** Build VN dashboard leaderboards from VPS heatmap universe (full foreign coverage). */
export function buildDashboardFromHeatmapStocks(
  stocks: VietnamMarketData["heatmapStocks"],
  updatedAt: string,
  liveSymbols?: Set<string>,
): VietnamMarketData["dashboard"] {
  const all = flattenLiveStocks(stocks).filter(
    (s) => !liveSymbols || liveSymbols.has(s.symbol.toUpperCase()),
  )

  const topVolume = [...all]
    .sort((a, b) => {
      const av = enrichVnQuoteVolume(a.price, a.volume).volumeShares
      const bv = enrichVnQuoteVolume(b.price, b.volume).volumeShares
      return bv - av
    })
    .slice(0, LEADERBOARD_LIMIT)
    .map((s, i) => stockToDashboardRow(s, i + 1))

  const topValue = [...all]
    .sort((a, b) => {
      const av = a.value > 0 ? a.value : enrichVnQuoteVolume(a.price, a.volume).tradingValue
      const bv = b.value > 0 ? b.value : enrichVnQuoteVolume(b.price, b.volume).tradingValue
      return bv - av
    })
    .slice(0, LEADERBOARD_LIMIT)
    .map((s, i) => stockToDashboardRow(s, i + 1))

  const topForeignBuy = [...all]
    .filter((s) => (s.foreignBuy ?? 0) > 0)
    .sort((a, b) => (b.foreignBuy ?? 0) - (a.foreignBuy ?? 0))
    .slice(0, LEADERBOARD_LIMIT)
    .map((s, i) => stockToDashboardRow(s, i + 1))

  const topForeignSell = [...all]
    .filter((s) => (s.foreignSell ?? 0) > 0)
    .sort((a, b) => (b.foreignSell ?? 0) - (a.foreignSell ?? 0))
    .slice(0, LEADERBOARD_LIMIT)
    .map((s, i) => stockToDashboardRow(s, i + 1))

  return {
    source: "live",
    topVolume,
    topValue,
    topForeignBuy,
    topForeignSell,
    updatedAt,
  }
}

export function vnHeatmapStockToAsset(stock: VietnamHeatmapStock): import("@/types/market").HeatmapAsset {
  const vol = enrichVnQuoteVolume(stock.price, stock.volume)
  const tradingValue = stock.value > 0 ? stock.value : vol.tradingValue
  const foreign =
    stock.foreignBuy != null || stock.foreignSell != null
      ? enrichVnForeignFlow(stock.price, stock.foreignBuy ?? 0, stock.foreignSell ?? 0)
      : null

  return {
    symbol: stock.symbol,
    name: stock.name.en,
    price: stock.price,
    referencePrice: stock.referencePrice,
    changePercent: stock.changePercent,
    volume: vol.volumeLot,
    volumeLot: vol.volumeLot,
    volumeShares: vol.volumeShares,
    tradingValue,
    volumeUnit: vol.volumeUnit,
    sector: stock.sector,
    marketCap: stock.marketCap,
    foreignBuy: foreign?.foreignBuy,
    foreignSell: foreign?.foreignSell,
    foreignNet: foreign?.foreignNet,
    foreignBuyValue: foreign?.foreignBuyValue,
    foreignSellValue: foreign?.foreignSellValue,
    foreignNetValue: foreign?.foreignNetValue,
  }
}
