/** Broker domain types — Prisma-ready schema shape (static JSON catalog today). */

import type { Bi } from "@/lib/market-utils"

export type BrokerBadge =
  | "bestOverall"
  | "bestBeginners"
  | "lowestSpread"
  | "fastWithdrawal"

export type BrokerCategory = "vn" | "global"

/** Popularity / search-interest tier (mock signals for global FX platforms). */
export type MarketInterestTier = "high" | "medium" | "low"

/** Canonical broker record for listings, detail, and comparison pages. */
export type BrokerRecord = {
  slug: string
  name: string
  initials: string
  category: BrokerCategory
  websiteUrl: string
  /** Primary domain for logo auto-fetch (e.g. ssi.com.vn). */
  domain: string
  /** Optional direct logo CDN URL; falls back to Clearbit then favicon. */
  logoUrl?: string
  /** Optional affiliate override; redirect service appends tracking params. */
  affiliateUrl?: string
  rating: number
  trustScore: number
  minDeposit: string
  minDepositValue: number
  license: Bi
  licenseTags: string[]
  spread: string
  spreadValue: number
  /** EUR/USD-style spread in pips (global FX); mirrors spreadValue for FX brokers. */
  spreadPips: number
  platforms: Bi
  platformTags: string[]
  leverage: string
  /** Max leverage parsed from strings like "1:2000". */
  leverageMax: number
  executionType: Bi
  region: Bi
  accountType: Bi
  offer: Bi
  withdrawalTime: Bi
  badges: BrokerBadge[]
  featured?: boolean
  /** Global FX: rebate returned per standard lot traded. */
  rebatePerLot?: Bi
  /** Numeric rebate (USD/lot) for sorting and filter chips. */
  rebatePerLotValue: number
  /** Count of active promotional programs. */
  promotionCount: number
  /** Mock market-interest tier for global platforms. */
  marketInterest?: MarketInterestTier
  /** Global FX: slippage / price tolerance benefit for order execution. */
  priceTolerance?: Bi
  /** Global FX: promotional programs (may differ from primary offer). */
  promotions?: Bi[]
}

export type BrokerClickLog = {
  id: string
  slug: string
  timestamp: string
  referer?: string
  userAgent?: string
  source?: string
  campaign?: string
}

export type BrokerComparisonHighlight = "left" | "right" | "tie" | null

export type BrokerComparisonRow = {
  id: string
  labelKey: string
  left: string
  right: string
  highlight: BrokerComparisonHighlight
}

export type BrokerComparisonResult = {
  left: BrokerRecord
  right: BrokerRecord
  rows: BrokerComparisonRow[]
  scoreLeft: number
  scoreRight: number
}
