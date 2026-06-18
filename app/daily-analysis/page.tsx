import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { DailyAnalysisPageContent } from "@/components/marketwall/daily-analysis-page"
import { dailyAnalysisMetadata } from "@/lib/seo"

export const metadata = dailyAnalysisMetadata

export default function DailyAnalysisPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full px-3 py-5 sm:px-4 lg:px-6 xl:px-8">
        <DailyAnalysisPageContent />
      </main>

      <Footer />
    </div>
  )
}
