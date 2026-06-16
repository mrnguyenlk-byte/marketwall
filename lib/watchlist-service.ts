import "server-only"

import { prisma } from "@/lib/prisma"
import {
  DEFAULT_WATCHLIST,
  isWatchlistSymbol,
  type WatchlistSymbol,
} from "@/lib/watchlist"

const DEFAULT_WATCHLIST_NAME = "Default"

function sanitizeSymbols(symbols: string[]): WatchlistSymbol[] {
  const seen = new Set<WatchlistSymbol>()
  const result: WatchlistSymbol[] = []

  for (const raw of symbols) {
    const symbol = raw.trim().toUpperCase()
    if (!isWatchlistSymbol(symbol) || seen.has(symbol)) continue
    seen.add(symbol)
    result.push(symbol)
  }

  return result.length ? result : [...DEFAULT_WATCHLIST]
}

async function getOrCreateDefaultWatchlist(userId: string) {
  const existing = await prisma.watchlist.findFirst({
    where: { userId, name: DEFAULT_WATCHLIST_NAME },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  })

  if (existing) return existing

  return prisma.watchlist.create({
    data: {
      userId,
      name: DEFAULT_WATCHLIST_NAME,
      items: {
        create: DEFAULT_WATCHLIST.map((symbol, index) => ({
          symbol,
          sortOrder: index,
        })),
      },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  })
}

export async function getUserWatchlistSymbols(userId: string): Promise<WatchlistSymbol[]> {
  const watchlist = await getOrCreateDefaultWatchlist(userId)
  const symbols = watchlist.items.map((item) => item.symbol)
  return sanitizeSymbols(symbols)
}

export async function setUserWatchlistSymbols(
  userId: string,
  symbols: string[],
): Promise<WatchlistSymbol[]> {
  const sanitized = sanitizeSymbols(symbols)
  const watchlist = await getOrCreateDefaultWatchlist(userId)

  await prisma.$transaction([
    prisma.watchlistItem.deleteMany({ where: { watchlistId: watchlist.id } }),
    prisma.watchlistItem.createMany({
      data: sanitized.map((symbol, index) => ({
        watchlistId: watchlist.id,
        symbol,
        sortOrder: index,
      })),
    }),
  ])

  return sanitized
}

export async function addUserWatchlistSymbol(
  userId: string,
  symbol: string,
): Promise<WatchlistSymbol[]> {
  const normalized = symbol.trim().toUpperCase()
  if (!isWatchlistSymbol(normalized)) {
    throw new Error("Invalid watchlist symbol")
  }

  const current = await getUserWatchlistSymbols(userId)
  if (current.includes(normalized)) return current

  return setUserWatchlistSymbols(userId, [...current, normalized])
}

export async function removeUserWatchlistSymbol(
  userId: string,
  symbol: string,
): Promise<WatchlistSymbol[]> {
  const normalized = symbol.trim().toUpperCase()
  if (!isWatchlistSymbol(normalized)) {
    throw new Error("Invalid watchlist symbol")
  }

  const current = await getUserWatchlistSymbols(userId)
  return setUserWatchlistSymbols(
    userId,
    current.filter((entry) => entry !== normalized),
  )
}
