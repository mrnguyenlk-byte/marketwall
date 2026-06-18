import type { Metadata } from "next"
import { SITE_DOMAIN, SITE_LOGO, SITE_NAME } from "@/lib/brand"
import type { SymbolDetailRecord } from "@/lib/symbol-detail"
import { marketPagePath } from "@/lib/symbol-detail"

function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv

  return SITE_DOMAIN
}

export const SITE_URL = resolveSiteUrl()

const DEFAULT_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
  },
}

type PageSeoInput = {
  title: string
  description: string
  path: string
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

export function buildPageMetadata({ title, description, path }: PageSeoInput): Metadata {
  const canonical = absoluteUrl(path)
  const image = absoluteUrl(SITE_LOGO)

  return {
    title,
    description,
    robots: DEFAULT_ROBOTS,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export function buildMarketMetadata(record: SymbolDetailRecord): Metadata {
  const slug = record.marketPageSlug
  if (!slug) {
    return buildPageMetadata({
      title: `${record.name.en} | ${SITE_NAME}`,
      description: `Market data and analytics for ${record.name.en} (${record.symbol}).`,
      path: "/",
    })
  }

  const path = marketPagePath(slug)
  const title = `${record.name.en} (${record.symbol}) | ${SITE_NAME}`
  const description = `Live market overview, chart, and analytics for ${record.name.en}. Illustrative data — not investment advice.`

  return buildPageMetadata({ title, description, path })
}

export const homeMetadata = buildPageMetadata({
  title: "BTrading Market Insights | Global Market Analytics",
  description:
    "Market data, heatmaps, economic calendar, market analytics and platform comparisons in one place.",
  path: "/",
})

export const platformsMetadata = buildPageMetadata({
  title: "Platforms | BTrading Market Insights",
  description:
    "Compare trading platforms and brokers with ratings, features, and market data context.",
  path: "/brokers",
})

export const contactMetadata = buildPageMetadata({
  title: "Contact | BTrading Market Insights",
  description:
    "Contact BTrading Market Insights for support, partnerships, and general inquiries.",
  path: "/contact",
})

export const dailyAnalysisMetadata = buildPageMetadata({
  title: "Daily Analysis | BTrading Market Insights",
  description:
    "Daily market analysis covering VN-Index, gold, and key macro views with trend, support, and resistance levels.",
  path: "/daily-analysis",
})
