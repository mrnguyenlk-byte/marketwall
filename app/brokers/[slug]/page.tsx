import { notFound } from "next/navigation"

import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { BrokerDetailPage } from "@/components/marketwall/broker-detail-page"
import { findBrokerBySlug, getBrokerStaticParams } from "@/lib/brokers/registry"
import { buildPageMetadata } from "@/lib/seo"

export function generateStaticParams() {
  return getBrokerStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const broker = findBrokerBySlug(slug)
  if (!broker) return {}

  return buildPageMetadata({
    title: `${broker.name} | Platforms | BTrading Market Insights`,
    description: `Platform overview for ${broker.name}: license, spread, minimum deposit, and platform features.`,
    path: `/brokers/${broker.slug}`,
  })
}

export default async function BrokerSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const broker = findBrokerBySlug(slug)
  if (!broker) notFound()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full px-3 py-4 lg:px-4">
        <BrokerDetailPage broker={broker} />
      </main>
      <Footer />
    </div>
  )
}
