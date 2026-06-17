import type { Bi } from "@/lib/market-utils"
import type { HeatmapAsset, MarketAsset, MarketType } from "@/types/market"

function biFromName(name: string): Bi {
  return { en: name, vi: name }
}

/** Convert API heatmap rows into MarketAsset tiles for MarketHeatmap. */
export function heatmapRowsToMarketAssets(
  rows: HeatmapAsset[],
  marketType: MarketType,
): MarketAsset[] {
  return rows.map((row) => {
    const change = row.price > 0 ? (row.price * row.changePercent) / 100 : 0
    const prevClose = row.price > 0 ? row.price - change : 0
    const exchange =
      marketType === "vn" ? "HOSE" : marketType === "us" ? "US" : "CRYPTO"
    const tradingViewSymbol =
      marketType === "crypto"
        ? `BINANCE:${row.symbol}USDT`
        : marketType === "us"
          ? `NASDAQ:${row.symbol}`
          : `HOSE:${row.symbol}`

    return {
      symbol: row.symbol,
      name: biFromName(row.name),
      exchange,
      marketType,
      price: row.price,
      change,
      changePercent: row.changePercent,
      marketCap: row.marketCap,
      volume: row.volume,
      ...(marketType === "vn"
        ? {
            volumeLot: row.volumeLot ?? row.volume,
            volumeShares: row.volumeShares,
            tradingValue: row.tradingValue,
            foreignBuy: row.foreignBuy,
            foreignSell: row.foreignSell,
            foreignNet: row.foreignNet,
            foreignBuyValue: row.foreignBuyValue,
            foreignSellValue: row.foreignSellValue,
            foreignNetValue: row.foreignNetValue,
            proprietaryBuyValue: row.proprietaryBuyValue,
            proprietarySellValue: row.proprietarySellValue,
            proprietaryNetValue: row.proprietaryNetValue,
            proprietaryTradingValue: row.proprietaryTradingValue,
          }
        : {}),
      sector: row.sector,
      industry: row.industry,
      currency: marketType === "vn" ? "VND" : "USD",
      lastUpdated: new Date().toISOString(),
      tradingViewSymbol,
      open: prevClose,
      high: row.price,
      low: row.price,
      close: row.price,
      prevClose,
      avgVolume: row.volume,
      profile: biFromName(row.name),
      shareholders: [],
      dividends: [],
      financials: {
        revenue: 0,
        netIncome: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        roe: 0,
        roa: 0,
      },
      historicalPrices: [],
    }
  })
}
