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
}

/** JSON fields returned by OpenAI for daily analysis content. */
export type DailyAnalysisOpenAiContent = {
  title: string
  summary: string
  vnindexAnalysis: string
  goldAnalysis: string
  usMacroSummary: string
  cta: string
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
  }
  fallbackUsed: true
}
