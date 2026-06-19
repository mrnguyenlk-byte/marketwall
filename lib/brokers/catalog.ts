import "server-only"

import {
  brokers as staticBrokers,
  type Broker,
  type BrokerCategory,
} from "@/lib/broker-data"
import { prisma } from "@/lib/prisma"
import type { Bi } from "@/lib/market-utils"

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function asBi(value: unknown, fallback: Bi): Bi {
  if (value && typeof value === "object" && "en" in value && "vi" in value) {
    return value as Bi
  }
  return fallback
}

function prismaBrokerToClient(row: {
  slug: string
  name: string
  initials: string
  category: string
  websiteUrl: string
  affiliateUrl: string | null
  logoUrl: string | null
  rating: number
  trustScore: number
  minDeposit: string
  minDepositValue: number
  license: unknown
  licenseTags: string[]
  spread: string
  spreadValue: number
  platforms: unknown
  platformTags: string[]
  leverage: string
  executionType: unknown
  region: unknown
  accountType: unknown
  offer: unknown
  withdrawalTime: unknown
  badges: string[]
  featured: boolean
}): Broker {
  const emptyBi: Bi = { en: "", vi: "" }
  const category = (row.category === "vn" ? "vn" : "global") as BrokerCategory
  const leverageMatch = row.leverage.match(/1:(\d+)/)
  const leverageMax = leverageMatch ? Number(leverageMatch[1]) : 0

  return {
    name: row.name,
    initials: row.initials,
    category,
    websiteUrl: row.websiteUrl,
    domain: domainFromUrl(row.websiteUrl),
    logoUrl: row.logoUrl ?? undefined,
    rating: row.rating,
    trustScore: row.trustScore,
    minDeposit: row.minDeposit,
    license: asBi(row.license, emptyBi),
    spread: row.spread,
    platforms: asBi(row.platforms, emptyBi),
    leverage: row.leverage,
    leverageMax,
    executionType: asBi(row.executionType, emptyBi),
    region: asBi(row.region, emptyBi),
    accountType: asBi(row.accountType, emptyBi),
    offer: asBi(row.offer, emptyBi),
    licenseTags: row.licenseTags,
    platformTags: row.platformTags,
    minDepositValue: row.minDepositValue,
    spreadValue: row.spreadValue,
    spreadPips: row.spreadValue,
    withdrawalTime: asBi(row.withdrawalTime, emptyBi),
    badges: row.badges as Broker["badges"],
    featured: row.featured,
    rebatePerLotValue: 0,
    promotionCount: 0,
  }
}

export async function getPublicBrokers(): Promise<Broker[]> {
  try {
    const rows = await prisma.broker.findMany({
      where: { isActive: true },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    })
    if (rows.length === 0) return staticBrokers
    return rows.map(prismaBrokerToClient)
  } catch {
    return staticBrokers
  }
}

export async function getPublicBrokerSections(): Promise<{
  vnBrokers: Broker[]
  globalBrokers: Broker[]
}> {
  const all = await getPublicBrokers()
  return {
    vnBrokers: all.filter((b) => b.category === "vn"),
    globalBrokers: all.filter((b) => b.category === "global"),
  }
}
