// Centralized mock data for BTrading Market Insights.
// Illustrative placeholder values only — not real-time prices.
// Replace provider getData() implementations with API responses when wiring live data.

export type { Bi, Trend } from "@/lib/market-utils"
export { toTrend, spark, strengthSeries } from "@/lib/market-utils"

import { getData as getMarketProviderData } from "@/lib/providers/market-provider"
import {
  marketOverview,
  marketTickers,
  sidebarOverview,
} from "@/lib/providers/market-provider"
import { getData as getHeatmapProviderData } from "@/lib/providers/heatmap-provider"
import { getData as getCurrencyProviderData } from "@/lib/providers/currency-provider"
import { getMockData as getCalendarMockData } from "@/lib/providers/calendar-provider"
import { getMockData as getNewsMockData } from "@/lib/providers/news-provider"

// Re-export provider types
export type {
  TickerBarItem,
  MarketTicker,
  SidebarOverviewItem,
  OverviewCategory,
  OverviewListItem,
  MarketAsset,
} from "@/lib/providers/market-provider"

export type {
  HeatmapTile,
  HeatmapMarketId,
  VnExchangeId,
  HeatmapExchange,
  HeatmapMarket,
} from "@/lib/providers/heatmap-provider"

export type {
  CurrencyStrengthItem,
  CurrencyStrengthChartMeta,
} from "@/lib/providers/currency-provider"

export type { EconomicEvent } from "@/lib/providers/calendar-provider"
export type { MarketNewsItem } from "@/lib/providers/news-provider"

// Provider-backed data (backward-compatible named exports)
const _market = getMarketProviderData()
export const tickerBarItems = _market.tickerBarItems
export const dashboardTickerBarItems = _market.dashboardTickerBarItems
export const overviewByCategory = _market.overviewByCategory

export { sidebarOverview, marketTickers, marketOverview }

const _heatmap = getHeatmapProviderData()
export const heatmapMarkets = _heatmap.markets

const _currency = getCurrencyProviderData()
export const currencyStrength = _currency.items
export const currencyStrengthChartMeta = _currency.chartMeta
/** @deprecated Use currencyStrengthChartMeta.timeLabels */
export const currencyStrengthTimeLabels = currencyStrengthChartMeta.timeLabels

const _calendar = getCalendarMockData()
export const economicEvents = _calendar.events

const _news = getNewsMockData()
export const marketNews = _news.items

// ---------------------------------------------------------------------------
// Currency performance (legacy — not yet moved to provider)
// ---------------------------------------------------------------------------

import type { Trend } from "@/lib/market-utils"

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
  market: import("@/lib/market-utils").Bi
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
  name: import("@/lib/market-utils").Bi
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
  name: import("@/lib/market-utils").Bi
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

export type BrokerBadge =
  | "bestOverall"
  | "bestBeginners"
  | "lowestSpread"
  | "fastWithdrawal"

export type BrokerCategory = "vn" | "global"

export type Broker = {
  name: string
  initials: string
  category: BrokerCategory
  /** Platform website — future auto-sync source */
  websiteUrl: string
  rating: number
  trustScore: number
  minDeposit: string
  license: import("@/lib/market-utils").Bi
  spread: string
  platforms: import("@/lib/market-utils").Bi
  leverage: string
  executionType: import("@/lib/market-utils").Bi
  region: import("@/lib/market-utils").Bi
  accountType: import("@/lib/market-utils").Bi
  offer: import("@/lib/market-utils").Bi
  licenseTags: string[]
  platformTags: string[]
  minDepositValue: number
  spreadValue: number
  withdrawalTime: import("@/lib/market-utils").Bi
  badges: BrokerBadge[]
  featured?: boolean
}

export const brokerPageStats = {
  regulatedCount: 12,
  averageRating: 4.5,
  lowestSpread: "0.0 pips",
  fastestWithdrawal: { en: "Instant", vi: "Tức thì" } satisfies import("@/lib/market-utils").Bi,
}

export const featuredBrokerNames = ["SSI", "VNDirect", "TCBS", "Exness", "IC Markets", "XM"] as const

export const brokerGuides = [
  "brokers.guide.choose",
  "brokers.guide.regulation",
  "brokers.guide.spread",
  "brokers.guide.risk",
] as const

