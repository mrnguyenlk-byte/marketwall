export const features = {
  symbolModal: false,
  /** FireAnt-style heatmap tile → stock detail modal (mock data). */
  heatmapDetailModal: true,
  watchlist: true,
  liveClientFetch: true,
  /** Twelve Data WebSocket → SSE relay for live quote ticks. */
  realtimeStream: true,
  /** FX strength section — live via Twelve Data pairs with mock fallback. */
  currencyStrength: true,
  /** Dynamic /markets/[symbol] pages — off until symbol detail flow is stable. */
  dynamicMarketPages: false,
} as const

export type FeatureFlags = typeof features

/** Dev-only client logging. */
export function clientDebug(label: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[BTrading] ${label}`, ...args)
  }
}
