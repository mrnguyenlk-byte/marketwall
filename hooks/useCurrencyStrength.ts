"use client"

import { useMemo } from "react"
import useSWR from "swr"

import { features } from "@/lib/config/features"
import { useRealtimeStrength, useRealtime } from "@/lib/realtime/realtime-context"
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
  unavailable?: boolean
  updatedAt?: string
  realtime?: boolean
}

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
  errorRetryCount: 2,
} as const

const LIVE_CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF"])

/** Live FX strength: REST initial load + optional SSE recalculated snapshot. */
export function useCurrencyStrength() {
  const swr = useSWR<CurrencyStrengthResponse>(
    features.liveClientFetch ? SWR_KEYS.currencyStrength : null,
    jsonFetcher<CurrencyStrengthResponse>,
    swrOptions,
  )
  const liveStrength = useRealtimeStrength()
  const { isRealtime, status } = useRealtime()

  const data = useMemo((): CurrencyStrengthResponse | undefined => {
    if (!swr.data) return swr.data

    if (liveStrength?.items?.length && isRealtime) {
      const items = liveStrength.items.filter((row) => LIVE_CURRENCIES.has(row.currency))
      if (items.length === LIVE_CURRENCIES.size) {
        return {
          ...swr.data,
          items,
          source: "live",
          fallback: false,
          unavailable: false,
          realtime: true,
          updatedAt: liveStrength.updatedAt,
        }
      }
    }

    return {
      ...swr.data,
      fallback: swr.data.fallback && !isRealtime,
      realtime: isRealtime,
    }
  }, [swr.data, liveStrength, isRealtime])

  return {
    ...swr,
    data,
    realtime: isRealtime,
    realtimeStatus: status,
  }
}
