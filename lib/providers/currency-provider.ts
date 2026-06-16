import "server-only"

import { fetchLiveCurrencyStrength } from "@/lib/api/currencyStrength"
import { buildStrengthSeries } from "@/lib/currency-strength/calculate-strength"
import { type Bi, type Trend, toTrend } from "@/lib/market-utils"
import { CACHE_KEYS } from "@/lib/providers/cache"
import { withFallback, type ProviderResult } from "@/lib/providers/fallback"
import { currencyStrengthFromItem } from "@/lib/providers/mappers"
import type { CurrencyStrength, DataSource } from "@/lib/providers/types"

/** @deprecated Use CurrencyStrength */
export type CurrencyStrengthItem = CurrencyStrength

export type CurrencyStrengthChartMeta = {
  timezone: string
  timeLabels: string[]
}

export type CurrencyData = {
  items: CurrencyStrengthItem[]
  chartMeta: CurrencyStrengthChartMeta
  source: DataSource
}

const MOCK_STRENGTHS: Omit<CurrencyStrength, "source">[] = [
  {
    code: "USD",
    name: { vi: "Đô la Mỹ", en: "US Dollar" },
    strength: 52.4,
    changePercent: 0.12,
    trend: "up",
    rankKey: "strength.strongest",
    series: buildStrengthSeries(52.4),
  },
  {
    code: "EUR",
    name: { vi: "Euro", en: "Euro" },
    strength: 51.1,
    changePercent: 0.08,
    trend: "up",
    rankKey: "strength.veryStrong",
    series: buildStrengthSeries(51.1),
  },
  {
    code: "GBP",
    name: { vi: "Bảng Anh", en: "British Pound" },
    strength: 50.8,
    changePercent: 0.06,
    trend: "up",
    rankKey: "strength.strong",
    series: buildStrengthSeries(50.8),
  },
  {
    code: "JPY",
    name: { vi: "Yên Nhật", en: "Japanese Yen" },
    strength: 49.6,
    changePercent: -0.04,
    trend: "down",
    rankKey: "strength.neutral",
    series: buildStrengthSeries(49.6),
  },
  {
    code: "AUD",
    name: { vi: "Đô la Úc", en: "Australian Dollar" },
    strength: 48.9,
    changePercent: -0.1,
    trend: "down",
    rankKey: "strength.neutral",
    series: buildStrengthSeries(48.9),
  },
  {
    code: "CHF",
    name: { vi: "Franc Thụy Sĩ", en: "Swiss Franc" },
    strength: 49.2,
    changePercent: -0.06,
    trend: "down",
    rankKey: "strength.neutral",
    series: buildStrengthSeries(49.2),
  },
  {
    code: "CAD",
    name: { vi: "Đô la Canada", en: "Canadian Dollar" },
    strength: 48.5,
    changePercent: -0.09,
    trend: "down",
    rankKey: "strength.weak",
    series: buildStrengthSeries(48.5),
  },
  {
    code: "NZD",
    name: { vi: "Đô la New Zealand", en: "New Zealand Dollar" },
    strength: 47.8,
    changePercent: -0.14,
    trend: "down",
    rankKey: "strength.weakest",
    series: buildStrengthSeries(47.8),
  },
]

const CHART_META: CurrencyStrengthChartMeta = {
  timezone: "UTC",
  timeLabels: ["Open", "Close"],
}

function buildCurrencyData(items: CurrencyStrength[], source: DataSource): CurrencyData {
  return {
    items,
    chartMeta: CHART_META,
    source,
  }
}

export function getMockStrengths(): CurrencyStrength[] {
  return MOCK_STRENGTHS.map((item) => currencyStrengthFromItem(item, "mock"))
}

export function getMockData(): CurrencyData {
  return buildCurrencyData(getMockStrengths(), "mock")
}

/** Live FX strength via Twelve Data pairs (env: TWELVE_DATA_API_KEY). */
async function fetchLiveCurrencyStrengthItems(): Promise<CurrencyStrength[] | null> {
  if (process.env.CURRENCY_STRENGTH_ENABLED === "false") return null

  try {
    const result = await fetchLiveCurrencyStrength()
    if (result.source !== "live" || result.unavailable || !result.items.length) return null

    const liveByCode = new Map(result.items.map((row) => [row.currency, row]))
    return MOCK_STRENGTHS.map((item) => {
      const live = liveByCode.get(item.code)
      if (!live) return null
      return currencyStrengthFromItem(
        {
          ...item,
          strength: live.strength,
          changePercent: live.change,
          trend: toTrend(live.change),
          rankKey: live.label ?? item.rankKey,
          series: buildStrengthSeries(live.strength, live.change),
        },
        "live",
      )
    }).filter((item): item is CurrencyStrength => item != null)
  } catch {
    return null
  }
}

export async function getDataAsync(): Promise<ProviderResult<CurrencyData>> {
  const resolved = await withFallback(
    fetchLiveCurrencyStrengthItems,
    getMockStrengths,
    { provider: "currency-strength", cacheKey: CACHE_KEYS.currency, cacheTtlMs: 60_000 },
  )

  return {
    ...resolved,
    data: buildCurrencyData(
      resolved.data.map((item) => currencyStrengthFromItem(item, resolved.source)),
      resolved.source,
    ),
  }
}

/** Synchronous accessor for server-side mock data. */
export function getData(): CurrencyData {
  return getMockData()
}

export type { CurrencyStrength }
