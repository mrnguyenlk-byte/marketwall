import type { MarketQuote } from "@/types/market"

export type TwelveDataErrorBody = {
  code?: number
  message?: string
  status?: string
}

export class TwelveDataApiError extends Error {
  readonly code: number
  readonly status: string

  constructor(message: string, code = 0, status = "error") {
    super(message)
    this.name = "TwelveDataApiError"
    this.code = code
    this.status = status
  }
}

export type TwelveDataQuoteRow = {
  symbol?: string
  name?: string
  open?: string
  high?: string
  low?: string
  close?: string
  volume?: string
  change?: string
  percent_change?: string
  datetime?: string
  timestamp?: number
}

export type TwelveDataQuoteResponse =
  | TwelveDataQuoteRow
  | Record<string, TwelveDataQuoteRow>

export type TwelveDataTimeSeriesValue = {
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume?: string
}

export type TwelveDataTimeSeriesResponse = {
  meta?: {
    symbol?: string
    interval?: string
    currency?: string
    exchange_timezone?: string
  }
  values?: TwelveDataTimeSeriesValue[]
  status?: string
  code?: number
  message?: string
}

export type NormalizedTimeSeriesPoint = {
  datetime: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type { FxPairQuote } from "@/lib/forex/types"

export type HeatmapQuoteRow = {
  symbol: string
  name: string
  price: number
  changePercent: number
  volume: number
  sector: string
  marketCap: number
}

export type MarketDetailPayload = {
  quote: MarketQuote | null
  timeSeries: NormalizedTimeSeriesPoint[]
}
