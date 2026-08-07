import {
  buildDashboardData,
  type DashboardData,
} from "@/lib/providers/build-dashboard-data"
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

// The dashboard shell must never wait on slow third-party market feeds.
const DASHBOARD_BOOT_TIMEOUT_MS = 2_500

function pickHeatmapMarket(
  markets: HeatmapMarket[],
  id: HeatmapMarket["id"],
): HeatmapMarket | null {
  return markets.find((market) => market.id === id) ?? null
}

function buildDashboardFallback(): DashboardData {
  const marketMock = getMarketMock()
  const heatmapMock = getHeatmapMock()
  const vnMarket = pickHeatmapMarket(heatmapMock.markets, "vn")
  return {
    dashboardTickerBarItems: marketMock.dashboardTickerBarItems,
    overviewByCategory: marketMock.overviewByCategory,
    heatmapMarkets: vnMarket ? [vnMarket] : [],
    fearGreedItems: fearGreedData,
    initialVnHeatmap: undefined,
  }
}

async function resolveQuickly<T>(task: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), DASHBOARD_BOOT_TIMEOUT_MS)
    task
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(fallback)
      })
  })
}

export default async function DashboardPage() {
  const [dashboard, latestDailyAnalysis] = await Promise.all([
    resolveQuickly(buildDashboardData(), buildDashboardFallback()),
    resolveQuickly(getLatestDailyAnalysis(), null),
  ])
  const newsFallback = getNewsMock().items
  const calendarFallback = getCalendarMock().events
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
