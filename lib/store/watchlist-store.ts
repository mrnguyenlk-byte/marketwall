"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import {
  addWatchlistSymbol,
  DEFAULT_WATCHLIST,
  getAvailableWatchlistSymbols,
  isWatchlistSymbol,
  removeWatchlistSymbol,
  WATCHLIST_STORAGE_KEY,
  type WatchlistSymbol,
} from "@/lib/watchlist"

type WatchlistState = {
  symbols: WatchlistSymbol[]
  _hasHydrated: boolean
  _syncMode: "local" | "remote"
  setHasHydrated: (value: boolean) => void
  setSyncMode: (mode: "local" | "remote") => void
  setSymbols: (symbols: WatchlistSymbol[]) => void
  add: (symbol: WatchlistSymbol) => void
  remove: (symbol: WatchlistSymbol) => void
}

function sanitizeSymbols(raw: unknown): WatchlistSymbol[] {
  if (!Array.isArray(raw)) return [...DEFAULT_WATCHLIST]
  const symbols = raw.filter((entry): entry is WatchlistSymbol => isWatchlistSymbol(String(entry)))
  return symbols.length ? symbols : [...DEFAULT_WATCHLIST]
}

async function syncAdd(symbol: WatchlistSymbol): Promise<WatchlistSymbol[] | null> {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  })
  if (!response.ok) return null
  const body = (await response.json()) as { symbols?: string[] }
  return sanitizeSymbols(body.symbols)
}

async function syncRemove(symbol: WatchlistSymbol): Promise<WatchlistSymbol[] | null> {
  const response = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
    method: "DELETE",
  })
  if (!response.ok) return null
  const body = (await response.json()) as { symbols?: string[] }
  return sanitizeSymbols(body.symbols)
}

export async function loadRemoteWatchlist(): Promise<WatchlistSymbol[] | null> {
  const response = await fetch("/api/watchlist")
  if (!response.ok) return null
  const body = (await response.json()) as { symbols?: string[] }
  return sanitizeSymbols(body.symbols)
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: [...DEFAULT_WATCHLIST],
      _hasHydrated: false,
      _syncMode: "local",
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setSyncMode: (mode) => set({ _syncMode: mode }),
      setSymbols: (symbols) => set({ symbols: sanitizeSymbols(symbols) }),
      add: (symbol) => {
        const next = addWatchlistSymbol(get().symbols, symbol)
        set({ symbols: next })

        if (get()._syncMode === "remote") {
          void syncAdd(symbol).then((remote) => {
            if (remote) set({ symbols: remote })
          })
        }
      },
      remove: (symbol) => {
        const next = removeWatchlistSymbol(get().symbols, symbol)
        set({ symbols: next })

        if (get()._syncMode === "remote") {
          void syncRemove(symbol).then((remote) => {
            if (remote) set({ symbols: remote })
          })
        }
      },
    }),
    {
      name: WATCHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ symbols: state.symbols }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<WatchlistState> | undefined
        return {
          ...current,
          symbols: sanitizeSymbols(stored?.symbols),
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

export function useWatchlistAvailable(): WatchlistSymbol[] {
  const symbols = useWatchlistStore((s) => s.symbols)
  return getAvailableWatchlistSymbols(symbols)
}
