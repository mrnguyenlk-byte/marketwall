import Parser from "rss-parser"

import { fetchWithTimeout } from "@/lib/providers/fetch-utils"

export type NormalizedNewsItem = {
  title: string
  description?: string
  source: string
  sourceTier?: 1 | 2
  url: string
  publishedAt: string
  category: string
  imageUrl?: string
}

const RSS_FEEDS: {
  url: string
  source: string
  sourceTier: 1 | 2
  category: string
}[] = [
  {
    url: "https://finance.yahoo.com/news/rssindex",
    source: "Yahoo Finance",
    sourceTier: 2,
    category: "markets",
  },
  {
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",
    source: "CNBC Markets",
    sourceTier: 1,
    category: "markets",
  },
  {
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    source: "MarketWatch",
    sourceTier: 2,
    category: "markets",
  },
  {
    url: "https://www.ft.com/markets?format=rss",
    source: "Financial Times Markets",
    sourceTier: 1,
    category: "markets",
  },
  {
    url: "https://www.ft.com/world?format=rss",
    source: "Financial Times World",
    sourceTier: 1,
    category: "world",
  },
  {
    url: "https://vnexpress.net/rss/kinh-doanh.rss",
    source: "VnExpress Kinh doanh",
    sourceTier: 1,
    category: "vietnam",
  },
  {
    url: "https://vneconomy.vn/chung-khoan.rss",
    source: "VnEconomy Chứng khoán",
    sourceTier: 1,
    category: "vietnam",
  },
  {
    // Public archive of @realDonaldTrump posts. Items remain subject to the
    // market-impact gate before publication; this feed is never treated as
    // confirmation of claims made inside a post.
    url: "https://www.trumpstruth.org/feed",
    source: "Trump's Truth archive",
    sourceTier: 2,
    category: "trump",
  },
]

const MAX_ITEMS = 60

export type NewsFeedCategory = "markets" | "world" | "trump" | "vietnam"

export type FetchNewsFromRssOptions = {
  categories?: NewsFeedCategory[]
}

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
})

type RssMediaValue = string | { $?: { url?: string }; url?: string } | undefined

function mediaUrl(value: RssMediaValue): string | undefined {
  const raw = typeof value === "string" ? value : value?.$?.url ?? value?.url
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === "https:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function originalImageUrl(item: Parser.Item & {
  mediaContent?: RssMediaValue
  mediaThumbnail?: RssMediaValue
  contentEncoded?: string
}): string | undefined {
  const enclosure = item.enclosure?.url
  const html = `${item.contentEncoded ?? ""} ${item.content ?? ""}`
  const embedded = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
  return (
    mediaUrl(item.mediaContent) ??
    mediaUrl(item.mediaThumbnail) ??
    mediaUrl(typeof enclosure === "string" ? enclosure : undefined) ??
    mediaUrl(embedded)
  )
}

function itemLink(item: Parser.Item): string {
  if (typeof item.link === "string" && item.link) return item.link
  if (typeof item.guid === "string" && item.guid) return item.guid
  return ""
}

function itemPublishedAt(item: Parser.Item): string {
  if (item.isoDate) return item.isoDate
  if (item.pubDate) return item.pubDate
  return new Date().toISOString()
}

function parseFeed(
  feed: Parser.Output<{
    mediaContent?: RssMediaValue
    mediaThumbnail?: RssMediaValue
    contentEncoded?: string
  }>,
  source: string,
  sourceTier: 1 | 2,
  category: string,
): NormalizedNewsItem[] {
  const items: NormalizedNewsItem[] = []

  for (const item of feed.items ?? []) {
    const title = item.title?.trim() ?? ""
    const url = itemLink(item)
    if (!title || !url) continue

    items.push({
      title,
      description: (item.contentSnippet ?? item.content ?? "").trim().slice(0, 800),
      source,
      sourceTier,
      url,
      publishedAt: itemPublishedAt(item),
      category,
      imageUrl: originalImageUrl(item),
    })
  }

  return items
}

function decodeHtmlUrl(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#38;", "&")
    .replaceAll("&quot;", '"')
}

function metaImage(html: string, articleUrl: string): string | undefined {
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? []
  for (const tag of tags) {
    if (!/(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/i.test(tag)) continue
    const raw = tag.match(/content=["']([^"']+)["']/i)?.[1]
    if (!raw) continue
    try {
      const resolved = new URL(decodeHtmlUrl(raw), articleUrl)
      if (resolved.protocol === "https:") return resolved.toString()
    } catch {
      // Ignore malformed publisher metadata and continue to the next tag.
    }
  }
  return undefined
}

/** Resolve the publisher's original image only for an item that passed news gates. */
export async function resolveNewsImageUrl(item: NormalizedNewsItem): Promise<string | undefined> {
  if (item.imageUrl) return item.imageUrl
  try {
    const response = await fetchWithTimeout(item.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; BTradingMarketInsights/1.0)",
      },
      cache: "no-store",
    })
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return undefined
    const html = (await response.text()).slice(0, 400_000)
    return metaImage(html, item.url)
  } catch {
    return undefined
  }
}

function dedupeByTitle(items: NormalizedNewsItem[]): NormalizedNewsItem[] {
  const seen = new Set<string>()
  const out: NormalizedNewsItem[] = []

  for (const item of items) {
    const key = item.title.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }

  return out
}

export async function fetchNewsFromRss(
  options: FetchNewsFromRssOptions = {},
): Promise<NormalizedNewsItem[]> {
  const categories = options.categories?.length
    ? new Set<string>(options.categories)
    : null
  const feeds = categories
    ? RSS_FEEDS.filter((feed) => categories.has(feed.category))
    : RSS_FEEDS

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const res = await fetchWithTimeout(feed.url, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "User-Agent": "BTradingMarketInsights/1.0",
        },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`RSS ${feed.source} failed: ${res.status}`)
      const xml = await res.text()
      const parsed = await parser.parseString(xml)
      return parseFeed(parsed, feed.source, feed.sourceTier, feed.category)
    }),
  )

  const merged: NormalizedNewsItem[] = []
  for (const result of results) {
    if (result.status === "fulfilled") merged.push(...result.value)
  }

  return dedupeByTitle(merged)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, MAX_ITEMS)
}
