// Centralized mock data for MarketWall.
// Illustrative placeholder values only — not real-time prices.
// Replace these exports with API responses when wiring live data.

export type Bi = { vi: string; en: string }

export type Trend = "up" | "down" | "neutral"

export function toTrend(changePercent: number): Trend {
  if (changePercent > 0) return "up"
  if (changePercent < 0) return "down"
  return "neutral"
}

// ---------------------------------------------------------------------------
// Sparkline helper (deterministic SSR/CSR output until API provides series)
// ---------------------------------------------------------------------------

export function spark(seed: number, points = 24, trend = 0): number[] {
  const out: number[] = []
  let v = 50 + (seed % 20)
  for (let i = 0; i < points; i++) {
    const n = Math.sin(seed * 0.7 + i * 0.9) * 6 + Math.cos(seed + i * 0.3) * 4
    v = Math.max(8, v + n * 0.4 + trend * 0.6)
    out.push(Number(v.toFixed(2)))
  }
  return out
}

function strengthSeries(seed: number, points = 48): number[] {
  const out: number[] = []
  let v = 48 + (seed % 12)
  for (let i = 0; i < points; i++) {
    v += Math.sin(seed * 0.45 + i * 0.35) * 1.8 + Math.cos(seed + i * 0.2) * 1.2
    out.push(Number(v.toFixed(2)))
  }
  return out
}

// ---------------------------------------------------------------------------
// Ticker bar (featured strip)
// ---------------------------------------------------------------------------

