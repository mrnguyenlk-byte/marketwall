"use client"

import useSWR from "swr"

import { jsonFetcher } from "@/lib/swr/fetcher"

export type VnChartBar = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type VnChartMaPoint = {
  time: string
  value: number
}

export type VnChartResponse = {
  symbol: string
  exchange: string
  source: "entrade"
  bars: VnChartBar[]
  barCount: number
  ma10: VnChartMaPoint[]
  ma20: VnChartMaPoint[]
  ma50: VnChartMaPoint[]
  unavailable?: boolean
  updatedAt?: string
}

export function useVietnamChart(symbol: string | null) {
  return useSWR<VnChartResponse>(
    symbol ? `/api/vietnam/chart/${encodeURIComponent(symbol)}` : null,
    jsonFetcher<VnChartResponse>,
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  )
}
