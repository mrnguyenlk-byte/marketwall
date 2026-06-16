export const features = {
  symbolModal: false,
  /** FireAnt-style heatmap tile → stock detail modal (mock data). */
  heatmapDetailModal: true,
  watchlist: false,
  liveClientFetch: true,
  /** Hidden until a reliable public FX strength feed is wired. */
  currencyStrength: false,
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