export const brokers: Broker[] = [
  {
    name: "SSI",
    initials: "SSI",
    category: "vn",
    websiteUrl: "https://www.ssi.com.vn",
    rating: 4.7,
    trustScore: 91,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, Mobile, SSI Pro", vi: "Web, Mobile, SSI Pro" },
    leverage: "—",
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "Free market data & research reports", vi: "Dữ liệu thị trường & báo cáo phân tích miễn phí" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "Mobile", "SSI Pro"],
    minDepositValue: 0,
    spreadValue: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: ["bestOverall"],
    featured: true,
  },
  {
    name: "VNDirect",
    initials: "VND",
    category: "vn",
    websiteUrl: "https://www.vndirect.com.vn",
    rating: 4.6,
    trustScore: 89,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, DStock, Mobile", vi: "Web, DStock, Mobile" },
    leverage: "—",
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "DStock app · Free training courses", vi: "Ứng dụng DStock · Khóa học miễn phí" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "DStock", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: ["bestBeginners"],
    featured: true,
  },
  {
    name: "TCBS",
    initials: "TCB",
    category: "vn",
    websiteUrl: "https://www.tcbs.com.vn",
    rating: 4.6,
    trustScore: 88,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, TCInvest, Mobile", vi: "Web, TCInvest, Mobile" },
    leverage: "—",
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "Techcombank ecosystem integration", vi: "Tích hợp hệ sinh thái Techcombank" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "TCInvest", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: ["fastWithdrawal"],
    featured: true,
  },
  {
    name: "VPS",
    initials: "VPS",
    category: "vn",
    websiteUrl: "https://www.vps.com.vn",
    rating: 4.5,
    trustScore: 86,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, SmartOne, Mobile", vi: "Web, SmartOne, Mobile" },
    leverage: "—",
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "SmartOne trading platform", vi: "Nền tảng giao dịch SmartOne" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "SmartOne", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: [],
    featured: false,
  },
  {
    name: "HSC",
    initials: "HSC",
    category: "vn",
    websiteUrl: "https://www.hsc.com.vn",
    rating: 4.5,
    trustScore: 85,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.20%",
    platforms: { en: "Web, HSC Trade, Mobile", vi: "Web, HSC Trade, Mobile" },
    leverage: "—",
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "Research & advisory services", vi: "Dịch vụ nghiên cứu & tư vấn" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "HSC Trade", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.2,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: [],
    featured: false,
  },
  {
    name: "MBS",
    initials: "MBS",
    category: "vn",
    websiteUrl: "https://www.mbs.com.vn",
    rating: 4.4,
    trustScore: 84,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.20%",
    platforms: { en: "Web, MBS Mobile, eMBS", vi: "Web, MBS Mobile, eMBS" },
    leverage: "—",
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "MB Bank ecosystem benefits", vi: "Ưu đãi hệ sinh thái MB Bank" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "eMBS", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.2,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: [],
    featured: false,
  },
  {
    name: "Exness",
    initials: "EX",
    category: "global",
    websiteUrl: "https://www.exness.com",
    rating: 4.8,
    trustScore: 92,
    minDeposit: "$10",
    license: { en: "ASIC · FCA · CySEC", vi: "ASIC · FCA · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:2000",
    executionType: { en: "ECN / STP", vi: "ECN / STP" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "Standard · ECN", vi: "Standard · ECN" },
    offer: { en: "0% commission · Instant withdrawal", vi: "0% hoa hồng · Rút tiền tức thì" },
    licenseTags: ["ASIC", "FCA", "CySEC"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 10,
    spreadValue: 0,
    withdrawalTime: { en: "Instant", vi: "Tức thì" },
    badges: ["bestOverall", "fastWithdrawal"],
    featured: true,
  },
  {
    name: "IC Markets",
    initials: "IC",
    category: "global",
    websiteUrl: "https://www.icmarkets.com",
    rating: 4.7,
    trustScore: 90,
    minDeposit: "$200",
    license: { en: "ASIC · CySEC", vi: "ASIC · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, cTrader", vi: "MT4, MT5, cTrader" },
    leverage: "1:500",
    executionType: { en: "ECN", vi: "ECN" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "ECN", vi: "ECN" },
    offer: { en: "Raw spread from 0.0 pips", vi: "Spread thô từ 0.0 pips" },
    licenseTags: ["ASIC", "CySEC"],
    platformTags: ["MT4", "MT5", "cTrader"],
    minDepositValue: 200,
    spreadValue: 0,
    withdrawalTime: { en: "Same day", vi: "Trong ngày" },
    badges: ["lowestSpread"],
    featured: true,
  },
  {
    name: "XM",
    initials: "XM",
    category: "global",
    websiteUrl: "https://www.xm.com",
    rating: 4.6,
    trustScore: 88,
    minDeposit: "$5",
    license: { en: "CySEC · ASIC", vi: "CySEC · ASIC" },
    spread: "0.6 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:888",
    executionType: { en: "Market Maker", vi: "Market Maker" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "Standard · Islamic", vi: "Standard · Islamic" },
    offer: { en: "Bonus up to $10,000", vi: "Thưởng lên đến $10,000" },
    licenseTags: ["CySEC", "ASIC"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 5,
    spreadValue: 0.6,
    withdrawalTime: { en: "1–2 days", vi: "1–2 ngày" },
    badges: ["bestBeginners"],
    featured: true,
  },
  {
    name: "Pepperstone",
    initials: "PP",
    category: "global",
    websiteUrl: "https://www.pepperstone.com",
    rating: 4.6,
    trustScore: 89,
    minDeposit: "$0",
    license: { en: "FCA · ASIC · CySEC", vi: "FCA · ASIC · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, cTrader", vi: "MT4, MT5, cTrader" },
    leverage: "1:500",
    executionType: { en: "ECN", vi: "ECN" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "Standard · ECN", vi: "Standard · ECN" },
    offer: { en: "No minimum deposit", vi: "Không yêu cầu nạp tối thiểu" },
    licenseTags: ["FCA", "ASIC", "CySEC"],
    platformTags: ["MT4", "MT5", "cTrader"],
    minDepositValue: 0,
    spreadValue: 0,
    withdrawalTime: { en: "Same day", vi: "Trong ngày" },
    badges: ["lowestSpread"],
  },
  {
    name: "FBS",
    initials: "FB",
    category: "global",
    websiteUrl: "https://www.fbs.com",
    rating: 4.5,
    trustScore: 85,
    minDeposit: "$1",
    license: { en: "CySEC · FSC", vi: "CySEC · FSC" },
    spread: "0.5 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:3000",
    executionType: { en: "Market Maker", vi: "Market Maker" },
    region: { en: "Asia", vi: "Châu Á" },
    accountType: { en: "Standard · ECN", vi: "Standard · ECN" },
    offer: { en: "Deposit bonus 100%", vi: "Thưởng nạp 100%" },
    licenseTags: ["CySEC", "FSC"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 1,
    spreadValue: 0.5,
    withdrawalTime: { en: "1–3 days", vi: "1–3 ngày" },
    badges: ["bestBeginners"],
  },
  {
    name: "FXTM",
    initials: "FX",
    category: "global",
    websiteUrl: "https://www.fxtm.com",
    rating: 4.4,
    trustScore: 84,
    minDeposit: "$10",
    license: { en: "FCA · CySEC · FSCA", vi: "FCA · CySEC · FSCA" },
    spread: "0.8 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:1000",
    executionType: { en: "ECN / STP", vi: "ECN / STP" },
    region: { en: "Europe", vi: "Châu Âu" },
    accountType: { en: "Standard · ECN · Islamic", vi: "Standard · ECN · Islamic" },
    offer: { en: "Free VPS hosting", vi: "VPS miễn phí" },
    licenseTags: ["FCA", "CySEC", "FSCA"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 10,
    spreadValue: 0.8,
    withdrawalTime: { en: "1–2 days", vi: "1–2 ngày" },
    badges: [],
  },
]

export const vnStockPlatforms = brokers.filter((b) => b.category === "vn")
export const globalPlatforms = brokers.filter((b) => b.category === "global")
export const featuredPlatforms = brokers.filter((b) => b.featured)

export type BrokerComparison = {
  left: string
  right: string
}

/** @deprecated Pairwise comparisons replaced by full comparison table on brokers page */
export const brokerComparisons: BrokerComparison[] = [
  { left: "Exness", right: "XM" },
  { left: "IC Markets", right: "Pepperstone" },
  { left: "XM", right: "FBS" },
]

// ---------------------------------------------------------------------------
// Header notifications (not listed in dashboard sections)
// ---------------------------------------------------------------------------

export type Notification = {
  title: import("@/lib/market-utils").Bi
  detail: import("@/lib/market-utils").Bi
  time: import("@/lib/market-utils").Bi
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
