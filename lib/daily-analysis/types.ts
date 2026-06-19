import type { DailyAnalysisMarketData } from "./market-data"

export type DailyAnalysisPublishStatus = "draft" | "published" | "pending"

/** Persisted daily analysis article (automation backend — distinct from UI card mock types). */
export type DailyAnalysis = {
  date: string
  title: string
  slug: string
  summary: string
  vnindexAnalysis: string
  goldAnalysis: string
  usMacroSummary: string
  cta: string
  vnindexImage: string
  goldImage: string
  webUrl: string
  publishStatus: DailyAnalysisPublishStatus
  createdAt: string
  updatedAt: string
  telegramCaption?: string
  facebookCaption?: string
  zaloMessage?: string
  telegramStatus?: "sent" | "failed" | "skipped"
  telegramMessageId?: number
  facebookStatus?: "sent" | "failed" | "skipped"
  facebookPostId?: string
  /** Live market snapshot at generation time (VN-Index + Gold). */
  marketData?: DailyAnalysisMarketData
}

/** JSON fields returned by OpenAI for daily analysis content. */
export type DailyAnalysisOpenAiContent = {
  title: string
  summary: string
  vnindexAnalysis: string
  goldAnalysis: string
  usMacroSummary: string
  /** Section 4 — what to watch next (disclaimer appended when mapped to `cta`). */
  watchNext: string
  telegramCaption: string
  facebookCaption: string
  zaloMessage: string
}

export type DailyAnalysisOpenAiErrorLog = {
  timestamp: string
  error: string
  requestMeta: {
    date: string
    model: string
    vnindexImage?: string
    goldImage?: string
    hasUsMacroData?: boolean
    hasUsEvents?: boolean
    hasMarketData?: boolean
  }
  fallbackUsed: true
}
