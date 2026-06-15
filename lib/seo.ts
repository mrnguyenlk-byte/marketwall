import type { Metadata } from "next"
import { SITE_DOMAIN, SITE_LOGO, SITE_NAME } from "@/lib/brand"

function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}`

  return SITE_DOMAIN
}

export const SITE_URL = resolveSiteUrl()

export const LEGAL_SITEMAP_PATHS = [
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
  "/legal/risk-disclosure",
  "/legal/disclaimer",
  "/legal/partner-disclosure",
] as const

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
