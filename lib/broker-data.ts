/** Client-safe broker catalog (no provider imports). */
import type { Bi } from "@/lib/market-utils"

export type BrokerBadge =
  | "bestOverall"
  | "bestBeginners"
  | "lowestSpread"
  | "fastWithdrawal"

export type BrokerCategory = "vn" | "global"

export type MarketInterestTier = "high" | "medium" | "low"

export type GlobalBrokerFilterId =
  | "highRating"
  | "highRebate"
  | "highLeverage"
  | "manyPromotions"
  | "lowSpread"
  | "marketInterest"

export type Broker = {
  name: string
  initials: string
  category: BrokerCategory
  /** Platform website — future auto-sync source */
  websiteUrl: string
  /** Primary domain for logo auto-fetch (e.g. ssi.com.vn). */
  domain: string
  /** Optional direct logo CDN URL; falls back to Clearbit then favicon. */
  logoUrl?: string
  rating: number
  trustScore: number
  minDeposit: string
  license: Bi
  spread: string
  platforms: Bi
  leverage: string
  leverageMax: number
  executionType: Bi
  region: Bi
  accountType: Bi
  offer: Bi
  licenseTags: string[]
  platformTags: string[]
  minDepositValue: number
  spreadValue: number
  spreadPips: number
  withdrawalTime: Bi
  badges: BrokerBadge[]
  featured?: boolean
  rebatePerLot?: Bi
  rebatePerLotValue: number
  promotionCount: number
  marketInterest?: MarketInterestTier
  priceTolerance?: Bi
  promotions?: Bi[]
}

