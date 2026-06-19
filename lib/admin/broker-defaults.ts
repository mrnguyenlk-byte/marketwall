import type { Bi } from "@/lib/market-utils"

const EMPTY_BI: Bi = { en: "", vi: "" }

export function brokerCreateDefaults(input: {
  slug: string
  name: string
  initials: string
  category: string
  websiteUrl: string
  affiliateUrl?: string | null
  logoUrl?: string | null
  description?: string | null
  rating?: number
  trustScore?: number
  minDeposit?: string
  minDepositValue?: number
  spread?: string
  spreadValue?: number
  leverage?: string
  isActive?: boolean
  featured?: boolean
}) {
  return {
    slug: input.slug,
    name: input.name,
    initials: input.initials,
    category: input.category,
    websiteUrl: input.websiteUrl,
    affiliateUrl: input.affiliateUrl ?? null,
    logoUrl: input.logoUrl ?? null,
    description: input.description ?? null,
    rating: input.rating ?? 4.5,
    trustScore: input.trustScore ?? 85,
    minDeposit: input.minDeposit ?? "$100",
    minDepositValue: input.minDepositValue ?? 100,
    license: EMPTY_BI,
    licenseTags: [] as string[],
    spread: input.spread ?? "0.5 pips",
    spreadValue: input.spreadValue ?? 0.5,
    platforms: EMPTY_BI,
    platformTags: [] as string[],
    leverage: input.leverage ?? "1:500",
    executionType: EMPTY_BI,
    region: EMPTY_BI,
    accountType: EMPTY_BI,
    offer: EMPTY_BI,
    withdrawalTime: EMPTY_BI,
    badges: [] as string[],
    featured: input.featured ?? false,
    isActive: input.isActive ?? true,
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
