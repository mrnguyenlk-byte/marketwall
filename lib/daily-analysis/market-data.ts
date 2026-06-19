import "server-only"

import { getData as getGlobalData } from "@/lib/providers/global-market-provider"
import { getData as getVietnamData } from "@/lib/providers/vietnam-market-provider"

export type DailyAnalysisMarketQuote = {
  value: number | null
  change: number | null
  changePercent: number | null
  source: string
}

export type DailyAnalysisMarketData = {
  vnindex: DailyAnalysisMarketQuote
  gold: DailyAnalysisMarketQuote
}

export const MARKET_DATA_UPDATING_MESSAGE = "Dữ liệu điểm số đang được cập nhật."

const EMPTY_QUOTE: DailyAnalysisMarketQuote = {
  value: null,
  change: null,
  changePercent: null,
  source: "unavailable",
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function formatNumber(value: number, decimals: number): string {
  return round(value, decimals).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatSignedNumber(value: number, decimals: number): string {
  const formatted = formatNumber(Math.abs(value), decimals)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

function formatSignedPercent(value: number): string {
  return `${formatSignedNumber(value, 2)}%`
}

/** Fetch live VN-Index and Gold quotes for daily analysis generation. */
export async function fetchDailyAnalysisMarketData(): Promise<DailyAnalysisMarketData> {
  const [vietnam, global] = await Promise.all([
    getVietnamData().catch(() => null),
    getGlobalData().catch(() => null),
  ])

  const vnIndex = vietnam?.indices.find((row) => row.symbol.toUpperCase() === "VNINDEX")
  const goldQuote = global?.quotes.find((row) => row.symbol.toUpperCase() === "GOLD")

  const vnindex: DailyAnalysisMarketQuote = vnIndex
    ? {
        value: vnIndex.price,
        change: vnIndex.change,
        changePercent: vnIndex.changePercent,
        source:
          vietnam?.source === "live"
            ? vietnam.heatmapProvider ?? "vietnam-markets"
            : vnIndex.source === "live"
              ? "vietnam-markets"
              : "mock",
      }
    : { ...EMPTY_QUOTE }

  const gold: DailyAnalysisMarketQuote = goldQuote
    ? {
        value: goldQuote.price,
        change: goldQuote.change,
        changePercent: goldQuote.changePercent,
        source: goldQuote.source === "live" ? "global-markets" : "mock",
      }
    : { ...EMPTY_QUOTE }

  return { vnindex, gold }
}

export function formatVnindexMarketLine(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return MARKET_DATA_UPDATING_MESSAGE
  const value = formatNumber(quote.value, 1)
  const change =
    quote.change != null ? `${formatSignedNumber(quote.change, 1)} điểm` : "— điểm"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `${value} | ${change} | ${changePercent}`
}

export function formatGoldMarketLine(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return MARKET_DATA_UPDATING_MESSAGE
  const value = formatNumber(quote.value, 2)
  const change = quote.change != null ? `${formatSignedNumber(quote.change, 2)} USD` : "— USD"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `${value} USD/oz | ${change} | ${changePercent}`
}

/** Prompt sentence for VN-Index numeric injection. */
export function vnindexPromptSentence(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return MARKET_DATA_UPDATING_MESSAGE
  const value = formatNumber(quote.value, 1)
  const change =
    quote.change != null ? formatSignedNumber(quote.change, 1) : "—"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `VN-Index hiện ở khoảng ${value} điểm, thay đổi ${change} điểm (${changePercent}).`
}

/** Prompt sentence for Gold numeric injection. */
export function goldPromptSentence(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return MARKET_DATA_UPDATING_MESSAGE
  const value = formatNumber(quote.value, 2)
  const change =
    quote.change != null ? formatSignedNumber(quote.change, 2) : "—"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `XAUUSD hiện quanh ${value} USD/oz, thay đổi ${change} USD (${changePercent}).`
}

export function buildMarketDataPromptSection(marketData: DailyAnalysisMarketData): string {
  return [
    "Số liệu thị trường thời điểm hiện tại (BẮT BUỘC dùng khi viết vnindexAnalysis và goldAnalysis):",
    `- VN-Index (${marketData.vnindex.source}): ${vnindexPromptSentence(marketData.vnindex)}`,
    `- Vàng XAUUSD (${marketData.gold.source}): ${goldPromptSentence(marketData.gold)}`,
    "Khi số liệu là null hoặc thông báo cập nhật, ghi: \"Dữ liệu điểm số đang được cập nhật.\"",
  ].join("\n")
}
