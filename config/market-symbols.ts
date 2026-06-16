/** Twelve Data symbol registry for MarketWall dashboard feeds. */

export type MarketSymbolCategory =
  | "commodity"
  | "forex"
  | "crypto"
  | "index"
  | "currency_index"
  | "equity"

export type MarketSymbolDef = {
  id: string
  /** Twelve Data symbol (e.g. XAU/USD, SPX). */
  apiSymbol: string
  /** Dashboard display symbol (e.g. GOLD, S&P 500). */
  displaySymbol: string
  name: string
  category: MarketSymbolCategory
}

/** Primary overview / ticker symbols requested for MarketWall. */
export const OVERVIEW_SYMBOLS: MarketSymbolDef[] = [
  {
    id: "gold",
    apiSymbol: "XAU/USD",
    displaySymbol: "GOLD",
    name: "Gold",
    category: "commodity",
  },
  {
    id: "silver",
    apiSymbol: "XAG/USD",
    displaySymbol: "SILVER",
    name: "Silver",
    category: "commodity",
  },
  {
    id: "dxy",
    apiSymbol: "DXY",
    displaySymbol: "DXY",
    name: "US Dollar Index",
    category: "currency_index",
  },
  {
    id: "eurusd",
    apiSymbol: "EUR/USD",
    displaySymbol: "EUR/USD",
    name: "EUR/USD",
    category: "forex",
  },
  {
    id: "usdjpy",
    apiSymbol: "USD/JPY",
    displaySymbol: "USD/JPY",
    name: "USD/JPY",
    category: "forex",
  },
  {
    id: "btc",
    apiSymbol: "BTC/USD",
    displaySymbol: "BTC/USD",
    name: "Bitcoin",
    category: "crypto",
  },
  {
    id: "eth",
    apiSymbol: "ETH/USD",
    displaySymbol: "ETH/USD",
    name: "Ethereum",
    category: "crypto",
  },
  {
    id: "sp500",
    apiSymbol: "SPX",
    displaySymbol: "S&P 500",
    name: "S&P 500",
    category: "index",
  },
  {
    id: "nasdaq",
    apiSymbol: "IXIC",
    displaySymbol: "NASDAQ",
    name: "NASDAQ Composite",
    category: "index",
  },
  {
    id: "vnindex",
    apiSymbol: "VNINDEX",
    displaySymbol: "VN-INDEX",
    name: "VN-Index",
    category: "index",
  },
  {
    id: "vn30",
    apiSymbol: "VN30",
    displaySymbol: "VN30",
    name: "VN30",
    category: "index",
  },
]

/** FX pairs used to derive cross-currency strength (28-pair model). */
export const CURRENCY_STRENGTH_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "AUD/USD",
  "NZD/USD",
  "USD/JPY",
  "USD/CHF",
  "USD/CAD",
  "EUR/GBP",
  "EUR/JPY",
  "EUR/AUD",
  "EUR/NZD",
  "EUR/CHF",
  "EUR/CAD",
  "GBP/JPY",
  "GBP/AUD",
  "GBP/NZD",
  "GBP/CHF",
  "GBP/CAD",
  "AUD/JPY",
  "AUD/NZD",
  "AUD/CHF",
  "AUD/CAD",
  "NZD/JPY",
  "NZD/CHF",
  "NZD/CAD",
  "CHF/JPY",
  "CAD/JPY",
  "CAD/CHF",
] as const

export type CurrencyStrengthPair = (typeof CURRENCY_STRENGTH_PAIRS)[number]

const byDisplay = new Map(OVERVIEW_SYMBOLS.map((s) => [s.displaySymbol, s]))
const byApi = new Map(OVERVIEW_SYMBOLS.map((s) => [s.apiSymbol, s]))
const byId = new Map(OVERVIEW_SYMBOLS.map((s) => [s.id, s]))

/** Resolve a symbol definition by display, API, or id key. */
export function findMarketSymbol(key: string): MarketSymbolDef | undefined {
  const normalized = key.trim()
  return (
    byDisplay.get(normalized) ??
    byApi.get(normalized) ??
    byId.get(normalized.toLowerCase()) ??
    byDisplay.get(normalized.toUpperCase())
  )
}

export function getOverviewApiSymbols(): string[] {
  return OVERVIEW_SYMBOLS.map((s) => s.apiSymbol)
}

export function getCryptoSymbolDefs(): MarketSymbolDef[] {
  return OVERVIEW_SYMBOLS.filter((s) => s.category === "crypto")
}

export function getIndexSymbolDefs(): MarketSymbolDef[] {
  return OVERVIEW_SYMBOLS.filter((s) => s.category === "index")
}
