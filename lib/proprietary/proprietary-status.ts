import "server-only"

/** Vietnam trading session date (ICT) as YYYY-MM-DD. */
export function vietnamTodayIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
}

export type ProprietarySource = "cafef-eod" | "gtgd-proxy"

export type ProprietaryHeatmapStatus = {
  proprietarySource: ProprietarySource
  lastUpdatedAt: string | null
  coverageCount: number
  /** True when DB/CafeF data exists but is not from today's VN session. */
  isStale: boolean
}

export const EMPTY_PROPRIETARY_STATUS: ProprietaryHeatmapStatus = {
  proprietarySource: "gtgd-proxy",
  lastUpdatedAt: null,
  coverageCount: 0,
  isStale: false,
}

export function resolveProprietaryHeatmapStatus(input: {
  overlaySize: number
  latestSessionDate: string | null
  fetchedAt?: string | null
}): ProprietaryHeatmapStatus {
  const today = vietnamTodayIso()
  const hasData = input.overlaySize > 0
  const isToday = input.latestSessionDate === today

  if (hasData && isToday) {
    return {
      proprietarySource: "cafef-eod",
      lastUpdatedAt: input.latestSessionDate ?? input.fetchedAt ?? null,
      coverageCount: input.overlaySize,
      isStale: false,
    }
  }

  if (hasData && input.latestSessionDate) {
    return {
      proprietarySource: "gtgd-proxy",
      lastUpdatedAt: input.latestSessionDate,
      coverageCount: input.overlaySize,
      isStale: true,
    }
  }

  return {
    ...EMPTY_PROPRIETARY_STATUS,
    lastUpdatedAt: input.fetchedAt ?? null,
  }
}
