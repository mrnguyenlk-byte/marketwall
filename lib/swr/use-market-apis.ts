"use client"

import useSWR from "swr"

import { features } from "@/lib/config/features"
import type {
  CryptoAsset,
  GlobalQuote,
  VietnamMarketIndex,
} from "@/lib/market-types"

import type { CurrencyStrengthResponse as CurrencyStrengthApiResponse } from "@/hooks/useCurrencyStrength"
import { useCurrencyStrength } from "@/hooks/useCurrencyStrength"
import type { QuotesResponse } from "@/hooks/useQuotes"
import { useQuotes } from "@/hooks/useQuotes"
import { jsonFetcher } from "./fetcher"
import { SWR_KEYS } from "./keys"

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 30_000,
  errorRetryCount: 2,
} as const

export type VietnamMarketsResponse = {
  source?: "live" | "mock"
  indices?: VietnamMarketIndex[]
  heatmapMarket?: import("@/lib/market-types").HeatmapMarket
  dashboard?: import("@/lib/providers/vietnam-market-provider").VietnamMarketDashboard
  analytics?: import("@/lib/vietnam/market-analytics").VietnamMarketAnalytics
  heatmapProvider?: "vps" | "kbs" | "tcbs" | "vietstock" | "fireant"
  enrichmentProvider?: "kbs"
}

export type GlobalMarketsResponse = {
  source?: "live" | "mock"
  quotes?: GlobalQuote[]
}

export type CryptoResponse = {
  source?: "live" | "mock"
  assets?: CryptoAsset[]
  heatmapTiles?: import("@/lib/market-types").HeatmapTile[]
}

export type MarketQuotesResponse = QuotesResponse

export type CurrencyStrengthResponse = CurrencyStrengthApiResponse

export type HeatmapApiResponse = {
  source?: "live" | "mock"
  items?: import("@/types/market").HeatmapAsset[]
  fallback?: boolean
  unavailable?: boolean
  updatedAt?: string
}

function useLiveSwr<T>(key: string | null) {
  return useSWR<T>(features.liveClientFetch ? key : null, jsonFetcher<T>, swrOptions)
}

export function useHeatmapMarket(market: import("@/types/market").MarketType) {
  const key =
    market === "vn"
      ? SWR_KEYS.heatmapVietnam
      : market === "us"
        ? SWR_KEYS.heatmapUs
        : SWR_KEYS.heatmapCrypto
  return useLiveSwr<HeatmapApiResponse>(key)
}

export function useVietnamMarkets() {
  return useLiveSwr<VietnamMarketsResponse>(SWR_KEYS.vietnamMarkets)
}

export function useGlobalMarkets() {
  return useLiveSwr<GlobalMarketsResponse>(SWR_KEYS.globalMarkets)
}

export function useCryptoMarkets() {
  return useLiveSwr<CryptoResponse>(SWR_KEYS.crypto)
}

/** @deprecated Prefer hooks/useQuotes */
export function useMarketQuotes() {
  return useQuotes()
}

/** @deprecated Prefer hooks/useCurrencyStrength */
export function useCurrencyStrengthApi() {
  return useCurrencyStrength()
}

export function useNewsApi() {
  return useLiveSwr<{ source?: "live" | "mock"; uiItems?: import("@/lib/market-types").MarketNewsItem[] }>(
    SWR_KEYS.news,
  )
}

export function useCalendarApi() {
  return useLiveSwr<{ source?: "live" | "mock"; uiEvents?: import("@/lib/market-types").EconomicEvent[] }>(
    SWR_KEYS.calendar,
  )
}

/** True while initial live fetch is in flight (safe mode returns false). */
export function useMarketsLoading(
  ...hooks: Array<{ isLoading: boolean; data: unknown }>
): boolean {
  if (!features.liveClientFetch) return false
  return hooks.some((h) => h.isLoading && h.data === undefined)
}
