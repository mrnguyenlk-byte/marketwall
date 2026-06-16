import type { Bi } from "@/lib/market-utils"

/** Currencies tracked by the strength engine (no VND). */
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "NZD",
  "CAD",
  "CHF",
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]

/** FX pairs used to derive cross-currency strength (28-pair model). */
export const STRENGTH_PAIRS = [
  "EURUSD",
  "GBPUSD",
  "AUDUSD",
  "NZDUSD",
  "USDJPY",
  "USDCHF",
  "USDCAD",
  "EURGBP",
  "EURJPY",
  "EURAUD",
  "EURNZD",
  "EURCHF",
  "EURCAD",
  "GBPJPY",
  "GBPAUD",
  "GBPNZD",
  "GBPCHF",
  "GBPCAD",
  "AUDJPY",
  "AUDNZD",
  "AUDCHF",
  "AUDCAD",
  "NZDJPY",
  "NZDCHF",
  "NZDCAD",
  "CHFJPY",
  "CADJPY",
  "CADCHF",
] as const

export type StrengthPairSymbol = (typeof STRENGTH_PAIRS)[number]

/** Full 28-pair model — ideal coverage. */
export const IDEAL_STRENGTH_PAIRS = 28
/** Minimum pair count for valid (partial) coverage. */
export const VALID_STRENGTH_PAIRS = 12
/** Minimum pair count for degraded but displayable coverage. */
export const DEGRADED_STRENGTH_PAIRS = 8

/** @deprecated Use resolveStrengthCoverage() tiers instead. */
export const MIN_STRENGTH_PAIRS = VALID_STRENGTH_PAIRS
/** @deprecated Per-currency gate removed — total pair count drives coverage. */
export const MIN_PAIRS_PER_CURRENCY = 2

export type StrengthCoverage = "ideal" | "valid" | "degraded" | "unavailable"

export type PairLeg = {
  base: CurrencyCode
  quote: CurrencyCode
}

/** Static pair definitions — base/quote follows standard FX quoting. */
export const PAIR_LEGS: Record<StrengthPairSymbol, PairLeg> = {
  EURUSD: { base: "EUR", quote: "USD" },
  GBPUSD: { base: "GBP", quote: "USD" },
  AUDUSD: { base: "AUD", quote: "USD" },
  NZDUSD: { base: "NZD", quote: "USD" },
  USDJPY: { base: "USD", quote: "JPY" },
  USDCHF: { base: "USD", quote: "CHF" },
  USDCAD: { base: "USD", quote: "CAD" },
  EURGBP: { base: "EUR", quote: "GBP" },
  EURJPY: { base: "EUR", quote: "JPY" },
  EURAUD: { base: "EUR", quote: "AUD" },
  EURNZD: { base: "EUR", quote: "NZD" },
  EURCHF: { base: "EUR", quote: "CHF" },
  EURCAD: { base: "EUR", quote: "CAD" },
  GBPJPY: { base: "GBP", quote: "JPY" },
  GBPAUD: { base: "GBP", quote: "AUD" },
  GBPNZD: { base: "GBP", quote: "NZD" },
  GBPCHF: { base: "GBP", quote: "CHF" },
  GBPCAD: { base: "GBP", quote: "CAD" },
  AUDJPY: { base: "AUD", quote: "JPY" },
  AUDNZD: { base: "AUD", quote: "NZD" },
  AUDCHF: { base: "AUD", quote: "CHF" },
  AUDCAD: { base: "AUD", quote: "CAD" },
  NZDJPY: { base: "NZD", quote: "JPY" },
  NZDCHF: { base: "NZD", quote: "CHF" },
  NZDCAD: { base: "NZD", quote: "CAD" },
  CHFJPY: { base: "CHF", quote: "JPY" },
  CADJPY: { base: "CAD", quote: "JPY" },
  CADCHF: { base: "CAD", quote: "CHF" },
}

export type RawFxPairQuote = {
  symbol: string
  price: number
  changePercent: number
  updatedAt?: string
}

/** Normalized pair quote ready for strength calculation. */
export type FxPairQuote = {
  symbol: StrengthPairSymbol
  base: CurrencyCode
  quote: CurrencyCode
  price: number
  changePercent: number
  updatedAt: string
}

export type PairContribution = {
  symbol: StrengthPairSymbol
  delta: number
}

/** Per-currency output from the strength engine. */
export type CurrencyStrengthScore = {
  code: CurrencyCode
  name: Bi
  strength: number
  changePercent: number
  trend: "up" | "down" | "neutral"
  rankKey: string
  rank: number
  series: number[]
  contributions: PairContribution[]
  pairCount: number
}

export type CurrencyStrengthSnapshot = {
  currencies: CurrencyStrengthScore[]
  pairsUsed: StrengthPairSymbol[]
  calculatedAt: string
  available: boolean
}

export const CURRENCY_NAMES: Record<CurrencyCode, Bi> = {
  USD: { vi: "Đô la Mỹ", en: "US Dollar" },
  EUR: { vi: "Euro", en: "Euro" },
  GBP: { vi: "Bảng Anh", en: "British Pound" },
  JPY: { vi: "Yên Nhật", en: "Japanese Yen" },
  AUD: { vi: "Đô la Úc", en: "Australian Dollar" },
  NZD: { vi: "Đô la New Zealand", en: "New Zealand Dollar" },
  CAD: { vi: "Đô la Canada", en: "Canadian Dollar" },
  CHF: { vi: "Franc Thụy Sĩ", en: "Swiss Franc" },
}

/** Reference mock pair prices for offline / explicit mock fallback. */
export const REFERENCE_PAIR_QUOTES: Record<
  StrengthPairSymbol,
  { price: number; changePercent: number }
> = {
  EURUSD: { price: 1.0852, changePercent: 0.19 },
  GBPUSD: { price: 1.2741, changePercent: 0.27 },
  AUDUSD: { price: 0.6642, changePercent: -0.14 },
  NZDUSD: { price: 0.6128, changePercent: -0.21 },
  USDJPY: { price: 157.21, changePercent: 0.22 },
  USDCHF: { price: 0.8841, changePercent: -0.06 },
  USDCAD: { price: 1.3624, changePercent: 0.09 },
  EURGBP: { price: 0.852, changePercent: -0.08 },
  EURJPY: { price: 170.55, changePercent: 0.41 },
  EURAUD: { price: 1.632, changePercent: 0.33 },
  EURNZD: { price: 1.772, changePercent: 0.4 },
  EURCHF: { price: 0.958, changePercent: 0.13 },
  EURCAD: { price: 1.478, changePercent: 0.28 },
  GBPJPY: { price: 200.1, changePercent: 0.49 },
  GBPAUD: { price: 1.914, changePercent: 0.41 },
  GBPNZD: { price: 2.08, changePercent: 0.48 },
  GBPCHF: { price: 1.124, changePercent: 0.21 },
  GBPCAD: { price: 1.738, changePercent: 0.36 },
  AUDJPY: { price: 104.5, changePercent: 0.36 },
  AUDNZD: { price: 1.085, changePercent: 0.07 },
  AUDCHF: { price: 0.587, changePercent: -0.2 },
  AUDCAD: { price: 0.906, changePercent: 0.23 },
  NZDJPY: { price: 96.2, changePercent: 0.31 },
  NZDCHF: { price: 0.541, changePercent: -0.27 },
  NZDCAD: { price: 0.835, changePercent: 0.16 },
  CHFJPY: { price: 178.2, changePercent: 0.28 },
  CADJPY: { price: 115.3, changePercent: 0.13 },
  CADCHF: { price: 0.649, changePercent: -0.15 },
}
