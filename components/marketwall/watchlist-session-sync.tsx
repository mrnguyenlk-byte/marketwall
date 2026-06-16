"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

import { loadRemoteWatchlist, useWatchlistStore } from "@/lib/store/watchlist-store"

/** Switches watchlist between localStorage (guest) and API (authenticated). */
export function WatchlistSessionSync() {
  const { status } = useSession()
  const setSyncMode = useWatchlistStore((s) => s.setSyncMode)
  const setSymbols = useWatchlistStore((s) => s.setSymbols)

  useEffect(() => {
    if (status === "loading") return

    if (status === "authenticated") {
      setSyncMode("remote")
      void loadRemoteWatchlist().then((symbols) => {
        if (symbols) setSymbols(symbols)
      })
      return
    }

    setSyncMode("local")
  }, [status, setSyncMode, setSymbols])

  return null
}
