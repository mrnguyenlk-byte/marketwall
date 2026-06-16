/** Shared FX pair quote shape (provider-agnostic). */
export type FxPairQuote = {
  symbol: string
  price: number
  changePercent: number
  updatedAt: string
}
