"use client"

import { useCallback } from "react"

import { features } from "@/lib/config/features"
import { useHeatmapDetail } from "@/lib/heatmap-detail-context"
import {
  DEFAULT_SYMBOL_DETAIL_TAB,
  type DetailTabId,
} from "@/lib/market/asset-detail-availability"
import {
  resolveSymbolToMarketAsset,
  type SymbolQuoteHint,
} from "@/lib/market/symbol-to-asset"
import type { MarketAsset } from "@/types/market"

export { DEFAULT_SYMBOL_DETAIL_TAB } from "@/lib/market/asset-detail-availability"

type OpenOptions = {
  tab?: DetailTabId
  hint?: SymbolQuoteHint
}

export function useOpenSymbolDetail() {
  const { openAsset, openSymbolDetail } = useHeatmapDetail()
  const enabled = features.heatmapDetailModal

  const openMarketAsset = useCallback(
    (asset: MarketAsset, options?: OpenOptions) => {
      if (!enabled) return
      openAsset(asset, { tab: options?.tab ?? DEFAULT_SYMBOL_DETAIL_TAB })
    },
    [enabled, openAsset],
  )

  const openSymbol = useCallback(
    (symbol: string, options?: OpenOptions) => {
      if (!enabled) return
      openSymbolDetail(symbol, {
        tab: options?.tab ?? DEFAULT_SYMBOL_DETAIL_TAB,
        hint: options?.hint,
      })
    },
    [enabled, openSymbolDetail],
  )

  const tryOpenSymbol = useCallback(
    (symbol: string, options?: OpenOptions): boolean => {
      if (!enabled) return false
      const asset = resolveSymbolToMarketAsset(symbol, options?.hint)
      if (!asset) return false
      openAsset(asset, { tab: options?.tab ?? DEFAULT_SYMBOL_DETAIL_TAB })
      return true
    },
    [enabled, openAsset],
  )

  return { openSymbol, openMarketAsset, tryOpenSymbol, enabled }
}
