"use client"

import { useMemo } from "react"
import useSWR from "swr"

import { features } from "@/lib/config/features"
import type { NormalizedMarketQuote } from "@/lib/market-types"
import { mergeQuotesWithRealtime } from "@/lib/realtime/merge-quotes"
import { useRealtime } from "@/lib/realtime/realtime-context"
import { jsonFetcher } from "@/lib/swr/fetcher"
import { SWR_KEYS } from "@/lib/swr/keys"

export type QuotesResponse = {
  source?: "live" | "mock"
  quotes?: NormalizedMarketQuote[]
  fallback?: boolean
  unavailable?: boolean
  updatedAt?: string
  realtime?: boolean
}

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 30_000,
  errorRetryCount: 2,
} as const

/** Live market quotes: REST initial load + optional SSE tick overlay. */
export function useQuotes() {
  const swr = useSWR<QuotesResponse>(
    features.liveClientFetch ? SWR_KEYS.marketsOverview : null,
    jsonFetcher<QuotesResponse>,
    swrOptions,
  )
  const { quoteBySymbol, isRealtime, status } = useRealtime()

  const data = useMemo((): QuotesResponse | undefined => {
    if (!swr.data) return swr.data
    const quotes = swr.data.quotes?.length
      ? mergeQuotesWithRealtime(swr.data.quotes, quoteBySymbol)
      : swr.data.quotes

    return {
      ...swr.data,
      quotes,
      fallback: swr.data.fallback && !isRealtime,
      realtime: isRealtime,
      source: isRealtime ? "live" : swr.data.source,
    }
  }, [swr.data, quoteBySymbol, isRealtime])

  return {
    ...swr,
    data,
    realtime: isRealtime,
    realtimeStatus: status,
  }
}

/** @deprecated Use useQuotes — same data from /api/markets/overview */
export function useMarketsOverview() {
  return useQuotes()
}
