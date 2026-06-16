"use client"

import useSWR from "swr"

import { features } from "@/lib/config/features"
import { jsonFetcher } from "@/lib/swr/fetcher"
import { SWR_KEYS } from "@/lib/swr/keys"

export type CurrencyStrengthItem = {
  currency: string
  strength: number
  change: number
  label: string
}

export type CurrencyStrengthResponse = {
  source?: "live" | "mock"
  items?: CurrencyStrengthItem[]
  fallback?: boolean
  updatedAt?: string
}

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
  errorRetryCount: 2,
} as const

/** Live FX strength from GET /api/currency-strength (60s cache). */
export function useCurrencyStrength() {
  return useSWR<CurrencyStrengthResponse>(
    features.liveClientFetch ? SWR_KEYS.currencyStrength : null,
    jsonFetcher<CurrencyStrengthResponse>,
    swrOptions,
  )
}
