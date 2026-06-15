import { fetchWithTimeout } from "@/lib/providers/fetch-utils"

export type NormalizedNewsItem = {
  title: string
  source: string
  url: string
  publishedAt: string
  category: string
}

const RSS_FEEDS: { url: string; source: string; category: string }[] = [
  {
    url: "https://finance.yahoo.com/news/rssindex",
    source: "Yahoo Finance",
    category: "markets",
  },
  {
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",
    source: "CNBC Markets",
    category: "markets",
  },
  {
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    source: "MarketWatch",
    category: "markets",
  },
]

const MAX_ITEMS = 20

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  const match = block.match(re)
  return match ? decodeXml(match[1]) : ""
}

function parseRssXml(xml: string, source: string, category: string): NormalizedNewsItem[] {
  const items: NormalizedNewsItem[] = []
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? []

  for (const block of itemBlocks) {
    const title = extractTag(block, "title")
    const link = extractTag(block, "link") || extractTag(block, "guid")
    const pubDate = extractTag(block, "pubDate") || new Date().toISOString()

    if (!title || !link) continue

    items.push({
      title,
      source,
      url: link,
      publishedAt: pubDate,
      category,
    })
  }

  return items
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

export async function fetchNewsFromRss(): Promise<NormalizedNewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const res = await fetchWithTimeout(feed.url, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "User-Agent": "BTradingMarketInsights/1.0",
        },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`RSS ${feed.source} failed: ${res.status}`)
      const xml = await res.text()
      return parseRssXml(xml, feed.source, feed.category)
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
