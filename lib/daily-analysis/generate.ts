import {
  formatUsEconomicEventsForPrompt,
  getRecentUsEconomicEvents,
} from "@/lib/economic-calendar/us-events"
import { generateMockDailyAnalysis } from "./generator"
import {
  applyOcrToAnalysisSections,
  emptyOcrMarketData,
  ocrToMarketData,
  type DailyAnalysisMarketData,
} from "./market-data"
import {
  generateOpenAiDailyAnalysis,
  getDailyAnalysisOpenAiModel,
  hasOpenAiApiKey,
} from "./openai-generator"
import type { DailyAnalysisOcrResult } from "./ocr-chart-header"
import { logDailyAnalysisOpenAiError } from "./storage"
import type { DailyAnalysis } from "./types"

export type GenerateDailyAnalysisOptions = {
  vnindexImage?: string
  goldImage?: string
  usMacroDataText?: string
  usEventsText?: string
  ocrData?: DailyAnalysisOcrResult | null
}

export type GenerateDailyAnalysisResult = {
  article: DailyAnalysis
  source: "openai" | "mock"
  fallbackUsed: boolean
  model?: string
}

async function resolveUsEventsText(
  provided?: string,
): Promise<{ text?: string; calendarChecked: boolean }> {
  if (provided?.trim()) {
    return { text: provided.trim(), calendarChecked: false }
  }

  const events = await getRecentUsEconomicEvents({ hours: 24 })
  const formatted = formatUsEconomicEventsForPrompt(events)

  return {
    text: formatted || undefined,
    calendarChecked: true,
  }
}

function buildMarketDataFromOcr(
  ocrData?: DailyAnalysisOcrResult | null,
): DailyAnalysisMarketData {
  if (!ocrData) return emptyOcrMarketData()
  return ocrToMarketData({
    vnindex: ocrData.vnindex,
    gold: ocrData.gold,
  })
}

function attachOcrFields(
  article: DailyAnalysis,
  ocrData: DailyAnalysisOcrResult | null | undefined,
  marketData: DailyAnalysisMarketData,
): DailyAnalysis {
  const withOcrAnalysis = applyOcrToAnalysisSections(article, marketData)
  return {
    ...article,
    ...withOcrAnalysis,
    marketData,
    ...(ocrData
      ? {
          ocrData: {
            vnindex: ocrData.vnindex,
            gold: ocrData.gold,
          },
        }
      : {}),
  }
}

export async function generateDailyAnalysis(
  date: string,
  options: GenerateDailyAnalysisOptions = {},
): Promise<GenerateDailyAnalysisResult> {
  const {
    vnindexImage,
    goldImage,
    usMacroDataText,
    usEventsText: providedUsEventsText,
    ocrData,
  } = options
  const { text: usEventsText, calendarChecked: usEventsCalendarChecked } =
    await resolveUsEventsText(providedUsEventsText)
  const marketData = buildMarketDataFromOcr(ocrData)
  const model = getDailyAnalysisOpenAiModel()

  if (!hasOpenAiApiKey()) {
    return {
      article: attachOcrFields(
        generateMockDailyAnalysis(date, vnindexImage, goldImage, marketData),
        ocrData,
        marketData,
      ),
      source: "mock",
      fallbackUsed: true,
    }
  }

  try {
    const article = await generateOpenAiDailyAnalysis(
      date,
      vnindexImage,
      goldImage,
      usMacroDataText,
      usEventsText,
      usEventsCalendarChecked,
      marketData,
      ocrData,
    )
    return {
      article: attachOcrFields(article, ocrData, marketData),
      source: "openai",
      fallbackUsed: false,
      model,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    try {
      await logDailyAnalysisOpenAiError(date, {
        timestamp: new Date().toISOString(),
        error: message,
        requestMeta: {
          date,
          model,
          vnindexImage,
          goldImage,
          hasUsMacroData: Boolean(usMacroDataText?.trim()),
          hasUsEvents: Boolean(usEventsText?.trim()),
          hasMarketData: Boolean(
            marketData.vnindex.value != null || marketData.gold.value != null,
          ),
        },
        fallbackUsed: true,
      })
    } catch {
      // Error logging must not block fallback generation.
    }

    return {
      article: attachOcrFields(
        generateMockDailyAnalysis(date, vnindexImage, goldImage, marketData),
        ocrData,
        marketData,
      ),
      source: "mock",
      fallbackUsed: true,
      model,
    }
  }
}
