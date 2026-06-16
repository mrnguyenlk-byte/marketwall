"use client"

import useSWR from "swr"

import { features } from "@/lib/config/features"
import type { NormalizedMarketQuote } from "@/lib/market-types"
import { jsonFetcher } from "@/lib/swr/fetcher"
import { SWR_KEYS } from "@/lib/swr/keys"

export type QuotesResponse = {
  source?: "live" | "mock"
  quotes?: NormalizedMarketQuote[]
  fallback?: boolean
  updatedAt?: string
}

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 30_000,
  errorRetryCount: 2,
} as const

/** Live market quotes from GET /api/market/quotes (30s cache). */
export function useQuotes() {
  return useSWR<QuotesResponse>(
    features.liveClientFetch ? SWR_KEYS.marketQuotes : null,
    jsonFetcher<QuotesResponse>,
    swrOptions,
  )
}
