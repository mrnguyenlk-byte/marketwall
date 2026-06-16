import "server-only"

import { safeFetchJson } from "@/lib/providers/fetch-utils"
import type { NormalizedNewsItem } from "@/lib/news/rss"

/** Requires env: FINNHUB_API_KEY */
const BASE_URL = "https://finnhub.io/api/v1"

type FinnhubNewsRow = {
  category?: string
  datetime?: number
  headline?: string
  id?: number
  image?: string
  related?: string
  source?: string
  summary?: string
  url?: string
}

function getApiKey(): string | null {
  try {
    const key = process.env.FINNHUB_API_KEY?.trim()
    return key || null
  } catch {
    return null
  }
}

function mapCategory(raw?: string): string {
  const value = raw?.toLowerCase() ?? ""
  if (value.includes("crypto")) return "crypto"
  if (value.includes("forex") || value.includes("fx")) return "macro"
  if (value.includes("merger") || value.includes("market")) return "markets"
  return "markets"
}

function mapRow(row: FinnhubNewsRow): NormalizedNewsItem | null {
  try {
    if (!row.headline) return null

    const publishedAt = row.datetime
      ? new Date(row.datetime * 1000).toISOString()
      : new Date().toISOString()

    return {
      title: row.headline,
      source: row.source ?? "Finnhub",
      url: row.url ?? "#",
      publishedAt,
      category: mapCategory(row.category),
    }
  } catch {
    return null
  }
}

/** Fetch general market news from Finnhub. */
export async function fetchFinnhubMarketNews(limit = 12): Promise<NormalizedNewsItem[]> {
  try {
    const apiKey = getApiKey()
    if (!apiKey) return []

    const url = `${BASE_URL}/news?category=general&token=${encodeURIComponent(apiKey)}`
    const rows = await safeFetchJson<FinnhubNewsRow[]>(url, { cache: "no-store" })
    if (!rows?.length) return []

    return rows
      .map(mapRow)
      .filter((item): item is NormalizedNewsItem => item != null)
      .slice(0, limit)
  } catch {
    return []
  }
}
