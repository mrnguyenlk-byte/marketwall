import "server-only"

import { type Bi } from "@/lib/market-utils"
import { fetchFinnhubMarketNews } from "@/lib/api/finnhub"
import { CACHE_KEYS, cachedProvider } from "@/lib/providers/cache"
import { fetchNewsFromRss, type NormalizedNewsItem } from "@/lib/news/rss"

export type { NormalizedNewsItem }

export type MarketNewsItem = {
  title: Bi
  categoryKey: string
  time: Bi
  url?: string
}

export type NewsData = {
  normalized: NormalizedNewsItem[]
  breaking: MarketNewsItem[]
  headlines: MarketNewsItem[]
  items: MarketNewsItem[]
  source: "live" | "mock"
}

const breakingNews: MarketNewsItem[] = [
  {
    title: { vi: "Chứng khoán Mỹ tăng nhẹ trong phiên giao dịch", en: "US stocks edge higher in today's session" },
    categoryKey: "markets",
    time: { vi: "2 phút trước", en: "2m ago" },
  },
  {
    title: { vi: "Fed phát tín hiệu về khả năng cắt giảm lãi suất", en: "Fed signals potential rate cuts ahead" },
    categoryKey: "macro",
    time: { vi: "18 phút trước", en: "18m ago" },
  },
]

const headlineNews: MarketNewsItem[] = [
  {
    title: { vi: "Bitcoin giữ vững trên vùng giá hiện tại", en: "Bitcoin holds above current price zone" },
    categoryKey: "crypto",
    time: { vi: "32 phút trước", en: "32m ago" },
  },
  {
    title: { vi: "Giá vàng ổn định trước dữ liệu kinh tế", en: "Gold steady ahead of economic data" },
    categoryKey: "commodities",
    time: { vi: "45 phút trước", en: "45m ago" },
  },
  {
    title: { vi: "VN-Index điều chỉnh nhẹ trong phiên sáng", en: "VN-Index slips slightly in morning trade" },
    categoryKey: "markets",
    time: { vi: "1 giờ trước", en: "1h ago" },
  },
  {
    title: { vi: "Thị trường chờ công bố chỉ số CPI", en: "Markets await CPI release" },
    categoryKey: "macro",
    time: { vi: "2 giờ trước", en: "2h ago" },
  },
]

function isRssEnabled(): boolean {
  return process.env.NEWS_RSS_ENABLED !== "false"
}

function formatRelativeTime(publishedAt: string): Bi {
  const parsed = new Date(publishedAt).getTime()
  const diffMs = Number.isNaN(parsed) ? 0 : Date.now() - parsed
  const mins = Math.max(1, Math.floor(diffMs / 60_000))

  if (mins < 60) {
    return { vi: `${mins} phút trước`, en: `${mins}m ago` }
  }

  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return { vi: `${hours} giờ trước`, en: `${hours}h ago` }
  }

  const days = Math.floor(hours / 24)
  return { vi: `${days} ngày trước`, en: `${days}d ago` }
}

export function toMarketNewsItems(normalized: NormalizedNewsItem[]): MarketNewsItem[] {
  return normalized.map((item) => ({
    title: { vi: item.title, en: item.title },
    categoryKey: item.category,
    time: formatRelativeTime(item.publishedAt),
    url: item.url,
  }))
}

function buildNewsData(normalized: NormalizedNewsItem[], source: "live" | "mock"): NewsData {
  const items = toMarketNewsItems(normalized)
  return {
    normalized,
    breaking: items.slice(0, 2),
    headlines: items.slice(2),
    items,
    source,
  }
}

export function getMockData(): NewsData {
  const normalized: NormalizedNewsItem[] = [...breakingNews, ...headlineNews].map((item) => ({
    title: item.title.en,
    source: "BTrading",
    url: item.url ?? "#",
    publishedAt: new Date().toISOString(),
    category: item.categoryKey,
  }))
  return buildNewsData(normalized, "mock")
}

async function fetchLiveNews(): Promise<NormalizedNewsItem[] | null> {
  try {
    const finnhub = await fetchFinnhubMarketNews()
    if (finnhub.length) return finnhub
  } catch {
    // fall through
  }

  try {
    const rss = await fetchNewsFromRss()
    return rss.length ? rss : null
  } catch {
    return null
  }
}

export async function getData(): Promise<NewsData> {
  const mock = getMockData()

  if (!isRssEnabled()) {
    try {
      const finnhub = await fetchFinnhubMarketNews()
      if (finnhub.length) return buildNewsData(finnhub, "live")
    } catch {
      // fall through
    }
    return mock
  }

  try {
    const cached = await cachedProvider(
      CACHE_KEYS.news,
      async () => {
        const live = await fetchLiveNews()
        return live?.length ? { data: live, source: "live" as const } : null
      },
      { ttlMs: 300_000 },
    )

    if (cached?.data.length) {
      return buildNewsData(cached.data, cached.source === "live" ? "live" : "mock")
    }

    const live = await fetchLiveNews()
    if (live?.length) return buildNewsData(live, "live")
  } catch {
    // fall through
  }

  return mock
}
