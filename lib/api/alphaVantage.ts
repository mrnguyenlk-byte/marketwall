import "server-only"

/**
 * @deprecated Alpha Vantage is not used in production (free tier unsuitable for 28-pair FX).
 * Retained for future evaluation only. Use `lib/forex/pairs-provider.ts` (Twelve Data primary).
 */
export {
  getForexPairsForCurrencyStrength,
  isAlphaVantageConfigured,
} from "@/lib/alphavantage/client"
export type { FxPairQuote } from "@/lib/forex/types"
