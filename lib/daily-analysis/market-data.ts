import "server-only"

import { getData as getGlobalData } from "@/lib/providers/global-market-provider"
import { getData as getVietnamData } from "@/lib/providers/vietnam-market-provider"

export type AmiBrokerOcrRow = {
  symbol: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  changePercent: number | null
}

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

export const OCR_AMIBROKER_UPDATING_MESSAGE =
  "Dữ liệu điểm số đang được cập nhật từ biểu đồ AmiBroker."

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

/** Previous session close implied by current close and header changePercent. */
export function computePreviousClose(close: number, changePercent: number): number {
  const factor = 1 + changePercent / 100
  if (!Number.isFinite(factor) || factor === 0) return close
  return close / factor
}

/** Session point change from OCR close and changePercent (not intraday open-close). */
export function computePointChange(close: number, changePercent: number): number {
  const previousClose = computePreviousClose(close, changePercent)
  return round(close - previousClose, 4)
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

function updatingMessageForQuote(quote: DailyAnalysisMarketQuote): string {
  if (quote.source === "ami-broker-ocr") return OCR_AMIBROKER_UPDATING_MESSAGE
  return MARKET_DATA_UPDATING_MESSAGE
}

function ocrRowToQuote(row: AmiBrokerOcrRow | null): DailyAnalysisMarketQuote {
  if (!row || row.close == null) {
    return { ...EMPTY_QUOTE, source: "ami-broker-ocr" }
  }

  const change =
    row.changePercent != null
      ? computePointChange(row.close, row.changePercent)
      : null

  return {
    value: row.close,
    change,
    changePercent: row.changePercent,
    source: "ami-broker-ocr",
  }
}

/** Build daily analysis market snapshot from AmiBroker OCR rows only. */
export function ocrToMarketData(ocr: {
  vnindex: AmiBrokerOcrRow | null
  gold: AmiBrokerOcrRow | null
}): DailyAnalysisMarketData {
  return {
    vnindex: ocrRowToQuote(ocr.vnindex),
    gold: ocrRowToQuote(ocr.gold),
  }
}

export function emptyOcrMarketData(): DailyAnalysisMarketData {
  return ocrToMarketData({ vnindex: null, gold: null })
}

export function formatVnindexMarketLine(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return updatingMessageForQuote(quote)
  const value = formatNumber(quote.value, 2)
  const changeDecimals = quote.source === "ami-broker-ocr" ? 2 : 1
  const change =
    quote.change != null
      ? `${formatSignedNumber(quote.change, changeDecimals)} điểm`
      : "— điểm"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `${value} | ${change} | ${changePercent}`
}

export function formatGoldMarketLine(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return updatingMessageForQuote(quote)
  const value = formatNumber(quote.value, 2)
  const change = quote.change != null ? `${formatSignedNumber(quote.change, 2)} USD` : "— USD"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `${value} USD/oz | ${change} | ${changePercent}`
}

/** Prompt sentence for VN-Index numeric injection. */
export function vnindexPromptSentence(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return updatingMessageForQuote(quote)
  const value = formatNumber(quote.value, 2)
  const changeDecimals = quote.source === "ami-broker-ocr" ? 2 : 1
  const change =
    quote.change != null ? formatSignedNumber(quote.change, changeDecimals) : "—"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `VN-Index hiện ở khoảng ${value} điểm, thay đổi ${change} điểm (${changePercent}).`
}

/** Prompt sentence for Gold numeric injection. */
export function goldPromptSentence(quote: DailyAnalysisMarketQuote): string {
  if (quote.value == null) return updatingMessageForQuote(quote)
  const value = formatNumber(quote.value, 2)
  const change =
    quote.change != null ? formatSignedNumber(quote.change, 2) : "—"
  const changePercent =
    quote.changePercent != null ? formatSignedPercent(quote.changePercent) : "—"
  return `XAUUSD hiện quanh ${value} USD/oz, thay đổi ${change} USD (${changePercent}).`
}

export function buildMarketDataPromptSection(marketData: DailyAnalysisMarketData): string {
  const updatingHint =
    marketData.vnindex.source === "ami-broker-ocr" ||
    marketData.gold.source === "ami-broker-ocr"
      ? `Khi số liệu là null hoặc không đọc được từ biểu đồ AmiBroker, ghi: "${OCR_AMIBROKER_UPDATING_MESSAGE}"`
      : `Khi số liệu là null hoặc thông báo cập nhật, ghi: "${MARKET_DATA_UPDATING_MESSAGE}"`

  return [
    "Số liệu thị trường đọc từ header biểu đồ AmiBroker (BẮT BUỘC dùng khi viết vnindexAnalysis và goldAnalysis — KHÔNG bịa số):",
    `- VN-Index (${marketData.vnindex.source}): ${vnindexPromptSentence(marketData.vnindex)}`,
    `- Vàng XAUUSD (${marketData.gold.source}): ${goldPromptSentence(marketData.gold)}`,
    updatingHint,
  ].join("\n")
}

const UPDATING_MESSAGES = [MARKET_DATA_UPDATING_MESSAGE, OCR_AMIBROKER_UPDATING_MESSAGE]

const VNINDEX_OPENING_PATTERN =
  /^VN-Index hiện ở khoảng .+? điểm, thay đổi .+? điểm \([^)]+\)\.\s*/i
