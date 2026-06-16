import {
  CRYPTO_REALTIME_SYMBOLS,
  US_REALTIME_TICKERS,
} from "@/config/heatmap-symbols"
import {
  CURRENCY_STRENGTH_PAIRS,
  getOverviewApiSymbols,
  OVERVIEW_SYMBOLS,
} from "@/config/market-symbols"

/** Twelve Data API symbols subscribed per realtime channel. */
export const CHANNEL_API_SYMBOLS: Record<
  import("./types").RealtimeChannel,
  readonly string[]
> = {
  overview: getOverviewApiSymbols(),
  "currency-strength": CURRENCY_STRENGTH_PAIRS,
  "heatmap-us": US_REALTIME_TICKERS,
  "heatmap-crypto": CRYPTO_REALTIME_SYMBOLS,
}

const apiToDisplay = new Map<string, string>()
for (const def of OVERVIEW_SYMBOLS) {
  apiToDisplay.set(def.apiSymbol, def.displaySymbol)
  apiToDisplay.set(def.apiSymbol.toUpperCase(), def.displaySymbol)
}

/** Map Twelve Data API symbol to dashboard display symbol. */
export function apiSymbolToDisplay(apiSymbol: string): string {
  const normalized = apiSymbol.trim()
  return (
    apiToDisplay.get(normalized) ??
    apiToDisplay.get(normalized.toUpperCase()) ??
    normalized.replace("/", "")
  )
}

/** Union of all Twelve Data symbols for requested channels. */
export function symbolsForChannels(
  channels: import("./types").RealtimeChannel[],
): string[] {
  const set = new Set<string>()
  for (const channel of channels) {
    for (const symbol of CHANNEL_API_SYMBOLS[channel]) {
      set.add(symbol)
    }
  }
  return [...set]
}
