import {
  formatUsEconomicEventsForPrompt,
  getRecentUsEconomicEvents,
} from "@/lib/economic-calendar/us-events"
import { generateMockDailyAnalysis } from "./generator"
import {
  generateOpenAiDailyAnalysis,
  getDailyAnalysisOpenAiModel,
  hasOpenAiApiKey,
} from "./openai-generator"
import { logDailyAnalysisOpenAiError } from "./storage"
import type { DailyAnalysis } from "./types"

export type GenerateDailyAnalysisOptions = {
  vnindexImage?: string
  goldImage?: string
  usMacroDataText?: string
  usEventsText?: string
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

export async function generateDailyAnalysis(
  date: string,
  options: GenerateDailyAnalysisOptions = {},
): Promise<GenerateDailyAnalysisResult> {
  const { vnindexImage, goldImage, usMacroDataText, usEventsText: providedUsEventsText } = options
  const { text: usEventsText, calendarChecked: usEventsCalendarChecked } =
    await resolveUsEventsText(providedUsEventsText)
  const model = getDailyAnalysisOpenAiModel()

  if (!hasOpenAiApiKey()) {
    return {
      article: generateMockDailyAnalysis(date, vnindexImage, goldImage),
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
    )
    return { article, source: "openai", fallbackUsed: false, model }
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
        },
        fallbackUsed: true,
      })
    } catch {
      // Error logging must not block fallback generation.
    }

    return {
      article: generateMockDailyAnalysis(date, vnindexImage, goldImage),
      source: "mock",
      fallbackUsed: true,
      model,
    }
  }
}