const GOLD_OPENING_PATTERN =
  /^XAUUSD hiện quanh .+? USD\/oz, thay đổi .+? USD \([^)]+\)\.\s*/i

function stripLeadingUpdatingMessage(text: string): string {
  let body = text.trim()
  for (const message of UPDATING_MESSAGES) {
    if (body.startsWith(message)) {
      body = body.slice(message.length).trim()
      break
    }
  }
  return body
}

/** Ensure analysis sections open with OCR-derived market sentences. */
export function injectOcrOpeningSentence(
  analysis: string,
  sentence: string,
  ocrSucceeded: boolean,
): string {
  if (!ocrSucceeded) {
    const body = stripLeadingUpdatingMessage(analysis)
    return body
      ? `${OCR_AMIBROKER_UPDATING_MESSAGE} ${body}`.trim()
      : OCR_AMIBROKER_UPDATING_MESSAGE
  }

  const openingPattern = openingPatternForSentence(sentence)
  const body = stripLeadingUpdatingMessage(analysis).replace(openingPattern, "")
  if (body.startsWith(sentence)) return body
  return body ? `${sentence} ${body}`.trim() : sentence
}

function openingPatternForSentence(sentence: string): RegExp {
  if (sentence.startsWith("VN-Index")) return VNINDEX_OPENING_PATTERN
  if (sentence.startsWith("XAUUSD")) return GOLD_OPENING_PATTERN
  return /^/
}

export function applyOcrToAnalysisSections(
  content: { vnindexAnalysis: string; goldAnalysis: string },
  marketData: DailyAnalysisMarketData,
): { vnindexAnalysis: string; goldAnalysis: string } {
  return {
    vnindexAnalysis: injectOcrOpeningSentence(
      content.vnindexAnalysis,
      vnindexPromptSentence(marketData.vnindex),
      marketData.vnindex.value != null,
    ),
    goldAnalysis: injectOcrOpeningSentence(
      content.goldAnalysis,
      goldPromptSentence(marketData.gold),
      marketData.gold.value != null,
    ),
  }
}

export type InstrumentArticleValues = {
  close: number | null
  previousClose: number | null
  pointChange: number | null
  changePercent: number | null
}

export function quoteToArticleValues(quote: DailyAnalysisMarketQuote): InstrumentArticleValues {
  const close = quote.value
  const changePercent = quote.changePercent
  const previousClose =
    close != null && changePercent != null
      ? round(computePreviousClose(close, changePercent), 4)
      : null

  return {
    close,
    previousClose,
    pointChange: quote.change,
    changePercent,
  }
}

export function buildArticleValuesSnapshot(marketData: DailyAnalysisMarketData): {
  vnindex: InstrumentArticleValues
  gold: InstrumentArticleValues
} {
  return {
    vnindex: quoteToArticleValues(marketData.vnindex),
    gold: quoteToArticleValues(marketData.gold),
  }
}
