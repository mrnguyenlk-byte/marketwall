import { buildDashboardData } from "@/lib/providers/build-dashboard-data"
import { getMockData as getMarketMock } from "@/lib/providers/market-provider"
import { getMockData as getHeatmapMock } from "@/lib/providers/heatmap-provider"
import { getMockData as getNewsMock } from "@/lib/providers/news-provider"
import { getMockData as getCalendarMock } from "@/lib/providers/calendar-provider"
import { fearGreedData } from "@/lib/fear-greed"
import type { HeatmapMarket } from "@/lib/providers/heatmap-provider"
import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { HomeDashboard } from "@/components/marketwall/home-dashboard"
import { getLatestDailyAnalysis } from "@/lib/daily-analysis/latest"
import { mapLatestToPreviewCards } from "@/lib/daily-analysis/map-to-card"

export const dynamic = "force-dynamic"

function pickHeatmapMarket(
  markets: HeatmapMarket[],
  id: HeatmapMarket["id"],
): HeatmapMarket | null {
  return markets.find((market) => market.id === id) ?? null
}

export default async function DashboardPage() {
  let dashboard
  try {
    dashboard = await buildDashboardData()
  } catch {
    const marketMock = getMarketMock()
    const heatmapMock = getHeatmapMock()
    const vnMarket = pickHeatmapMarket(heatmapMock.markets, "vn")
    dashboard = {
      dashboardTickerBarItems: marketMock.dashboardTickerBarItems,
      overviewByCategory: marketMock.overviewByCategory,
      heatmapMarkets: vnMarket ? [vnMarket] : [],
      fearGreedItems: fearGreedData,
    }
  }
  const newsFallback = getNewsMock().items
  const calendarFallback = getCalendarMock().events
  const latestDailyAnalysis = await getLatestDailyAnalysis()
  const dailyAnalysisPreviewCards = latestDailyAnalysis
    ? mapLatestToPreviewCards(latestDailyAnalysis)
    : undefined

  return (
    <div className="min-h-screen w-full bg-background">
      <Header tickerItems={dashboard.dashboardTickerBarItems} />
      <main className="w-full overflow-x-hidden px-3 pb-3 pt-1 lg:px-4">
        <HomeDashboard
          dailyAnalysisCards={dailyAnalysisPreviewCards}
          heatmapMarkets={dashboard.heatmapMarkets}
          overviewByCategory={dashboard.overviewByCategory}
          newsFallback={newsFallback}
          calendarFallback={calendarFallback}
          fearGreedItems={dashboard.fearGreedItems}
          initialVnHeatmap={dashboard.initialVnHeatmap}
        />
      </main>
      <Footer />
    </div>
  )
}
