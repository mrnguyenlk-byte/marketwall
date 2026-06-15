import { notFound } from "next/navigation"

import { features } from "@/lib/config/features"
import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { MarketDetailPage } from "@/components/marketwall/market-detail-page"
import { getMarketPageStaticParams } from "@/lib/market-pages"
import { getMarketPageSymbol, isMarketPageSlug } from "@/lib/symbol-detail"
import { buildMarketMetadata } from "@/lib/seo"

export function generateStaticParams() {
  if (!features.dynamicMarketPages) return []
  return getMarketPageStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  if (!isMarketPageSlug(symbol)) return {}

  const record = getMarketPageSymbol(symbol)
  if (!record) return {}

  return buildMarketMetadata(record)
}

export default async function MarketSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  if (!features.dynamicMarketPages) notFound()

  const { symbol } = await params
  if (!isMarketPageSlug(symbol)) notFound()

  const record = getMarketPageSymbol(symbol)
  if (!record) notFound()

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <main className="w-full px-3 py-4 lg:px-4">
        <MarketDetailPage record={record} />
      </main>
      <Footer />
    </div>
  )
}
