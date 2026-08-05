export const features = {
  symbolModal: false,
  /** FireAnt-style heatmap tile â†’ stock detail modal (mock data). */
  heatmapDetailModal: true,
  watchlist: true,
  liveClientFetch: true,
  /** Twelve Data WebSocket â†’ SSE relay for live quote ticks. */
  // Disabled by default: an SSE relay keeps a Vercel Function open per visitor.
  // Set NEXT_PUBLIC_REALTIME_STREAM_ENABLED=true only when realtime ticks justify the cost.
  realtimeStream: process.env.NEXT_PUBLIC_REALTIME_STREAM_ENABLED === "true",
  /** FX strength section â€” live via Twelve Data pairs with mock fallback. */
  currencyStrength: true,
  /** Dynamic /markets/[symbol] pages â€” off until symbol detail flow is stable. */
  dynamicMarketPages: false,
} as const

export type FeatureFlags = typeof features

/** Dev-only client logging. */
export function clientDebug(label: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[BTrading] ${label}`, ...args)
  }
}

