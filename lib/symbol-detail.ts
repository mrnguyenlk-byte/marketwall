import type { Bi } from "@/lib/market-utils"
import { buildHeatmapSymbolRecords } from "@/lib/symbol-heatmap-registry"
import type { WatchlistSymbol } from "@/lib/watchlist"

export type SymbolCategory = "index" | "crypto" | "commodity" | "equity"

export type SymbolDetailRecord = {
  slug: string
  symbol: string
  name: Bi
  category: SymbolCategory
  exchange?: string
  sector?: string
  region?: Bi
  mockPrice: number
  mockChangePercent: number
  watchlistSymbol?: WatchlistSymbol
  marketPageSlug?: MarketPageSlug
}

export const MARKET_PAGE_SLUGS = [
  "vnindex",
  "vn30",
  "vn100",
  "hnx",
  "upcom",
  "btcusd",
  "ethusd",
  "gold",
  "sp500",
  "nasdaq",
] as const

export type MarketPageSlug = (typeof MARKET_PAGE_SLUGS)[number]

const CORE_SYMBOLS: SymbolDetailRecord[] = [
  {
    slug: "vnindex",
    symbol: "VNINDEX",
    name: { vi: "VN-Index", en: "VN-Index" },
    category: "index",
    exchange: "HOSE",
    region: { vi: "Việt Nam", en: "Vietnam" },
    mockPrice: 1281.4,
    mockChangePercent: 0.53,
    watchlistSymbol: "VNINDEX",
    marketPageSlug: "vnindex",
  },
  {
    slug: "vn30",
    symbol: "VN30",
    name: { vi: "VN30", en: "VN30" },
    category: "index",
    exchange: "HOSE",
    region: { vi: "Việt Nam", en: "Vietnam" },
    mockPrice: 1302.7,
    mockChangePercent: 0.56,
    watchlistSymbol: "VN30",
    marketPageSlug: "vn30",
  },
  {
    slug: "vn100",
    symbol: "VN100",
    name: { vi: "VN100", en: "VN100" },
    category: "index",
    exchange: "HOSE",
    region: { vi: "Việt Nam", en: "Vietnam" },
    mockPrice: 1184.2,
    mockChangePercent: 0.2,
    marketPageSlug: "vn100",
  },
  {
    slug: "hnx",
    symbol: "HNX",
    name: { vi: "HNX-Index", en: "HNX-Index" },
    category: "index",
    exchange: "HNX",
    region: { vi: "Việt Nam", en: "Vietnam" },
    mockPrice: 248.6,
    mockChangePercent: -0.48,
    marketPageSlug: "hnx",
  },
  {
    slug: "upcom",
    symbol: "UPCOM",
    name: { vi: "UPCoM-Index", en: "UPCoM-Index" },
    category: "index",
    exchange: "UPCOM",
    region: { vi: "Việt Nam", en: "Vietnam" },
    mockPrice: 92.8,
    mockChangePercent: 0.65,
    marketPageSlug: "upcom",
  },
  {
    slug: "btcusd",
    symbol: "BTC/USD",
    name: { vi: "Bitcoin", en: "Bitcoin" },
    category: "crypto",
    region: { vi: "Tiền mã hóa", en: "Crypto" },
    mockPrice: 68240,
    mockChangePercent: 2.12,
    watchlistSymbol: "BTCUSD",
    marketPageSlug: "btcusd",
  },
  {
    slug: "ethusd",
    symbol: "ETH/USD",
    name: { vi: "Ethereum", en: "Ethereum" },
    category: "crypto",
    region: { vi: "Tiền mã hóa", en: "Crypto" },
    mockPrice: 3548,
    mockChangePercent: -1.17,
    marketPageSlug: "ethusd",
  },
  {
    slug: "gold",
    symbol: "GOLD",
    name: { vi: "Vàng", en: "Gold" },
    category: "commodity",
    region: { vi: "Hàng hóa", en: "Commodity" },
    mockPrice: 2347.8,
    mockChangePercent: 0.53,
    watchlistSymbol: "GOLD",
    marketPageSlug: "gold",
  },
  {
    slug: "sp500",
    symbol: "S&P 500",
    name: { vi: "S&P 500", en: "S&P 500" },
    category: "index",
    region: { vi: "Hoa Kỳ", en: "United States" },
    mockPrice: 5431.6,
    mockChangePercent: 0.34,
    watchlistSymbol: "SP500",
    marketPageSlug: "sp500",
  },
  {
    slug: "nasdaq",
    symbol: "NASDAQ",
    name: { vi: "Nasdaq", en: "Nasdaq" },
    category: "index",
    region: { vi: "Hoa Kỳ", en: "United States" },
    mockPrice: 17688.9,
    mockChangePercent: 0.54,
    watchlistSymbol: "NASDAQ",
    marketPageSlug: "nasdaq",
  },
]

const HEATMAP_REGISTRY = buildHeatmapSymbolRecords()

const SYMBOL_REGISTRY: Map<string, SymbolDetailRecord> = new Map()

function register(record: SymbolDetailRecord) {
  SYMBOL_REGISTRY.set(record.slug, record)
  SYMBOL_REGISTRY.set(record.symbol.toUpperCase(), record)
  SYMBOL_REGISTRY.set(record.symbol, record)
}

for (const record of CORE_SYMBOLS) register(record)
for (const record of HEATMAP_REGISTRY) register(record)

const INPUT_ALIASES: Record<string, string> = {
  VNINDEX: "vnindex",
  "VN-INDEX": "vnindex",
  VN30: "vn30",
  VN100: "vn100",
  HNX: "hnx",
  "HNX-INDEX": "hnx",
  UPCOM: "upcom",
  "UPCOM-INDEX": "upcom",
  BTC: "btcusd",
  "BTC/USD": "btcusd",
  BTCUSD: "btcusd",
  ETH: "ethusd",
  "ETH/USD": "ethusd",
  ETHUSD: "ethusd",
  GOLD: "gold",
  SP500: "sp500",
  "S&P 500": "sp500",
  NASDAQ: "nasdaq",
  NDQ: "nasdaq",
}

export function normalizeSymbolInput(input: string): string {
  const trimmed = input.trim()
  const alias = INPUT_ALIASES[trimmed] ?? INPUT_ALIASES[trimmed.toUpperCase()]
  if (alias) return alias
  return trimmed.toLowerCase()
}

export function resolveSymbolDetail(input: string): SymbolDetailRecord | null {
  const key = normalizeSymbolInput(input)
  return SYMBOL_REGISTRY.get(key) ?? SYMBOL_REGISTRY.get(key.toUpperCase()) ?? null
}

export function getMarketPageSymbol(slug: string): SymbolDetailRecord | null {
  if (!isMarketPageSlug(slug)) return null
  return CORE_SYMBOLS.find((s) => s.marketPageSlug === slug) ?? null
}

export function isMarketPageSlug(slug: string): slug is MarketPageSlug {
  return (MARKET_PAGE_SLUGS as readonly string[]).includes(slug)
}

export function getAllSymbolDetails(): SymbolDetailRecord[] {
  const seen = new Set<string>()
  const all = [...CORE_SYMBOLS, ...HEATMAP_REGISTRY]
  return all.filter((record) => {
    if (seen.has(record.slug)) return false
    seen.add(record.slug)
    return true
  })
}

export function marketPagePath(slug: MarketPageSlug): string {
  return `/markets/${slug}`
}
