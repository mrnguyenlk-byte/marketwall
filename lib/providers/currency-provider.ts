import { type Bi, type Trend, strengthSeries } from "@/lib/market-utils"

export type CurrencyStrengthItem = {
  code: string
  name: Bi
  strength: number
  changePercent: number
  trend: Trend
  rankKey: string
  series: number[]
}

export type CurrencyStrengthChartMeta = {
  /** IANA or display label, e.g. "UTC", "GMT+7" — overridable from API/input later */
  timezone: string
  /** 24h axis tick labels in the configured timezone */
  timeLabels: string[]
}

export type CurrencyData = {
  items: CurrencyStrengthItem[]
  chartMeta: CurrencyStrengthChartMeta
}

export function getMockData(): CurrencyData {
  return {
    chartMeta: {
      timezone: "UTC",
      timeLabels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
    },
    items: [
      { code: "USD", name: { vi: "Đô la Mỹ", en: "US Dollar" }, strength: 54.2, changePercent: 0.12, trend: "up", rankKey: "strength.strongest", series: strengthSeries(1) },
      { code: "VND", name: { vi: "Đồng Việt Nam", en: "Vietnamese Dong" }, strength: 51.8, changePercent: 0.05, trend: "up", rankKey: "strength.veryStrong", series: strengthSeries(2) },
      { code: "EUR", name: { vi: "Euro", en: "Euro" }, strength: 48.6, changePercent: -0.18, trend: "down", rankKey: "strength.strong", series: strengthSeries(3) },
      { code: "JPY", name: { vi: "Yên Nhật", en: "Japanese Yen" }, strength: 46.2, changePercent: 0.22, trend: "up", rankKey: "strength.strong", series: strengthSeries(4) },
      { code: "GBP", name: { vi: "Bảng Anh", en: "British Pound" }, strength: 44.1, changePercent: 0.08, trend: "up", rankKey: "strength.neutral", series: strengthSeries(5) },
      { code: "AUD", name: { vi: "Đô la Úc", en: "Australian Dollar" }, strength: 41.4, changePercent: -0.14, trend: "down", rankKey: "strength.weak", series: strengthSeries(6) },
      { code: "CHF", name: { vi: "Franc Thụy Sĩ", en: "Swiss Franc" }, strength: 43.2, changePercent: 0.06, trend: "up", rankKey: "strength.neutral", series: strengthSeries(7) },
      { code: "CAD", name: { vi: "Đô la Canada", en: "Canadian Dollar" }, strength: 39.8, changePercent: -0.09, trend: "down", rankKey: "strength.weak", series: strengthSeries(8) },
      { code: "NZD", name: { vi: "Đô la New Zealand", en: "New Zealand Dollar" }, strength: 36.2, changePercent: -0.21, trend: "down", rankKey: "strength.weakest", series: strengthSeries(9) },
    ],
  }
}

export function getData(): CurrencyData {
  return getMockData()
}
