import { notFound } from "next/navigation"

import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { BrokerComparePage } from "@/components/marketwall/broker-compare-page"
import { compareBrokers } from "@/lib/brokers/compare"
import {
  findBrokerBySlug,
  getCompareStaticParams,
  parseComparePair,
} from "@/lib/brokers/registry"
import { buildPageMetadata } from "@/lib/seo"

export function generateStaticParams() {
  return getCompareStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>
}) {
  const { pair } = await params
  const parsed = parseComparePair(pair)
  if (!parsed) return {}

  const left = findBrokerBySlug(parsed.leftSlug)
  const right = findBrokerBySlug(parsed.rightSlug)
  if (!left || !right) return {}

  return buildPageMetadata({
    title: `${left.name} vs ${right.name} | Platform Comparison`,
    description: `Compare ${left.name} and ${right.name} by rating, spread, license, platforms, and minimum deposit.`,
    path: `/compare/${pair}`,
  })
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ pair: string }>
}) {
  const { pair } = await params
  const parsed = parseComparePair(pair)
  if (!parsed) notFound()

  const left = findBrokerBySlug(parsed.leftSlug)
  const right = findBrokerBySlug(parsed.rightSlug)
  if (!left || !right) notFound()

  const comparison = compareBrokers(left, right)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full px-3 py-4 lg:px-4">
        <BrokerComparePage comparison={comparison} />
      </main>
      <Footer />
    </div>
  )
}
