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
}

export type GenerateDailyAnalysisResult = {
  article: DailyAnalysis
  source: "openai" | "mock"
  fallbackUsed: boolean
  model?: string
}

export async function generateDailyAnalysis(
  date: string,
  options: GenerateDailyAnalysisOptions = {},
): Promise<GenerateDailyAnalysisResult> {
  const { vnindexImage, goldImage, usMacroDataText } = options
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
