"use client"

import useSWR from "swr"

import { features } from "@/lib/config/features"
import type { StrengthCoverage } from "@/lib/currency-strength"
import { jsonFetcher } from "@/lib/swr/fetcher"
import { SWR_KEYS } from "@/lib/swr/keys"

export type CurrencyStrengthItem = {
  currency: string
  strength: number
  change: number
  label: string
}

export type CurrencyStrengthDataSource = "yahoo" | "yahoo+ecb" | "mock"

export type CurrencyStrengthResponse = {
  source?: CurrencyStrengthDataSource
  items?: CurrencyStrengthItem[]
  fallback?: boolean
  unavailable?: boolean
  pairCount?: number
  coverage?: StrengthCoverage
  updatedAt?: string
  nextUpdateAt?: string
}

const REFRESH_MS = 300_000

const swrOptions = {
  revalidateOnFocus: false,
  refreshInterval: REFRESH_MS,
  dedupingInterval: REFRESH_MS,
  errorRetryCount: 2,
} as const

/** Live FX strength via REST — 5-minute refresh, no realtime overlay. */
export function useCurrencyStrength() {
  return useSWR<CurrencyStrengthResponse>(
    features.liveClientFetch ? SWR_KEYS.currencyStrength : null,
    jsonFetcher<CurrencyStrengthResponse>,
    swrOptions,
  )
}
