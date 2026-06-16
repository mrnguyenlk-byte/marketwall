export type { NormalizedMarketQuote } from "@/lib/market-types"

/** Currency strength row returned by /api/currency-strength. */
export type CurrencyStrengthRow = {
  currency: string
  strength: number
  change: number
  label: string
}

/** Economic calendar event returned by /api/events. */
export type CalendarEventRow = {
  time: string
  country: string
  event: string
  impact: "high" | "medium" | "low"
  forecast: string
  actual: string
  previous: string
}
