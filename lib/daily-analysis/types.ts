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
}
