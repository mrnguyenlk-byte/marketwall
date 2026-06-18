import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { DailyAnalysisPageContent } from "@/components/marketwall/daily-analysis-page"
import { getDailyAnalysisList } from "@/lib/daily-analysis/storage"
import { mapArticleToListCard } from "@/lib/daily-analysis/map-to-card"
import { dailyAnalysisMetadata } from "@/lib/seo"

export const metadata = dailyAnalysisMetadata

export default async function DailyAnalysisPage() {
  const articles = await getDailyAnalysisList()
  const cards = articles.length > 0 ? articles.map(mapArticleToListCard) : undefined

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full px-3 py-5 sm:px-4 lg:px-6 xl:px-8">
        <DailyAnalysisPageContent cards={cards} />
      </main>

      <Footer />
    </div>
  )
}
