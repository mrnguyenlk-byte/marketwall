/** Heatmap symbol universes for MarketWall (Sprint 5). */

export type HeatmapStockSeed = {
  symbol: string
  /** Twelve Data ticker (e.g. BRK/B). */
  apiSymbol: string
  name: string
  sector: string
  /** Approximate market cap (USD billions) for tile sizing. */
  marketCap: number
  exchange?: string
}

const US_TICKER_DEFS: Array<[api: string, name: string, sector: string, marketCap: number]> = [
  ["AAPL", "Apple Inc.", "Technology", 3050],
  ["MSFT", "Microsoft Corp.", "Technology", 3180],
  ["NVDA", "NVIDIA Corp.", "Semiconductors", 3250],
  ["GOOGL", "Alphabet Inc.", "Communication", 2180],
  ["AMZN", "Amazon.com Inc.", "Consumer", 1940],
  ["META", "Meta Platforms", "Communication", 1310],
  ["BRK/B", "Berkshire Hathaway", "Financials", 910],
  ["AVGO", "Broadcom Inc.", "Semiconductors", 780],
  ["TSLA", "Tesla Inc.", "Automotive", 780],
  ["WMT", "Walmart Inc.", "Consumer", 680],
  ["JPM", "JPMorgan Chase", "Financials", 620],
  ["V", "Visa Inc.", "Financials", 580],
  ["UNH", "UnitedHealth", "Healthcare", 520],
  ["XOM", "Exxon Mobil", "Energy", 480],
  ["MA", "Mastercard", "Financials", 460],
  ["PG", "Procter & Gamble", "Consumer", 390],
  ["JNJ", "Johnson & Johnson", "Healthcare", 380],
  ["HD", "Home Depot", "Consumer", 370],
  ["COST", "Costco", "Consumer", 360],
  ["MRK", "Merck", "Healthcare", 320],
  ["ABBV", "AbbVie", "Healthcare", 310],
  ["CRM", "Salesforce", "Technology", 290],
  ["BAC", "Bank of America", "Financials", 280],
  ["NFLX", "Netflix", "Communication", 270],
  ["KO", "Coca-Cola", "Consumer", 260],
  ["AMD", "Advanced Micro Devices", "Semiconductors", 250],
  ["PEP", "PepsiCo", "Consumer", 240],
  ["TMO", "Thermo Fisher", "Healthcare", 230],
  ["LIN", "Linde", "Materials", 220],
  ["CSCO", "Cisco", "Technology", 210],
  ["ACN", "Accenture", "Technology", 200],
  ["MCD", "McDonald's", "Consumer", 195],
  ["ADBE", "Adobe", "Technology", 190],
  ["WFC", "Wells Fargo", "Financials", 185],
  ["DHR", "Danaher", "Healthcare", 180],
  ["GE", "GE Aerospace", "Industrials", 175],
  ["TXN", "Texas Instruments", "Semiconductors", 170],
  ["INTU", "Intuit", "Technology", 165],
  ["VZ", "Verizon", "Communication", 160],
  ["QCOM", "Qualcomm", "Semiconductors", 155],
  ["CAT", "Caterpillar", "Industrials", 150],
  ["IBM", "IBM", "Technology", 145],
  ["AMAT", "Applied Materials", "Semiconductors", 140],
  ["NOW", "ServiceNow", "Technology", 135],
  ["UNP", "Union Pacific", "Industrials", 130],
  ["PM", "Philip Morris", "Consumer", 125],
  ["RTX", "RTX Corp.", "Industrials", 120],
  ["HON", "Honeywell", "Industrials", 115],
  ["LOW", "Lowe's", "Consumer", 110],
  ["SPGI", "S&P Global", "Financials", 105],
  ["GS", "Goldman Sachs", "Financials", 100],
  ["SYK", "Stryker", "Healthcare", 98],
  ["PGR", "Progressive", "Financials", 96],
  ["ISRG", "Intuitive Surgical", "Healthcare", 94],
  ["BLK", "BlackRock", "Financials", 92],
  ["ELV", "Elevance Health", "Healthcare", 90],
  ["TJX", "TJX Companies", "Consumer", 88],
  ["AXP", "American Express", "Financials", 86],
  ["MS", "Morgan Stanley", "Financials", 84],
  ["BKNG", "Booking Holdings", "Consumer", 82],
  ["BSX", "Boston Scientific", "Healthcare", 80],
  ["GILD", "Gilead Sciences", "Healthcare", 78],
  ["ADP", "ADP", "Technology", 76],
  ["VRTX", "Vertex Pharma", "Healthcare", 74],
  ["MMC", "Marsh & McLennan", "Financials", 72],
  ["REGN", "Regeneron", "Healthcare", 70],
  ["MU", "Micron", "Semiconductors", 68],
  ["LRCX", "Lam Research", "Semiconductors", 66],
  ["PLD", "Prologis", "Real Estate", 64],
  ["CI", "Cigna", "Healthcare", 62],
  ["PANW", "Palo Alto Networks", "Technology", 60],
  ["DE", "Deere & Co.", "Industrials", 58],
  ["CB", "Chubb", "Financials", 56],
  ["SO", "Southern Co.", "Utilities", 54],
  ["ZTS", "Zoetis", "Healthcare", 52],
  ["CEG", "Constellation Energy", "Utilities", 50],
  ["MO", "Altria", "Consumer", 48],
  ["EQIX", "Equinix", "Real Estate", 46],
  ["SNPS", "Synopsys", "Technology", 44],
  ["FI", "Fiserv", "Technology", 42],
  ["DUK", "Duke Energy", "Utilities", 40],
  ["CL", "Colgate-Palmolive", "Consumer", 38],
  ["ITW", "Illinois Tool Works", "Industrials", 36],
  ["AON", "Aon", "Financials", 34],
  ["SHW", "Sherwin-Williams", "Materials", 32],
  ["ICE", "Intercontinental Exchange", "Financials", 30],
  ["EMR", "Emerson Electric", "Industrials", 28],
  ["CMCSA", "Comcast", "Communication", 26],
  ["USB", "U.S. Bancorp", "Financials", 24],
  ["NKE", "Nike", "Consumer", 22],
  ["GD", "General Dynamics", "Industrials", 20],
  ["PYPL", "PayPal", "Financials", 18],
  ["SLB", "Schlumberger", "Energy", 16],
  ["APD", "Air Products", "Materials", 14],
  ["COP", "ConocoPhillips", "Energy", 12],
  ["BA", "Boeing", "Industrials", 10],
  ["EOG", "EOG Resources", "Energy", 9],
  ["MDT", "Medtronic", "Healthcare", 8],
  ["NSC", "Norfolk Southern", "Industrials", 7],
  ["CSX", "CSX Corp.", "Industrials", 6],
  ["WM", "Waste Management", "Industrials", 5],
  ["ORCL", "Oracle", "Technology", 4],
  ["INTC", "Intel", "Semiconductors", 3],
  ["DIS", "Walt Disney", "Communication", 2],
  ["CVX", "Chevron", "Energy", 1],
]

