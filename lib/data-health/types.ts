export type SourceStatus =
  | "live"
  | "mock"
  | "cache"
  | "partial"
  | "unavailable"
  | "stale"
  | "eod"

export type DataHealthSection = {
  provider: string
  /** Ordered fallback chain when multiple upstreams apply. */
  providers?: string[]
  lastUpdatedAt: string | null
  cacheTtlMs: number
  itemCount: number
  coverageCount: number
  sourceStatus: SourceStatus
  warnings: string[]
  details?: Record<string, unknown>
}

export type DataHealthReport = {
  generatedAt: string
  vietnam: DataHealthSection
  foreignFlow: DataHealthSection
  proprietaryFlow: DataHealthSection
  us: DataHealthSection
  crypto: DataHealthSection
  global: DataHealthSection
}
