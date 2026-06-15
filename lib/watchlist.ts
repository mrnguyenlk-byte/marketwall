import type { Bi } from "@/lib/market-utils"

export const WATCHLIST_STORAGE_KEY = "btrading-watchlist"

export const WATCHLIST_CHANGE_EVENT = "btrading-watchlist-change"

/** Supported watchlist symbols (privacy-friendly, no account). */
export type WatchlistSymbol =
  | "VNINDEX"
  | "VN30"
  | "BTCUSD"
  | "GOLD"
  | "SP500"
  | "NASDAQ"

export const ALL_WATCHLIST_SYMBOLS: WatchlistSymbol[] = [
  "VNINDEX",
  "VN30",
  "BTCUSD",
  "GOLD",
  "SP500",
  "NASDAQ",
]

export type WatchlistCatalogEntry = {
  name: Bi
  seed: number
  mockPrice: number
  mockChangePercent: number
}

export const WATCHLIST_CATALOG: Record<WatchlistSymbol, WatchlistCatalogEntry> = {
  VNINDEX: {
    name: { vi: "VN-Index", en: "VN-Index" },
    seed: 11,
    mockPrice: 1281.4,
    mockChangePercent: 0.53,
  },
  VN30: {
    name: { vi: "VN30", en: "VN30" },
    seed: 2,
    mockPrice: 1302.7,
    mockChangePercent: 0.56,
  },
  BTCUSD: {
    name: { vi: "Bitcoin", en: "Bitcoin" },
    seed: 5,
    mockPrice: 68240,
    mockChangePercent: 2.12,
  },
  GOLD: {
    name: { vi: "Vàng", en: "Gold" },
    seed: 8,
    mockPrice: 2347.8,
    mockChangePercent: 0.53,
  },
  SP500: {
    name: { vi: "S&P 500", en: "S&P 500" },
    seed: 3,
    mockPrice: 5431.6,
    mockChangePercent: 0.34,
  },
  NASDAQ: {
    name: { vi: "Nasdaq", en: "Nasdaq" },
    seed: 4,
    mockPrice: 17688.9,
    mockChangePercent: 0.54,
  },
}

export const DEFAULT_WATCHLIST: WatchlistSymbol[] = ["VNINDEX", "VN30", "BTCUSD", "GOLD", "SP500"]

/** Map legacy / alternate labels stored in older localStorage entries. */
const LEGACY_SYMBOL_ALIASES: Record<string, WatchlistSymbol> = {
  "S&P 500": "SP500",
  SPX: "SP500",
  NDQ: "NASDAQ",
}

function normalizeStoredSymbol(value: string): WatchlistSymbol | null {
  const upper = value.trim().toUpperCase()
  if (isWatchlistSymbol(upper)) return upper

  const alias = LEGACY_SYMBOL_ALIASES[value.trim()] ?? LEGACY_SYMBOL_ALIASES[upper]
  return alias ?? null
}

export function isWatchlistSymbol(value: string): value is WatchlistSymbol {
  return (ALL_WATCHLIST_SYMBOLS as string[]).includes(value)
}

function parseStored(raw: string | null): WatchlistSymbol[] {
  if (!raw) return [...DEFAULT_WATCHLIST]

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_WATCHLIST]

    const symbols = parsed
      .map((entry) => (typeof entry === "string" ? normalizeStoredSymbol(entry) : null))
      .filter((entry): entry is WatchlistSymbol => entry != null)

    return symbols.length ? symbols : [...DEFAULT_WATCHLIST]
  } catch {
    return [...DEFAULT_WATCHLIST]
  }
}

export function readWatchlist(): WatchlistSymbol[] {
  if (typeof window === "undefined") return [...DEFAULT_WATCHLIST]

  try {
    return parseStored(localStorage.getItem(WATCHLIST_STORAGE_KEY))
  } catch {
    return [...DEFAULT_WATCHLIST]
  }
}

export function writeWatchlist(symbols: WatchlistSymbol[]): void {
  if (typeof window === "undefined") return

  const seen = new Set<WatchlistSymbol>()
  const unique = symbols.filter((symbol) => {
    if (!isWatchlistSymbol(symbol) || seen.has(symbol)) return false
    seen.add(symbol)
    return true
  })

  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(unique))
    window.dispatchEvent(new Event(WATCHLIST_CHANGE_EVENT))
  } catch {
    // ignore quota / private mode
  }
}

export function addWatchlistSymbol(
  symbols: WatchlistSymbol[],
  symbol: WatchlistSymbol,
): WatchlistSymbol[] {
  if (symbols.includes(symbol)) return symbols
  return [...symbols, symbol]
}

export function removeWatchlistSymbol(
  symbols: WatchlistSymbol[],
  symbol: WatchlistSymbol,
): WatchlistSymbol[] {
  return symbols.filter((entry) => entry !== symbol)
}

export function getAvailableWatchlistSymbols(symbols: WatchlistSymbol[]): WatchlistSymbol[] {
  return ALL_WATCHLIST_SYMBOLS.filter((symbol) => !symbols.includes(symbol))
}

export function subscribeWatchlist(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  const handler = () => onStoreChange()
  window.addEventListener(WATCHLIST_CHANGE_EVENT, handler)
  window.addEventListener("storage", handler)

  return () => {
    window.removeEventListener(WATCHLIST_CHANGE_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}
