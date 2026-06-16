/** Client-safe realtime SSE payload types. */

export type RealtimeChannel =
  | "overview"
  | "currency-strength"
  | "heatmap-us"
  | "heatmap-crypto"

export type RealtimeQuoteEvent = {
  type: "quote"
  /** Dashboard display symbol (e.g. GOLD, EUR/USD, AAPL). */
  symbol: string
  apiSymbol: string
  price: number
  changePercent: number
  updatedAt: string
}

export type RealtimeStrengthItem = {
  currency: string
  strength: number
  change: number
  label: string
}

export type RealtimeStrengthEvent = {
  type: "currency-strength"
  items: RealtimeStrengthItem[]
  updatedAt: string
}

export type RealtimeStatusEvent = {
  type: "status"
  connected: boolean
  fallback: boolean
  message?: string
}

export type RealtimeEvent = RealtimeQuoteEvent | RealtimeStrengthEvent | RealtimeStatusEvent

export const REALTIME_CHANNELS: RealtimeChannel[] = [
  "overview",
  "currency-strength",
  "heatmap-us",
  "heatmap-crypto",
]