export const US_HEATMAP_SEEDS: HeatmapStockSeed[] = US_TICKER_DEFS.slice(0, 100).map(
  ([apiSymbol, name, sector, marketCap]) => ({
    symbol: apiSymbol.replace("/", ""),
    apiSymbol,
    name,
    sector,
    marketCap,
    exchange: "US",
  }),
)

/** Display limits (Sprint 23 usability). */
export const VN_HEATMAP_LIMIT = 80
export const US_HEATMAP_LIMIT = 50
export const CRYPTO_HEATMAP_LIMIT = 40

/** API fetch universe — US seeds stay broad; top N chosen by dollar volume at serve time. */
export const US_HEATMAP_SIZE = US_HEATMAP_LIMIT
export const CRYPTO_HEATMAP_SIZE = CRYPTO_HEATMAP_LIMIT

/** Twelve Data API symbols for US live quotes. */
export function getUsHeatmapApiSymbols(): string[] {
  return US_HEATMAP_SEEDS.map((s) => s.apiSymbol)
}

/** Top US tickers for WebSocket realtime overlay (quota-safe). */
export const US_REALTIME_TICKERS = getUsHeatmapApiSymbols().slice(0, 20)

/** Top crypto pairs for WebSocket realtime overlay. */
export const CRYPTO_REALTIME_SYMBOLS = [
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "BNB/USD",
  "XRP/USD",
  "ADA/USD",
  "DOGE/USD",
  "AVAX/USD",
  "DOT/USD",
  "LINK/USD",
] as const
