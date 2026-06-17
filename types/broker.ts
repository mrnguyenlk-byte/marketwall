/** Broker domain types — Prisma-ready schema shape (static JSON catalog today). */

import type { Bi } from "@/lib/market-utils"

export type BrokerBadge =
  | "bestOverall"
  | "bestBeginners"
  | "lowestSpread"
  | "fastWithdrawal"

export type BrokerCategory = "vn" | "global"

/** Canonical broker record for listings, detail, and comparison pages. */
export type BrokerRecord = {
  slug: string
  name: string
  initials: string
  category: BrokerCategory
  websiteUrl: string
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
  platforms: Bi
  platformTags: string[]
  leverage: string
  executionType: Bi
  region: Bi
  accountType: Bi
  offer: Bi
  withdrawalTime: Bi
  badges: BrokerBadge[]
  featured?: boolean
  /** Global FX: rebate returned per standard lot traded. */
  rebatePerLot?: Bi
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