export const brokerPageStats = {
  regulatedCount: 12,
  averageRating: 4.5,
  lowestSpread: "0.0 pips",
  fastestWithdrawal: { en: "Instant", vi: "Tức thì" } satisfies Bi,
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
    domain: "ssi.com.vn",
    rating: 4.7,
    trustScore: 91,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, Mobile, SSI Pro", vi: "Web, Mobile, SSI Pro" },
    leverage: "—",
    leverageMax: 0,
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "Free market data & research reports", vi: "Dữ liệu thị trường & báo cáo phân tích miễn phí" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "Mobile", "SSI Pro"],
    minDepositValue: 0,
    spreadValue: 0.15,
    spreadPips: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: ["bestOverall"],
    featured: true,
    rebatePerLotValue: 0,
    promotionCount: 1,
  },
  {
    name: "VNDirect",
    initials: "VND",
    category: "vn",
    websiteUrl: "https://www.vndirect.com.vn",
    domain: "vndirect.com.vn",
    rating: 4.6,
    trustScore: 89,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, DStock, Mobile", vi: "Web, DStock, Mobile" },
    leverage: "—",
    leverageMax: 0,
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "DStock app · Free training courses", vi: "Ứng dụng DStock · Khóa học miễn phí" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "DStock", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.15,
    spreadPips: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: ["bestBeginners"],
    featured: true,
    rebatePerLotValue: 0,
    promotionCount: 1,
  },
  {
    name: "TCBS",
    initials: "TCB",
    category: "vn",
    websiteUrl: "https://www.tcbs.com.vn",
    domain: "tcbs.com.vn",
    rating: 4.6,
    trustScore: 88,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, TCInvest, Mobile", vi: "Web, TCInvest, Mobile" },
    leverage: "—",
    leverageMax: 0,
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "Techcombank ecosystem integration", vi: "Tích hợp hệ sinh thái Techcombank" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "TCInvest", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.15,
    spreadPips: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: ["fastWithdrawal"],
    featured: true,
    rebatePerLotValue: 0,
    promotionCount: 1,
  },
  {
    name: "VPS",
    initials: "VPS",
    category: "vn",
    websiteUrl: "https://www.vps.com.vn",
    domain: "vps.com.vn",
    rating: 4.5,
    trustScore: 86,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.15%",
    platforms: { en: "Web, SmartOne, Mobile", vi: "Web, SmartOne, Mobile" },
    leverage: "—",
    leverageMax: 0,
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "SmartOne trading platform", vi: "Nền tảng giao dịch SmartOne" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "SmartOne", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.15,
    spreadPips: 0.15,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: [],
    featured: false,
    rebatePerLotValue: 0,
    promotionCount: 1,
  },
  {
    name: "HSC",
    initials: "HSC",
    category: "vn",
    websiteUrl: "https://www.hsc.com.vn",
    domain: "hsc.com.vn",
    rating: 4.5,
    trustScore: 85,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.20%",
    platforms: { en: "Web, HSC Trade, Mobile", vi: "Web, HSC Trade, Mobile" },
    leverage: "—",
    leverageMax: 0,
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "Research & advisory services", vi: "Dịch vụ nghiên cứu & tư vấn" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "HSC Trade", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.2,
    spreadPips: 0.2,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: [],
    featured: false,
    rebatePerLotValue: 0,
    promotionCount: 1,
  },
  {
    name: "MBS",
    initials: "MBS",
    category: "vn",
    websiteUrl: "https://www.mbs.com.vn",
    domain: "mbs.com.vn",
    rating: 4.4,
    trustScore: 84,
    minDeposit: "0 VND",
    license: { en: "SSC Vietnam · HOSE · HNX", vi: "UBCKNN · HOSE · HNX" },
    spread: "0.20%",
    platforms: { en: "Web, MBS Mobile, eMBS", vi: "Web, MBS Mobile, eMBS" },
    leverage: "—",
    leverageMax: 0,
    executionType: { en: "Stock exchange", vi: "Sàn chứng khoán" },
    region: { en: "Vietnam", vi: "Việt Nam" },
    accountType: { en: "Standard · Margin", vi: "Cơ sở · Ký quỹ" },
    offer: { en: "MB Bank ecosystem benefits", vi: "Ưu đãi hệ sinh thái MB Bank" },
    licenseTags: ["SSC", "HOSE", "HNX"],
    platformTags: ["Web", "eMBS", "Mobile"],
    minDepositValue: 0,
    spreadValue: 0.2,
    spreadPips: 0.2,
    withdrawalTime: { en: "T+2 settlement", vi: "Thanh toán T+2" },
    badges: [],
    featured: false,
    rebatePerLotValue: 0,
    promotionCount: 1,
  },
  {
    name: "Exness",
    initials: "EX",
    category: "global",
    websiteUrl: "https://www.exness.com",
    domain: "exness.com",
    rating: 4.8,
    trustScore: 92,
    minDeposit: "$10",
    license: { en: "ASIC · FCA · CySEC", vi: "ASIC · FCA · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:2000",
    leverageMax: 2000,
    executionType: { en: "ECN / STP", vi: "ECN / STP" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "Standard · ECN", vi: "Standard · ECN" },
    offer: { en: "0% commission · Instant withdrawal", vi: "0% hoa hồng · Rút tiền tức thì" },
    rebatePerLot: { en: "Up to $7/lot (partner)", vi: "Lên đến $7/lot (đối tác)" },
    priceTolerance: { en: "Slippage protection on major pairs", vi: "Bảo vệ trượt giá trên cặp chính" },
    promotions: [
      { en: "Zero spread account", vi: "Tài khoản spread 0" },
      { en: "Cashback on volume", vi: "Hoàn tiền theo khối lượng" },
      { en: "Free VPS for active traders", vi: "VPS miễn phí cho trader active" },
    ],
    licenseTags: ["ASIC", "FCA", "CySEC"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 10,
    spreadValue: 0,
    spreadPips: 0,
    withdrawalTime: { en: "Instant", vi: "Tức thì" },
    badges: ["bestOverall", "fastWithdrawal"],
    featured: true,
    rebatePerLotValue: 7,
    promotionCount: 3,
    marketInterest: "high",
  },
  {
    name: "IC Markets",
    initials: "IC",
    category: "global",
    websiteUrl: "https://www.icmarkets.com",
    domain: "icmarkets.com",
    rating: 4.7,
    trustScore: 90,
    minDeposit: "$200",
    license: { en: "ASIC · CySEC", vi: "ASIC · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, cTrader", vi: "MT4, MT5, cTrader" },
    leverage: "1:500",
    leverageMax: 500,
    executionType: { en: "ECN", vi: "ECN" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "ECN", vi: "ECN" },
    offer: { en: "Raw spread from 0.0 pips", vi: "Spread thô từ 0.0 pips" },
    rebatePerLot: { en: "$2–$3/lot ECN", vi: "$2–$3/lot ECN" },
    priceTolerance: { en: "No requotes on ECN", vi: "Không requote trên ECN" },
    promotions: [
      { en: "Raw spread ECN account", vi: "Tài khoản ECN spread thô" },
      { en: "cTrader commission discount", vi: "Giảm hoa hồng cTrader" },
    ],
    licenseTags: ["ASIC", "CySEC"],
    platformTags: ["MT4", "MT5", "cTrader"],
    minDepositValue: 200,
    spreadValue: 0,
    spreadPips: 0,
    withdrawalTime: { en: "Same day", vi: "Trong ngày" },
    badges: ["lowestSpread"],
    featured: true,
    rebatePerLotValue: 3,
    promotionCount: 2,
    marketInterest: "high",
  },
  {
    name: "XM",
    initials: "XM",
    category: "global",
    websiteUrl: "https://www.xm.com",
    domain: "xm.com",
    rating: 4.6,
    trustScore: 88,
    minDeposit: "$5",
    license: { en: "CySEC · ASIC", vi: "CySEC · ASIC" },
    spread: "0.6 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:888",
    leverageMax: 888,
    executionType: { en: "Market Maker", vi: "Market Maker" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "Standard · Islamic", vi: "Standard · Islamic" },
    offer: { en: "Bonus up to $10,000", vi: "Thưởng lên đến $10,000" },
    rebatePerLot: { en: "Up to $15/lot (IB)", vi: "Lên đến $15/lot (IB)" },
    priceTolerance: { en: "Negative balance protection", vi: "Bảo vệ số dư âm" },
    promotions: [
      { en: "Deposit bonus up to $10,000", vi: "Thưởng nạp lên đến $10,000" },
      { en: "Loyalty points program", vi: "Chương trình điểm thưởng" },
      { en: "Zero-fee deposits", vi: "Nạp tiền không phí" },
    ],
    licenseTags: ["CySEC", "ASIC"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 5,
    spreadValue: 0.6,
    spreadPips: 0.6,
    withdrawalTime: { en: "1–2 days", vi: "1–2 ngày" },
    badges: ["bestBeginners"],
    featured: true,
    rebatePerLotValue: 15,
    promotionCount: 3,
    marketInterest: "high",
  },
  {
    name: "Pepperstone",
    initials: "PP",
    category: "global",
    websiteUrl: "https://www.pepperstone.com",
    domain: "pepperstone.com",
    rating: 4.6,
    trustScore: 89,
    minDeposit: "$0",
    license: { en: "FCA · ASIC · CySEC", vi: "FCA · ASIC · CySEC" },
    spread: "0.0 pips",
    platforms: { en: "MT4, MT5, cTrader", vi: "MT4, MT5, cTrader" },
    leverage: "1:500",
    leverageMax: 500,
    executionType: { en: "ECN", vi: "ECN" },
    region: { en: "Global", vi: "Toàn cầu" },
    accountType: { en: "Standard · ECN", vi: "Standard · ECN" },
    offer: { en: "No minimum deposit", vi: "Không yêu cầu nạp tối thiểu" },
    rebatePerLot: { en: "$1.50/lot Razor", vi: "$1.50/lot Razor" },
    priceTolerance: { en: "Smart Trader tools included", vi: "Công cụ Smart Trader miễn phí" },
    promotions: [
      { en: "Razor raw spread account", vi: "Tài khoản Razor spread thô" },
      { en: "Active trader rebates", vi: "Hoàn phí trader active" },
    ],
    licenseTags: ["FCA", "ASIC", "CySEC"],
    platformTags: ["MT4", "MT5", "cTrader"],
    minDepositValue: 0,
    spreadValue: 0,
    spreadPips: 0,
    withdrawalTime: { en: "Same day", vi: "Trong ngày" },
    badges: ["lowestSpread"],
    rebatePerLotValue: 1.5,
    promotionCount: 2,
    marketInterest: "high",
  },
  {
    name: "FBS",
    initials: "FB",
    category: "global",
    websiteUrl: "https://www.fbs.com",
    domain: "fbs.com",
    rating: 4.5,
    trustScore: 85,
    minDeposit: "$1",
    license: { en: "CySEC · FSC", vi: "CySEC · FSC" },
    spread: "0.5 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:3000",
    leverageMax: 3000,
    executionType: { en: "Market Maker", vi: "Market Maker" },
    region: { en: "Asia", vi: "Châu Á" },
    accountType: { en: "Standard · ECN", vi: "Standard · ECN" },
    offer: { en: "Deposit bonus 100%", vi: "Thưởng nạp 100%" },
    rebatePerLot: { en: "Up to $10/lot (partner)", vi: "Lên đến $10/lot (đối tác)" },
    priceTolerance: { en: "Fixed spread option", vi: "Tùy chọn spread cố định" },
    promotions: [
      { en: "100% deposit bonus", vi: "Thưởng nạp 100%" },
      { en: "Cashback loyalty", vi: "Hoàn tiền loyalty" },
      { en: "Level-up VIP rewards", vi: "Thưởng VIP theo cấp" },
    ],
    licenseTags: ["CySEC", "FSC"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 1,
    spreadValue: 0.5,
    spreadPips: 0.5,
    withdrawalTime: { en: "1–3 days", vi: "1–3 ngày" },
    badges: ["bestBeginners"],
    rebatePerLotValue: 10,
    promotionCount: 3,
    marketInterest: "medium",
  },
  {
    name: "FXTM",
    initials: "FX",
    category: "global",
    websiteUrl: "https://www.fxtm.com",
    domain: "fxtm.com",
    rating: 4.4,
    trustScore: 84,
    minDeposit: "$10",
    license: { en: "FCA · CySEC · FSCA", vi: "FCA · CySEC · FSCA" },
    spread: "0.8 pips",
    platforms: { en: "MT4, MT5, Web", vi: "MT4, MT5, Web" },
    leverage: "1:1000",
    leverageMax: 1000,
    executionType: { en: "ECN / STP", vi: "ECN / STP" },
    region: { en: "Europe", vi: "Châu Âu" },
    accountType: { en: "Standard · ECN · Islamic", vi: "Standard · ECN · Islamic" },
    offer: { en: "Free VPS hosting", vi: "VPS miễn phí" },
    licenseTags: ["FCA", "CySEC", "FSCA"],
    platformTags: ["MT4", "MT5", "Web"],
    minDepositValue: 10,
    spreadValue: 0.8,
    spreadPips: 0.8,
    withdrawalTime: { en: "1–2 days", vi: "1–2 ngày" },
    badges: [],
    rebatePerLotValue: 2,
    promotionCount: 1,
    marketInterest: "low",
  },
]

const PLATFORM_LIST_LIMIT = 5

export const vnStockPlatforms = brokers
  .filter((b) => b.category === "vn")
  .slice(0, PLATFORM_LIST_LIMIT)

export const globalPlatforms = brokers
  .filter((b) => b.category === "global")
  .slice(0, PLATFORM_LIST_LIMIT)
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

export const GLOBAL_BROKER_FILTERS: GlobalBrokerFilterId[] = [
  "highRating",
  "highRebate",
  "highLeverage",
  "manyPromotions",
  "lowSpread",
  "marketInterest",
]

const FILTER_THRESHOLDS = {
  ratingMin: 4.6,
  trustScoreMin: 88,
  rebateMin: 5,
  leverageMin: 888,
  promotionsMin: 3,
  spreadPipsMax: 0.5,
} as const

export function brokerMatchesGlobalFilter(
  broker: Broker,
  filter: GlobalBrokerFilterId,
): boolean {
  switch (filter) {
    case "highRating":
      return broker.rating >= FILTER_THRESHOLDS.ratingMin &&
        broker.trustScore >= FILTER_THRESHOLDS.trustScoreMin
    case "highRebate":
      return broker.rebatePerLotValue >= FILTER_THRESHOLDS.rebateMin
    case "highLeverage":
      return broker.leverageMax >= FILTER_THRESHOLDS.leverageMin
    case "manyPromotions":
      return broker.promotionCount >= FILTER_THRESHOLDS.promotionsMin
    case "lowSpread":
      return broker.spreadPips <= FILTER_THRESHOLDS.spreadPipsMax
    case "marketInterest":
      return broker.marketInterest === "high"
    default:
      return false
  }
}

/** Composite score for ordering brokers that pass all active filters. */
export function globalBrokerRankScore(broker: Broker): number {
  const interestBonus =
    broker.marketInterest === "high" ? 12 : broker.marketInterest === "medium" ? 6 : 0

  return (
    broker.rating * 8 +
    broker.trustScore / 12 +
    broker.rebatePerLotValue * 1.5 +
    broker.leverageMax / 250 +
    broker.promotionCount * 3 +
    Math.max(0, 6 - broker.spreadPips * 8) +
    interestBonus
  )
}

/** Keep brokers matching every active filter; sort best matches first. */
export function filterGlobalBrokers(
  source: Broker[],
  activeFilters: GlobalBrokerFilterId[],
): Broker[] {
  if (activeFilters.length === 0) return source

  return source
    .filter((broker) =>
      activeFilters.every((filter) => brokerMatchesGlobalFilter(broker, filter)),
    )
    .sort((a, b) => globalBrokerRankScore(b) - globalBrokerRankScore(a))
}
