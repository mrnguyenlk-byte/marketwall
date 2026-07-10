import {
  formatUsEconomicEventsForPrompt,
  getUsMacroEventsForArticle,
  type UsEconomicEvent,
} from "@/lib/economic-calendar/us-events"
import { buildUsMacroSummary } from "@/lib/economic-calendar/us-macro-summary"
import { generateMockDailyAnalysis } from "./generator"
import {
  emptyOcrMarketData,
  ocrToMarketData,
  type DailyAnalysisMarketData,
} from "./market-data"
import {
  generateOpenAiDailyAnalysis,
  getDailyAnalysisOpenAiModel,
  hasOpenAiApiKey,
} from "./openai-generator"
import { ensureArticleUsesOcrValues } from "./ocr-article-sync"
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

async function resolveUsMacroContext(
  currentDate: string,
  providedUsEventsText?: string,
): Promise<{
  events: UsEconomicEvent[]
  usMacroSummary: string
  usEventsText?: string
  calendarChecked: boolean
}> {
  if (providedUsEventsText?.trim()) {
    return {
      events: [],
      usMacroSummary: buildUsMacroSummary([]),
      usEventsText: providedUsEventsText.trim(),
      calendarChecked: false,
    }
  }

  const events = await getUsMacroEventsForArticle(currentDate)
  const formatted = formatUsEconomicEventsForPrompt(events)

  return {
    events,
    usMacroSummary: buildUsMacroSummary(events),
    usEventsText: formatted || undefined,
    calendarChecked: true,
  }
}

function applyUsMacroSummary(
  article: DailyAnalysis,
  usMacroSummary: string,
): DailyAnalysis {
  return { ...article, usMacroSummary }
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
  return ensureArticleUsesOcrValues(
    {
      ...article,
      marketData,
      ...(ocrData
        ? {
            ocrData: {
              vnindex: ocrData.vnindex,
              gold: ocrData.gold,
            },
          }
        : {}),
    },
    ocrData ?? null,
  )
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
  const {
    usMacroSummary,
    usEventsText,
    calendarChecked: usEventsCalendarChecked,
  } = await resolveUsMacroContext(date, providedUsEventsText)
  const marketData = buildMarketDataFromOcr(ocrData)
  const model = getDailyAnalysisOpenAiModel()

  if (!hasOpenAiApiKey()) {
    return {
      article: applyUsMacroSummary(
        attachOcrFields(
          generateMockDailyAnalysis(date, vnindexImage, goldImage, marketData),
          ocrData,
          marketData,
        ),
        usMacroSummary,
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
      article: applyUsMacroSummary(
        attachOcrFields(article, ocrData, marketData),
        usMacroSummary,
      ),
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
      article: applyUsMacroSummary(
        attachOcrFields(
          generateMockDailyAnalysis(date, vnindexImage, goldImage, marketData),
          ocrData,
          marketData,
        ),
        usMacroSummary,
      ),
      source: "mock",
      fallbackUsed: true,
      model,
    }
  }
}
