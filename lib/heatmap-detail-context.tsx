"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { features } from "@/lib/config/features"
import { findMockAsset } from "@/lib/mockHeatmapData"
import type { MarketAsset } from "@/types/market"

type HeatmapDetailContextValue = {
  asset: MarketAsset | null
  openAsset: (symbol: string) => void
  closeAsset: () => void
}

const NOOP_CONTEXT: HeatmapDetailContextValue = {
  asset: null,
  openAsset: () => {},
  closeAsset: () => {},
}

const HeatmapDetailContext = createContext<HeatmapDetailContextValue | null>(null)

function HeatmapDetailProviderEnabled({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState<string | null>(null)

  const asset = useMemo(
    () => (symbol ? findMockAsset(symbol) : null),
    [symbol],
  )

  const openAsset = useCallback((nextSymbol: string) => {
    if (findMockAsset(nextSymbol)) setSymbol(nextSymbol)
  }, [])

  const closeAsset = useCallback(() => setSymbol(null), [])

  const value = useMemo(
    () => ({ asset, openAsset, closeAsset }),
    [asset, openAsset, closeAsset],
  )

  return (
    <HeatmapDetailContext.Provider value={value}>
      {children}
    </HeatmapDetailContext.Provider>
  )
}

export function HeatmapDetailProvider({ children }: { children: ReactNode }) {
  if (!features.heatmapDetailModal) {
    return (
      <HeatmapDetailContext.Provider value={NOOP_CONTEXT}>
        {children}
      </HeatmapDetailContext.Provider>
    )
  }

  return <HeatmapDetailProviderEnabled>{children}</HeatmapDetailProviderEnabled>
}

export function useHeatmapDetail() {
  const ctx = useContext(HeatmapDetailContext)
  if (!ctx) {
    throw new Error("useHeatmapDetail must be used within HeatmapDetailProvider")
  }
  return ctx
}
