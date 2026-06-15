import type { MetadataRoute } from "next"
import { absoluteUrl, LEGAL_SITEMAP_PATHS } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/brokers"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/contact"), lastModified, changeFrequency: "monthly", priority: 0.6 },
  ]

  const legalRoutes: MetadataRoute.Sitemap = LEGAL_SITEMAP_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }))

  return [...staticRoutes, ...legalRoutes]
}