export type TickerBarItem = {
  symbol: string
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

function tickerItem(
  symbol: string,
  price: number,
  changePercent: number,
  seed: number,
): TickerBarItem {
  const trend = toTrend(changePercent)
  return {
    symbol,
    price,
    changePercent,
    trend,
    sparkline: spark(seed, 14, trend === "up" ? 1 : -1),
  }
}

export const tickerBarItems: TickerBarItem[] = [
  tickerItem("VN-INDEX", 1281.4, 0.53, 1),
  tickerItem("VN30", 1302.7, 0.56, 2),
  tickerItem("S&P 500", 5431.6, 0.34, 3),
  tickerItem("NASDAQ", 17688.9, 0.54, 4),
  tickerItem("BTC/USD", 68240, 2.12, 5),
  tickerItem("GOLD", 2347.8, 0.53, 6),
]

export type MarketTicker = {
  symbol: string
  name: Bi
  price: number
  change: number
  changePercent: number
  trend: Trend
  group: "commodities" | "currencies" | "crypto" | "indices"
}

export const marketTickers: MarketTicker[] = [
  { symbol: "GOLD", name: { vi: "Vàng", en: "Gold" }, price: 2347.8, change: 12.4, changePercent: 0.53, trend: "up", group: "commodities" },
  { symbol: "SILVER", name: { vi: "Bạc", en: "Silver" }, price: 29.84, change: -0.21, changePercent: -0.7, trend: "down", group: "commodities" },
  { symbol: "DXY", name: { vi: "Chỉ số USD", en: "Dollar Index" }, price: 104.32, change: -0.18, changePercent: -0.17, trend: "down", group: "currencies" },
  { symbol: "EUR/USD", name: { vi: "EUR/USD", en: "EUR/USD" }, price: 1.0852, change: 0.0021, changePercent: 0.19, trend: "up", group: "currencies" },
  { symbol: "USD/JPY", name: { vi: "USD/JPY", en: "USD/JPY" }, price: 157.21, change: 0.34, changePercent: 0.22, trend: "up", group: "currencies" },
  { symbol: "BTC", name: { vi: "Bitcoin", en: "Bitcoin" }, price: 68240, change: 1420, changePercent: 2.12, trend: "up", group: "crypto" },
  { symbol: "ETH", name: { vi: "Ethereum", en: "Ethereum" }, price: 3548, change: -42, changePercent: -1.17, trend: "down", group: "crypto" },
  { symbol: "S&P 500", name: { vi: "S&P 500", en: "S&P 500" }, price: 5431.6, change: 18.2, changePercent: 0.34, trend: "up", group: "indices" },
  { symbol: "NASDAQ", name: { vi: "Nasdaq", en: "Nasdaq" }, price: 17688.9, change: 95.4, changePercent: 0.54, trend: "up", group: "indices" },
  { symbol: "VNINDEX", name: { vi: "VN-Index", en: "VN-Index" }, price: 1281.4, change: -6.8, changePercent: -0.53, trend: "down", group: "indices" },
  { symbol: "VN30", name: { vi: "VN30", en: "VN30" }, price: 1302.7, change: -4.1, changePercent: -0.31, trend: "down", group: "indices" },
]

// ---------------------------------------------------------------------------
// Market overview (sidebar)
// ---------------------------------------------------------------------------

export type SidebarOverviewItem = {
  symbol: string
  flag: string
  market: Bi
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

function sidebarOverviewItem(
  symbol: string,
  flag: string,
  market: Bi,
  price: number,
  changePercent: number,
  seed: number,
): SidebarOverviewItem {
  const trend = toTrend(changePercent)
  return {
    symbol,
    flag,
    market,
    price,
    changePercent,
    trend,
    sparkline: spark(seed, 12, trend === "up" ? 1 : -1),
  }
}

export const sidebarOverview: SidebarOverviewItem[] = [
  sidebarOverviewItem("VN-INDEX", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 1281.4, 0.53, 1),
  sidebarOverviewItem("VN30", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 1302.7, 0.56, 2),
  sidebarOverviewItem("VN10", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 1184.2, 0.20, 3),
  sidebarOverviewItem("HNX-INDEX", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 248.6, -0.48, 4),
  sidebarOverviewItem("UPCOM-INDEX", "🇻🇳", { vi: "Việt Nam", en: "Vietnam" }, 92.8, 0.65, 5),
  sidebarOverviewItem("S&P 500", "🇺🇸", { vi: "Hoa Kỳ", en: "United States" }, 5431.6, 0.34, 6),
  sidebarOverviewItem("NASDAQ", "🇺🇸", { vi: "Hoa Kỳ", en: "United States" }, 17688.9, 0.54, 7),
  sidebarOverviewItem("DOW JONES", "🇺🇸", { vi: "Hoa Kỳ", en: "United States" }, 38712.2, -0.28, 8),
  sidebarOverviewItem("FTSE 100", "🇬🇧", { vi: "Anh Quốc", en: "United Kingdom" }, 8224.5, 0.38, 9),
  sidebarOverviewItem("NIKKEI 225", "🇯🇵", { vi: "Nhật Bản", en: "Japan" }, 38420.1, 0.63, 10),
  sidebarOverviewItem("HANG SENG", "🇭🇰", { vi: "Hồng Kông", en: "Hong Kong" }, 17842.3, -0.46, 11),
  sidebarOverviewItem("SHANGHAI", "🇨🇳", { vi: "Trung Quốc", en: "China" }, 3042.8, 0.42, 12),
  sidebarOverviewItem("KOSPI", "🇰🇷", { vi: "Hàn Quốc", en: "South Korea" }, 2684.5, 0.68, 13),
  sidebarOverviewItem("DAX", "🇩🇪", { vi: "Đức", en: "Germany" }, 18244.7, 0.24, 14),
  sidebarOverviewItem("GOLD", "🥇", { vi: "Hàng hóa", en: "Commodity" }, 2347.8, 0.53, 15),
  sidebarOverviewItem("WTI OIL", "🛢️", { vi: "Hàng hóa", en: "Commodity" }, 78.42, -1.08, 16),
  sidebarOverviewItem("BTC/USD", "₿", { vi: "Crypto", en: "Crypto" }, 68240, 2.12, 17),
]

export type OverviewCategory = "indices" | "commodities" | "crypto" | "forex"

export type OverviewListItem = {
  symbol: string
  flag: string
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

function overviewItem(
  symbol: string,
  flag: string,
  price: number,
  changePercent: number,
  seed: number,
): OverviewListItem {
  const trend = toTrend(changePercent)
  return {
    symbol,
    flag,
    price,
    changePercent,
    trend,
    sparkline: spark(seed, 14, trend === "up" ? 1 : -1),
  }
}

export const overviewByCategory: Record<OverviewCategory, OverviewListItem[]> = {
  indices: [
    overviewItem("VN-INDEX", "🇻🇳", 1281.4, 0.53, 1),
    overviewItem("VN30", "🇻🇳", 1302.7, 0.56, 2),
    overviewItem("VN10", "🇻🇳", 1184.2, 0.20, 3),
    overviewItem("HNX-INDEX", "🇻🇳", 248.6, -0.48, 4),
    overviewItem("UPCOM-INDEX", "🇻🇳", 92.8, 0.65, 5),
    overviewItem("S&P 500", "🇺🇸", 5431.6, 0.34, 6),
    overviewItem("NASDAQ", "🇺🇸", 17688.9, 0.54, 7),
    overviewItem("DOW JONES", "🇺🇸", 38712.2, -0.28, 8),
    overviewItem("FTSE 100", "🇬🇧", 8224.5, 0.38, 9),
    overviewItem("NIKKEI 225", "🇯🇵", 38420.1, 0.63, 10),
    overviewItem("HANG SENG", "🇭🇰", 17842.3, -0.46, 11),
    overviewItem("SHANGHAI", "🇨🇳", 3042.8, 0.42, 12),
    overviewItem("KOSPI", "🇰🇷", 2684.5, 0.68, 13),
    overviewItem("DAX", "🇩🇪", 18244.7, 0.24, 14),
    overviewItem("GOLD", "🥇", 2347.8, 0.53, 15),
    overviewItem("BTC/USD", "₿", 68240, 2.12, 16),
  ],
  commodities: [
    overviewItem("GOLD", "🥇", 2347.8, 0.53, 15),
    overviewItem("WTI OIL", "🛢️", 78.42, -1.08, 16),
    overviewItem("SILVER", "⚪", 29.84, -0.70, 17),
    overviewItem("BRENT", "🛢️", 82.16, -0.84, 18),
    overviewItem("COPPER", "🔶", 4.28, 0.42, 19),
  ],
  crypto: [
    overviewItem("BTC/USD", "₿", 68240, 2.12, 20),
    overviewItem("ETH/USD", "Ξ", 3548, -1.17, 21),
    overviewItem("BNB/USD", "🔶", 612.4, 0.84, 22),
    overviewItem("SOL/USD", "◎", 148.6, 4.62, 23),
  ],
  forex: [
    overviewItem("EUR/USD", "🇪🇺", 1.0852, 0.19, 24),
    overviewItem("GBP/USD", "🇬🇧", 1.2741, 0.27, 25),
    overviewItem("USD/JPY", "🇯🇵", 157.21, 0.22, 26),
    overviewItem("USD/VND", "🇻🇳", 25430, 0.05, 27),
    overviewItem("AUD/USD", "🇦🇺", 0.6642, -0.14, 28),
  ],
}

// Legacy flat overview export
export type MarketAsset = {
  symbol: string
  name: Bi
  region: Bi
  price: number
  change: number
  changePercent: number
  trend: Trend
  seed: number
}

export const marketOverview: MarketAsset[] = [
  { symbol: "VN-INDEX", name: { vi: "VN-Index", en: "VN-Index" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 1281.4, change: -6.8, changePercent: -0.53, trend: "down", seed: 1 },
  { symbol: "VN30", name: { vi: "VN30", en: "VN30" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 1302.7, change: -4.1, changePercent: -0.31, trend: "down", seed: 2 },
  { symbol: "VN10", name: { vi: "VN10", en: "VN10" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 1184.2, change: 2.4, changePercent: 0.20, trend: "up", seed: 3 },
  { symbol: "HNX-INDEX", name: { vi: "HNX-Index", en: "HNX-Index" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 248.6, change: -1.2, changePercent: -0.48, trend: "down", seed: 4 },
  { symbol: "UPCOM-INDEX", name: { vi: "UPCoM-Index", en: "UPCoM-Index" }, region: { vi: "Việt Nam", en: "Vietnam" }, price: 92.8, change: 0.6, changePercent: 0.65, trend: "up", seed: 5 },
  { symbol: "S&P 500", name: { vi: "S&P 500", en: "S&P 500" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 5431.6, change: 18.2, changePercent: 0.34, trend: "up", seed: 6 },
  { symbol: "NASDAQ", name: { vi: "Nasdaq", en: "Nasdaq" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 17688.9, change: 95.4, changePercent: 0.54, trend: "up", seed: 7 },
  { symbol: "DOW JONES", name: { vi: "Dow Jones", en: "Dow Jones" }, region: { vi: "Hoa Kỳ", en: "United States" }, price: 38712.2, change: -110.5, changePercent: -0.28, trend: "down", seed: 8 },
  { symbol: "FTSE 100", name: { vi: "FTSE 100", en: "FTSE 100" }, region: { vi: "Anh Quốc", en: "United Kingdom" }, price: 8224.5, change: 31.2, changePercent: 0.38, trend: "up", seed: 9 },
  { symbol: "NIKKEI 225", name: { vi: "Nikkei 225", en: "Nikkei 225" }, region: { vi: "Nhật Bản", en: "Japan" }, price: 38420.1, change: 240.6, changePercent: 0.63, trend: "up", seed: 10 },
  { symbol: "HANG SENG", name: { vi: "Hang Seng", en: "Hang Seng" }, region: { vi: "Hồng Kông", en: "Hong Kong" }, price: 17842.3, change: -82.4, changePercent: -0.46, trend: "down", seed: 11 },
  { symbol: "SHANGHAI", name: { vi: "Thượng Hải", en: "Shanghai" }, region: { vi: "Trung Quốc", en: "China" }, price: 3042.8, change: 12.6, changePercent: 0.42, trend: "up", seed: 12 },
  { symbol: "KOSPI", name: { vi: "KOSPI", en: "KOSPI" }, region: { vi: "Hàn Quốc", en: "South Korea" }, price: 2684.5, change: 18.2, changePercent: 0.68, trend: "up", seed: 13 },
  { symbol: "DAX", name: { vi: "DAX", en: "DAX" }, region: { vi: "Đức", en: "Germany" }, price: 18244.7, change: 44.1, changePercent: 0.24, trend: "up", seed: 14 },
  { symbol: "GOLD", name: { vi: "Vàng", en: "Gold" }, region: { vi: "Hàng hóa", en: "Commodity" }, price: 2347.8, change: 12.4, changePercent: 0.53, trend: "up", seed: 15 },
  { symbol: "WTI OIL", name: { vi: "Dầu WTI", en: "WTI Oil" }, region: { vi: "Hàng hóa", en: "Commodity" }, price: 78.42, change: -0.86, changePercent: -1.08, trend: "down", seed: 16 },
  { symbol: "BTC/USD", name: { vi: "Bitcoin", en: "Bitcoin" }, region: { vi: "Tiền mã hóa", en: "Crypto" }, price: 68240, change: 1420, changePercent: 2.12, trend: "up", seed: 17 },
]

// ---------------------------------------------------------------------------
// Currency strength
// ---------------------------------------------------------------------------

export type CurrencyStrengthItem = {
  code: string
  name: Bi
  strength: number
  changePercent: number
  trend: Trend
  rankKey: string
  series: number[]
}

export const currencyStrength: CurrencyStrengthItem[] = [
  { code: "USD", name: { vi: "Đô la Mỹ", en: "US Dollar" }, strength: 54.2, changePercent: 0.12, trend: "up", rankKey: "strength.strongest", series: strengthSeries(1) },
  { code: "VND", name: { vi: "Đồng Việt Nam", en: "Vietnamese Dong" }, strength: 51.8, changePercent: 0.05, trend: "up", rankKey: "strength.veryStrong", series: strengthSeries(2) },
  { code: "EUR", name: { vi: "Euro", en: "Euro" }, strength: 48.6, changePercent: -0.18, trend: "down", rankKey: "strength.strong", series: strengthSeries(3) },
  { code: "JPY", name: { vi: "Yên Nhật", en: "Japanese Yen" }, strength: 46.2, changePercent: 0.22, trend: "up", rankKey: "strength.strong", series: strengthSeries(4) },
  { code: "GBP", name: { vi: "Bảng Anh", en: "British Pound" }, strength: 44.1, changePercent: 0.08, trend: "up", rankKey: "strength.neutral", series: strengthSeries(5) },
  { code: "AUD", name: { vi: "Đô la Úc", en: "Australian Dollar" }, strength: 41.4, changePercent: -0.14, trend: "down", rankKey: "strength.weak", series: strengthSeries(6) },
  { code: "CHF", name: { vi: "Franc Thụy Sĩ", en: "Swiss Franc" }, strength: 43.2, changePercent: 0.06, trend: "up", rankKey: "strength.neutral", series: strengthSeries(7) },
  { code: "CAD", name: { vi: "Đô la Canada", en: "Canadian Dollar" }, strength: 39.8, changePercent: -0.09, trend: "down", rankKey: "strength.weak", series: strengthSeries(8) },
  { code: "NZD", name: { vi: "Đô la New Zealand", en: "New Zealand Dollar" }, strength: 36.2, changePercent: -0.21, trend: "down", rankKey: "strength.weakest", series: strengthSeries(9) },
]

// Legacy alias — kept for API migration; prefer currencyStrength.
export type CurrencyPair = {
  pair: string
  price: number
  changePercent: number
  weekChangePercent: number
  monthChangePercent: number
  trend: Trend
  seed: number
}

export const currencyPerformance: CurrencyPair[] = [
  { pair: "EUR/USD", price: 1.0852, changePercent: 0.19, weekChangePercent: 0.62, monthChangePercent: -0.84, trend: "up", seed: 4 },
  { pair: "GBP/USD", price: 1.2741, changePercent: 0.27, weekChangePercent: 0.41, monthChangePercent: 1.12, trend: "up", seed: 6 },
  { pair: "USD/JPY", price: 157.21, changePercent: 0.22, weekChangePercent: -0.33, monthChangePercent: 2.05, trend: "up", seed: 8 },
  { pair: "USD/VND", price: 25430, changePercent: 0.05, weekChangePercent: 0.18, monthChangePercent: 0.74, trend: "up", seed: 11 },
  { pair: "AUD/USD", price: 0.6642, changePercent: -0.14, weekChangePercent: -0.52, monthChangePercent: 0.31, trend: "down", seed: 13 },
  { pair: "USD/CHF", price: 0.8974, changePercent: 0.08, weekChangePercent: 0.22, monthChangePercent: -0.66, trend: "up", seed: 16 },
]

// ---------------------------------------------------------------------------
// Economic calendar
// ---------------------------------------------------------------------------

export type EconomicEvent = {
  time: string
  country: string
  flag: string
  event: Bi
  impact: "high" | "medium" | "low"
  actual: string
  forecast: string
  previous: string
}

export const economicEvents: EconomicEvent[] = [
  { time: "08:30", country: "VN", flag: "🇻🇳", event: { vi: "CPI YoY (Tháng 5)", en: "CPI YoY (May)" }, impact: "high", actual: "4.1%", forecast: "4.0%", previous: "3.9%" },
  { time: "09:45", country: "US", flag: "🇺🇸", event: { vi: "Số đơn xin trợ cấp thất nghiệp", en: "Initial Jobless Claims" }, impact: "medium", actual: "229K", forecast: "235K", previous: "238K" },
  { time: "12:30", country: "US", flag: "🇺🇸", event: { vi: "Quyết định lãi suất Fed", en: "Fed Interest Rate Decision" }, impact: "high", actual: "5.25%", forecast: "5.25%", previous: "5.50%" },
  { time: "14:00", country: "VN", flag: "🇻🇳", event: { vi: "Chỉ số sản xuất công nghiệp", en: "Industrial Production YoY" }, impact: "medium", actual: "—", forecast: "9.4%", previous: "8.9%" },
  { time: "20:00", country: "UK", flag: "🇬🇧", event: { vi: "Bài phát biểu Thống đốc BoE", en: "BoE Governor Speech" }, impact: "low", actual: "—", forecast: "—", previous: "—" },
  { time: "23:00", country: "JP", flag: "🇯🇵", event: { vi: "Cán cân thương mại", en: "Trade Balance" }, impact: "medium", actual: "—", forecast: "-¥0.42T", previous: "-¥0.66T" },
]

// ---------------------------------------------------------------------------
// Market news
// ---------------------------------------------------------------------------

export type MarketNewsItem = {
  title: Bi
  categoryKey: string
  time: Bi
}

export const marketNews: MarketNewsItem[] = [
  {
    title: { vi: "Chứng khoán Mỹ tăng nhẹ trong phiên giao dịch", en: "US stocks edge higher in today's session" },
    categoryKey: "markets", time: { vi: "2 phút trước", en: "2m ago" },
  },
  {
    title: { vi: "Fed phát tín hiệu về khả năng cắt giảm lãi suất", en: "Fed signals potential rate cuts ahead" },
    categoryKey: "macro", time: { vi: "18 phút trước", en: "18m ago" },
  },
  {
    title: { vi: "Bitcoin giữ vững trên vùng giá hiện tại", en: "Bitcoin holds above current price zone" },
    categoryKey: "crypto", time: { vi: "32 phút trước", en: "32m ago" },
  },
  {
    title: { vi: "Giá vàng ổn định trước dữ liệu kinh tế", en: "Gold steady ahead of economic data" },
    categoryKey: "commodities", time: { vi: "45 phút trước", en: "45m ago" },
  },
  {
    title: { vi: "VN-Index điều chỉnh nhẹ trong phiên sáng", en: "VN-Index slips slightly in morning trade" },
    categoryKey: "markets", time: { vi: "1 giờ trước", en: "1h ago" },
  },
  {
    title: { vi: "Thị trường chờ công bố chỉ số CPI", en: "Markets await CPI release" },
    categoryKey: "macro", time: { vi: "2 giờ trước", en: "2h ago" },
  },
]

// ---------------------------------------------------------------------------
// Heatmaps
// ---------------------------------------------------------------------------

export type HeatmapTile = {
  symbol: string
  name: Bi
  changePercent: number
  weight: number
}

export type HeatmapMarketId = "vn" | "us" | "crypto"

export type VnExchangeId = "hose" | "hnx" | "upcom" | "derivatives"

export type HeatmapExchange = {
  id: VnExchangeId
  labelKey: string
  tiles: HeatmapTile[]
}

export type HeatmapMarket = {
  id: HeatmapMarketId
  labelKey: string
  flag: string
  tiles?: HeatmapTile[]
  exchanges?: HeatmapExchange[]
}

function heatTile(
  symbol: string,
  name: Bi,
  weight: number,
  changePercent: number,
): HeatmapTile {
  return { symbol, name, weight, changePercent }
}

const hoseSymbols: [string, Bi, number, number][] = [
  ["VCB", { vi: "Vietcombank", en: "Vietcombank" }, 12, 2.34],
  ["VIC", { vi: "Vingroup", en: "Vingroup" }, 11, 2.28],
  ["VHM", { vi: "Vinhomes", en: "Vinhomes" }, 10, 2.15],
  ["BID", { vi: "BIDV", en: "BIDV" }, 9, 1.82],
  ["CTG", { vi: "VietinBank", en: "VietinBank" }, 9, 1.64],
  ["HPG", { vi: "Hòa Phát", en: "Hoa Phat" }, 8, 1.42],
  ["GAS", { vi: "PV Gas", en: "PV Gas" }, 8, 0.96],
  ["FPT", { vi: "FPT", en: "FPT" }, 8, 1.18],
  ["MWG", { vi: "Thế Giới Di Động", en: "Mobile World" }, 7, 0.84],
  ["ACB", { vi: "ACB", en: "ACB" }, 7, 0.72],
  ["TCB", { vi: "Techcombank", en: "Techcombank" }, 7, 0.58],
  ["MBB", { vi: "MB Bank", en: "MB Bank" }, 6, 0.44],
  ["LPB", { vi: "LienVietPostBank", en: "LienVietPostBank" }, 6, 0.32],
  ["SSB", { vi: "SeABank", en: "SeABank" }, 6, 0.28],
  ["MSN", { vi: "Masan", en: "Masan" }, 6, 0.18],
  ["VNM", { vi: "Vinamilk", en: "Vinamilk" }, 5, 0.12],
  ["PLX", { vi: "Petrolimex", en: "Petrolimex" }, 5, -0.08],
  ["GVR", { vi: "Cao su Việt Nam", en: "Vietnam Rubber" }, 5, -0.14],
  ["SAB", { vi: "Sabeco", en: "Sabeco" }, 5, -0.22],
  ["PNJ", { vi: "PNJ", en: "PNJ" }, 4, -0.34],
  ["GMD", { vi: "Gemadept", en: "Gemadept" }, 4, -0.48],
  ["STB", { vi: "Sacombank", en: "Sacombank" }, 4, -0.56],
  ["VRE", { vi: "Vincom Retail", en: "Vincom Retail" }, 4, -0.68],
  ["VJC", { vi: "Vietjet", en: "Vietjet" }, 4, -0.82],
  ["KDH", { vi: "Khang Điền", en: "Khang Dien" }, 4, -0.94],
  ["VIB", { vi: "VIB", en: "VIB" }, 4, -1.02],
  ["BVH", { vi: "Bảo Việt", en: "Bao Viet" }, 3, -1.08],
  ["SSI", { vi: "SSI", en: "SSI" }, 3, -1.12],
  ["HDB", { vi: "HDBank", en: "HDBank" }, 3, -1.16],
  ["VND", { vi: "VNDIRECT", en: "VNDIRECT" }, 3, -1.18],
  ["VPB", { vi: "VPBank", en: "VPBank" }, 3, -1.20],
  ["POW", { vi: "PV Power", en: "PV Power" }, 3, -1.21],
  ["BCM", { vi: "Becamex", en: "Becamex" }, 3, -1.22],
  ["DXG", { vi: "Đất Xanh", en: "Dat Xanh" }, 3, -1.22],
  ["NVL", { vi: "Novaland", en: "Novaland" }, 3, -1.23],
  ["PDR", { vi: "Phát Đạt", en: "Phat Dat" }, 3, -1.35],
]

const hoseTiles = hoseSymbols.map(([s, n, w, pct]) => heatTile(s, n, w, pct))

const hnxTiles: HeatmapTile[] = [
  heatTile("SHB", { vi: "SHB", en: "SHB" }, 9, 1.24),
  heatTile("PVS", { vi: "PVS", en: "PVS" }, 8, 0.86),
  heatTile("CEO", { vi: "CEO Group", en: "CEO Group" }, 7, -0.42),
  heatTile("VCS", { vi: "Vicostone", en: "Vicostone" }, 7, 0.64),
  heatTile("TNG", { vi: "Thành Thành", en: "Thanh Thanh" }, 6, -0.28),
  heatTile("PVC", { vi: "PVC", en: "PVC" }, 6, 0.18),
  heatTile("VGC", { vi: "Viglacera", en: "Viglacera" }, 5, -0.52),
  heatTile("SHS", { vi: "SHS", en: "SHS" }, 5, 0.34),
  heatTile("VIG", { vi: "VIG", en: "VIG" }, 4, -0.18),
  heatTile("DDG", { vi: "DDG", en: "DDG" }, 4, 0.12),
  heatTile("NBC", { vi: "NBC", en: "NBC" }, 4, -0.64),
  heatTile("LAS", { vi: "LAS", en: "LAS" }, 3, -0.82),
]

const upcomTiles: HeatmapTile[] = [
  heatTile("VGT", { vi: "Vinatex", en: "Vinatex" }, 8, 0.92),
  heatTile("VE4", { vi: "VE4", en: "VE4" }, 7, 0.48),
  heatTile("QST", { vi: "QST", en: "QST" }, 6, -0.24),
  heatTile("ART", { vi: "ART", en: "ART" }, 6, 0.36),
  heatTile("VLA", { vi: "VLA", en: "VLA" }, 5, -0.44),
  heatTile("HVT", { vi: "HVT", en: "HVT" }, 5, 0.22),
  heatTile("LAI", { vi: "LAI", en: "LAI" }, 4, -0.58),
  heatTile("SJF", { vi: "SJF", en: "SJF" }, 4, 0.14),
  heatTile("VCR", { vi: "VCR", en: "VCR" }, 4, -0.32),
  heatTile("BRS", { vi: "BRS", en: "BRS" }, 3, -0.68),
]

const derivativesTiles: HeatmapTile[] = [
  heatTile("VN30F1M", { vi: "HĐTL VN30 T1", en: "VN30 Futures T1" }, 12, 1.42),
  heatTile("VN30F2M", { vi: "HĐTL VN30 T2", en: "VN30 Futures T2" }, 10, 0.86),
  heatTile("GB10F1M", { vi: "HĐTL GB10 T1", en: "GB10 Futures T1" }, 9, -0.24),
  heatTile("GB10F2M", { vi: "HĐTL GB10 T2", en: "GB10 Futures T2" }, 8, -0.48),
  heatTile("VN30F1Q", { vi: "HĐTL VN30 Q1", en: "VN30 Futures Q1" }, 7, 1.12),
  heatTile("VN30F2Q", { vi: "HĐTL VN30 Q2", en: "VN30 Futures Q2" }, 6, 0.64),
]

export const heatmapMarkets: HeatmapMarket[] = [
  {
    id: "vn",
    labelKey: "tab.vnMarket",
    flag: "🇻🇳",
    exchanges: [
      { id: "hose", labelKey: "tab.hose", tiles: hoseTiles },
      { id: "hnx", labelKey: "tab.hnx", tiles: hnxTiles },
      { id: "upcom", labelKey: "tab.upcom", tiles: upcomTiles },
      { id: "derivatives", labelKey: "tab.derivatives", tiles: derivativesTiles },
    ],
  },
  {
    id: "us",
    labelKey: "tab.usMarket",
    flag: "🇺🇸",
    tiles: [
      heatTile("AAPL", { vi: "Apple", en: "Apple" }, 12, 1.24),
      heatTile("MSFT", { vi: "Microsoft", en: "Microsoft" }, 11, 0.82),
      heatTile("NVDA", { vi: "NVIDIA", en: "NVIDIA" }, 10, 3.41),
      heatTile("AMZN", { vi: "Amazon", en: "Amazon" }, 9, -0.64),
      heatTile("GOOGL", { vi: "Alphabet", en: "Alphabet" }, 8, 0.45),
      heatTile("META", { vi: "Meta", en: "Meta" }, 7, -1.12),
      heatTile("TSLA", { vi: "Tesla", en: "Tesla" }, 7, -2.34),
      heatTile("BRK.B", { vi: "Berkshire", en: "Berkshire" }, 6, 0.21),
      heatTile("JPM", { vi: "JPMorgan", en: "JPMorgan" }, 6, 0.93),
      heatTile("V", { vi: "Visa", en: "Visa" }, 5, -0.28),
      heatTile("XOM", { vi: "Exxon", en: "Exxon" }, 5, 1.67),
      heatTile("UNH", { vi: "UnitedHealth", en: "UnitedHealth" }, 5, -0.74),
      heatTile("JNJ", { vi: "J&J", en: "J&J" }, 4, 0.12),
      heatTile("WMT", { vi: "Walmart", en: "Walmart" }, 4, 0.58),
      heatTile("MA", { vi: "Mastercard", en: "Mastercard" }, 4, -0.41),
      heatTile("PG", { vi: "P&G", en: "P&G" }, 3, 0.22),
      heatTile("HD", { vi: "Home Depot", en: "Home Depot" }, 3, 0.18),
      heatTile("CVX", { vi: "Chevron", en: "Chevron" }, 3, -0.34),
    ],
  },
  {
    id: "crypto",
    labelKey: "tab.cryptoMarket",
    flag: "₿",
    tiles: [
      heatTile("BTC", { vi: "Bitcoin", en: "Bitcoin" }, 14, 2.12),
      heatTile("ETH", { vi: "Ethereum", en: "Ethereum" }, 11, -1.17),
      heatTile("BNB", { vi: "BNB", en: "BNB" }, 8, 0.84),
      heatTile("SOL", { vi: "Solana", en: "Solana" }, 7, 4.62),
      heatTile("XRP", { vi: "XRP", en: "XRP" }, 6, -0.74),
      heatTile("ADA", { vi: "Cardano", en: "Cardano" }, 5, 1.28),
      heatTile("DOGE", { vi: "Dogecoin", en: "Dogecoin" }, 5, -2.05),
      heatTile("AVAX", { vi: "Avalanche", en: "Avalanche" }, 4, 3.11),
      heatTile("LINK", { vi: "Chainlink", en: "Chainlink" }, 4, 0.46),
      heatTile("DOT", { vi: "Polkadot", en: "Polkadot" }, 4, -1.62),
      heatTile("MATIC", { vi: "Polygon", en: "Polygon" }, 3, 2.74),
      heatTile("TON", { vi: "Toncoin", en: "Toncoin" }, 3, 5.21),
      heatTile("SHIB", { vi: "Shiba Inu", en: "Shiba Inu" }, 3, -1.42),
      heatTile("LTC", { vi: "Litecoin", en: "Litecoin" }, 3, 0.86),
    ],
  },
]

// ---------------------------------------------------------------------------
// Fear & Greed
// ---------------------------------------------------------------------------

export type FearGreedItem = {
  key: string
  value: number
}

export const fearGreedData: FearGreedItem[] = [
  { key: "fg.vnindex", value: 48 },
  { key: "fg.crypto", value: 71 },
  { key: "fg.usStocks", value: 58 },
]

export function fgLabel(value: number): string {
  if (value < 25) return "fg.extremeFear"
  if (value < 45) return "fg.fear"
  if (value < 55) return "fg.neutral"
  if (value < 75) return "fg.greed"
  return "fg.extremeGreed"
}

// ---------------------------------------------------------------------------
// Market breadth
// ---------------------------------------------------------------------------

export type MarketBreadth = {
  market: Bi
  advancing: number
  declining: number
  unchanged: number
  newHighs: number
  newLows: number
  aboveMa: number
}

export const marketBreadthData: MarketBreadth[] = [
  { market: { vi: "NYSE", en: "NYSE" }, advancing: 1842, declining: 1106, unchanged: 124, newHighs: 96, newLows: 31, aboveMa: 64 },
  { market: { vi: "Nasdaq", en: "Nasdaq" }, advancing: 2104, declining: 1588, unchanged: 210, newHighs: 142, newLows: 58, aboveMa: 57 },
  { market: { vi: "HOSE", en: "HOSE" }, advancing: 168, declining: 214, unchanged: 62, newHighs: 14, newLows: 9, aboveMa: 48 },
]

// ---------------------------------------------------------------------------
// Top movers
// ---------------------------------------------------------------------------

export type TopMover = {
  symbol: string
  name: Bi
  price: number
  changePercent: number
  trend: Trend
}

export type TopMoversData = {
  gainers: TopMover[]
  losers: TopMover[]
}

export const topMovers: TopMoversData = {
  gainers: [
    { symbol: "TON", name: { vi: "Toncoin", en: "Toncoin" }, price: 7.42, changePercent: 5.21, trend: "up" },
    { symbol: "SOL", name: { vi: "Solana", en: "Solana" }, price: 148.6, changePercent: 4.62, trend: "up" },
    { symbol: "NVDA", name: { vi: "NVIDIA", en: "NVIDIA" }, price: 131.8, changePercent: 3.41, trend: "up" },
    { symbol: "AVAX", name: { vi: "Avalanche", en: "Avalanche" }, price: 36.2, changePercent: 3.11, trend: "up" },
    { symbol: "FPT", name: { vi: "FPT", en: "FPT" }, price: 134.5, changePercent: 2.18, trend: "up" },
  ],
  losers: [
    { symbol: "TSLA", name: { vi: "Tesla", en: "Tesla" }, price: 178.2, changePercent: -2.34, trend: "down" },
    { symbol: "DOGE", name: { vi: "Dogecoin", en: "Dogecoin" }, price: 0.158, changePercent: -2.05, trend: "down" },
    { symbol: "DOT", name: { vi: "Polkadot", en: "Polkadot" }, price: 6.18, changePercent: -1.62, trend: "down" },
    { symbol: "HPG", name: { vi: "Hòa Phát", en: "Hoa Phat" }, price: 28.4, changePercent: -1.45, trend: "down" },
    { symbol: "ETH", name: { vi: "Ethereum", en: "Ethereum" }, price: 3548, changePercent: -1.17, trend: "down" },
  ],
}

// ---------------------------------------------------------------------------
// Watchlist
// ---------------------------------------------------------------------------

export type WatchlistItem = {
  symbol: string
  name: Bi
  price: number
  changePercent: number
  trend: Trend
  seed: number
}

export const watchlistItems: WatchlistItem[] = [
  { symbol: "AAPL", name: { vi: "Apple", en: "Apple" }, price: 214.3, changePercent: 1.24, trend: "up", seed: 2 },
  { symbol: "BTC", name: { vi: "Bitcoin", en: "Bitcoin" }, price: 68240, changePercent: 2.12, trend: "up", seed: 5 },
  { symbol: "GOLD", name: { vi: "Vàng", en: "Gold" }, price: 2347.8, changePercent: 0.53, trend: "up", seed: 8 },
  { symbol: "VNINDEX", name: { vi: "VN-Index", en: "VN-Index" }, price: 1281.4, changePercent: -0.53, trend: "down", seed: 11 },
  { symbol: "EUR/USD", name: { vi: "EUR/USD", en: "EUR/USD" }, price: 1.0852, changePercent: 0.19, trend: "up", seed: 14 },
]

// ---------------------------------------------------------------------------
// Brokers
// ---------------------------------------------------------------------------

export type Broker = {
  name: string
  initials: string
  rating: number
  minDeposit: string
  license: Bi
  spread: string
  platforms: Bi
}

export const brokers: Broker[] = [
  {
    name: "Exness",
    initials: "EX",
    rating: 4.8,
    minDeposit: "$10",
    license: { en: "ASIC · FCA · CySEC", vi: "ASIC · FCA · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
  },
  {
    name: "IC Markets",
    initials: "IC",
    rating: 4.7,
    minDeposit: "$200",
    license: { en: "ASIC · CySEC", vi: "ASIC · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, cTrader", vi: "MT4, MT5, cTrader" },
  },
  {
    name: "XM",
    initials: "XM",
    rating: 4.6,
    minDeposit: "$5",
    license: { en: "CySEC · ASIC", vi: "CySEC · ASIC" },
    spread: "0.6 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
  },
  {
    name: "Pepperstone",
    initials: "PP",
    rating: 4.6,
    minDeposit: "$0",
    license: { en: "FCA · ASIC · CySEC", vi: "FCA · ASIC · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, cTrader", vi: "MT4, MT5, cTrader" },
  },
  {
    name: "FBS",
    initials: "FB",
    rating: 4.5,
    minDeposit: "$1",
    license: { en: "CySEC · FSC", vi: "CySEC · FSC" },
    spread: "0.5 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
  },
  {
    name: "FXTM",
    initials: "FX",
    rating: 4.4,
    minDeposit: "$10",
    license: { en: "FCA · CySEC · FSCA", vi: "FCA · CySEC · FSCA" },
    spread: "0.8 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
  },
]

// ---------------------------------------------------------------------------
// Header notifications (not listed in dashboard sections)
// ---------------------------------------------------------------------------

export type Notification = {
  title: Bi
  detail: Bi
  time: Bi
}

export const notifications: Notification[] = [
  {
    title: { vi: "VN-Index chạm ngưỡng hỗ trợ", en: "VN-Index hits support level" },
    detail: { vi: "Chỉ số giảm xuống gần vùng 1.280 điểm.", en: "Index slips toward the 1,280 zone." },
    time: { vi: "5 phút trước", en: "5 min ago" },
  },
  {
    title: { vi: "Bitcoin vượt 68.000 USD", en: "Bitcoin crosses $68,000" },
    detail: { vi: "Biến động 24h tăng hơn 2%.", en: "Up more than 2% over 24 hours." },
    time: { vi: "22 phút trước", en: "22 min ago" },
  },
  {
    title: { vi: "Lịch kinh tế: PPI Mỹ", en: "Calendar: US PPI" },
    detail: { vi: "Dữ liệu công bố lúc 19:30 (giờ VN).", en: "Data due at 12:30 GMT." },
    time: { vi: "1 giờ trước", en: "1 hr ago" },
  },
]
