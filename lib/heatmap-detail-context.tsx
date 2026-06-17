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
import { DEFAULT_SYMBOL_DETAIL_TAB } from "@/lib/market/asset-detail-availability"
import type { DetailTabId } from "@/lib/market/asset-detail-availability"
import {
  resolveSymbolToMarketAsset,
  type SymbolQuoteHint,
} from "@/lib/market/symbol-to-asset"
import type { MarketAsset } from "@/types/market"

type OpenAssetOptions = {
  tab?: DetailTabId
}

type OpenSymbolOptions = OpenAssetOptions & {
  hint?: SymbolQuoteHint
}

type HeatmapDetailContextValue = {
  asset: MarketAsset | null
  initialTab: DetailTabId
  openAsset: (asset: MarketAsset, options?: OpenAssetOptions) => void
  openSymbolDetail: (symbol: string, options?: OpenSymbolOptions) => void
  closeAsset: () => void
}

const NOOP_CONTEXT: HeatmapDetailContextValue = {
  asset: null,
  initialTab: DEFAULT_SYMBOL_DETAIL_TAB,
  openAsset: () => {},
  openSymbolDetail: () => {},
  closeAsset: () => {},
}

const HeatmapDetailContext = createContext<HeatmapDetailContextValue | null>(null)

function HeatmapDetailProviderEnabled({ children }: { children: ReactNode }) {
  const [asset, setAsset] = useState<MarketAsset | null>(null)
  const [initialTab, setInitialTab] = useState<DetailTabId>(DEFAULT_SYMBOL_DETAIL_TAB)

  const openAsset = useCallback((next: MarketAsset, options?: OpenAssetOptions) => {
    setInitialTab(options?.tab ?? DEFAULT_SYMBOL_DETAIL_TAB)
    setAsset(next)
  }, [])

  const openSymbolDetail = useCallback((symbol: string, options?: OpenSymbolOptions) => {
    const resolved = resolveSymbolToMarketAsset(symbol, options?.hint)
    if (!resolved) return
    setInitialTab(options?.tab ?? DEFAULT_SYMBOL_DETAIL_TAB)
    setAsset(resolved)
  }, [])

  const closeAsset = useCallback(() => setAsset(null), [])

  const value = useMemo(
    () => ({ asset, initialTab, openAsset, openSymbolDetail, closeAsset }),
    [asset, initialTab, openAsset, openSymbolDetail, closeAsset],
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
