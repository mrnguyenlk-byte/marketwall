import type { MetadataRoute } from "next"

import { features } from "@/lib/config/features"
import { getBrokerStaticParams, getCompareStaticParams } from "@/lib/brokers/registry"
import { MARKET_PAGE_SLUGS } from "@/lib/market-pages"
import { SITE_URL } from "@/lib/seo"
import { marketPagePath } from "@/lib/symbol-detail"

/** Production routes verified to return HTTP 200. */
const STABLE_ROUTES = [
  { path: "/", changeFrequency: "hourly" as const, priority: 1 },
  { path: "/brokers", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/daily-analysis", changeFrequency: "daily" as const, priority: 0.85 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/legal/terms", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/legal/cookies", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/legal/risk-disclosure", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/legal/disclaimer", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/legal/partner-disclosure", changeFrequency: "yearly" as const, priority: 0.4 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const marketRoutes = features.dynamicMarketPages
    ? MARKET_PAGE_SLUGS.map((slug) => ({
        path: marketPagePath(slug),
        changeFrequency: "hourly" as const,
        priority: 0.85,
      }))
    : []

  const brokerRoutes = getBrokerStaticParams().map(({ slug }) => ({
    path: `/brokers/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }))

  const compareRoutes = getCompareStaticParams().map(({ pair }) => ({
    path: `/compare/${pair}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [...STABLE_ROUTES, ...marketRoutes, ...brokerRoutes, ...compareRoutes].map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
