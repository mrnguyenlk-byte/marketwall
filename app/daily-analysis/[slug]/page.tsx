import { notFound } from "next/navigation"

import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { DailyAnalysisDetailContent } from "@/components/marketwall/daily-analysis-detail"
import { getDailyAnalysisBySlug } from "@/lib/daily-analysis/storage"
import { buildPageMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"
export const revalidate = 0

export function headers() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getDailyAnalysisBySlug(slug)
  if (!article) return {}

  return buildPageMetadata({
    title: `${article.title} | BTrading Market Insights`,
    description: article.summary,
    path: `/daily-analysis/${article.slug}`,
  })
}

export default async function DailyAnalysisSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getDailyAnalysisBySlug(slug)
  if (!article) notFound()

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full px-3 py-5 sm:px-4 lg:px-6 xl:px-8">
        <DailyAnalysisDetailContent article={article} />
      </main>

      <Footer />
    </div>
  )
}
