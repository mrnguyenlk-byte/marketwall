"use client"

import { useCallback, useSyncExternalStore } from "react"

import {
  addWatchlistSymbol,
  DEFAULT_WATCHLIST,
  getAvailableWatchlistSymbols,
  readWatchlist,
  removeWatchlistSymbol,
  subscribeWatchlist,
  writeWatchlist,
  type WatchlistSymbol,
} from "@/lib/watchlist"

function getServerSnapshot(): WatchlistSymbol[] {
  return [...DEFAULT_WATCHLIST]
}

export function useWatchlist() {
  const symbols = useSyncExternalStore(
    subscribeWatchlist,
    readWatchlist,
    getServerSnapshot,
  )

  const add = useCallback((symbol: WatchlistSymbol) => {
    writeWatchlist(addWatchlistSymbol(readWatchlist(), symbol))
  }, [])

  const remove = useCallback((symbol: WatchlistSymbol) => {
    writeWatchlist(removeWatchlistSymbol(readWatchlist(), symbol))
  }, [])

  const available = getAvailableWatchlistSymbols(symbols)

  return { symbols, add, remove, available }
}
