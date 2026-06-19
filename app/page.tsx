import { buildDashboardData } from "@/lib/providers/build-dashboard-data"
import { features } from "@/lib/config/features"
import { getMockData as getMarketMock } from "@/lib/providers/market-provider"
import { getMockData as getHeatmapMock } from "@/lib/providers/heatmap-provider"
import { getMockData as getNewsMock } from "@/lib/providers/news-provider"
import { getMockData as getCalendarMock } from "@/lib/providers/calendar-provider"
import { fearGreedData } from "@/lib/fear-greed"
import type { HeatmapMarket } from "@/lib/providers/heatmap-provider"
import { homeMetadata } from "@/lib/seo"
import { Header } from "@/components/marketwall/header"
import { Sidebar } from "@/components/marketwall/sidebar"
import { FearGreed } from "@/components/marketwall/fear-greed"
import { DailyAnalysisPreview } from "@/components/marketwall/daily-analysis-preview"
import { MarketLiquiditySection } from "@/components/marketwall/market-liquidity-section"
import { HeatmapSection } from "@/components/marketwall/heatmap"
import { VietnamMarketDashboard } from "@/components/marketwall/vietnam-market-dashboard"
import { CurrencyStrength } from "@/components/marketwall/currency-strength"
import { EconomicCalendar } from "@/components/marketwall/economic-calendar"
import { MarketNews } from "@/components/marketwall/market-news"
import { RiskWarning } from "@/components/marketwall/risk-warning"
import { Footer } from "@/components/marketwall/footer"
import { SectionErrorBoundary } from "@/components/marketwall/section-error-boundary"
import { getLatestDailyAnalysis } from "@/lib/daily-analysis/latest"
import { mapLatestToPreviewCards } from "@/lib/daily-analysis/map-to-card"

export const dynamic = "force-dynamic"

export const metadata = homeMetadata

function pickHeatmapMarket(
  markets: HeatmapMarket[],
  id: HeatmapMarket["id"],
): HeatmapMarket | null {
  return markets.find((market) => market.id === id) ?? null
}

export default async function Page() {
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

      <main className="w-full overflow-x-hidden px-3 pt-1 pb-3 lg:px-4">
        <div className="dashboard-grid">
          <aside aria-label="Market sidebar" className="dashboard-sidebar-left min-w-0">
            <Sidebar overviewByCategory={dashboard.overviewByCategory} />
          </aside>

          <section className="dashboard-center flex min-w-0 flex-col gap-4">
            <SectionErrorBoundary name="daily-analysis">
              <DailyAnalysisPreview cards={dailyAnalysisPreviewCards} />
            </SectionErrorBoundary>
            <SectionErrorBoundary name="market-liquidity">
              <MarketLiquiditySection />
            </SectionErrorBoundary>
            <SectionErrorBoundary name="heatmap">
              <HeatmapSection markets={dashboard.heatmapMarkets} />
            </SectionErrorBoundary>
            <SectionErrorBoundary name="vn-dashboard">
              <VietnamMarketDashboard />
            </SectionErrorBoundary>
            <RiskWarning />
          </section>

          <aside
            aria-label="Trader sidebar"
            className="dashboard-sidebar-right flex min-w-0 flex-col gap-4"
          >
            <SectionErrorBoundary name="fear-greed">
              <FearGreed items={dashboard.fearGreedItems} variant="sidebar" />
            </SectionErrorBoundary>
            {features.currencyStrength && (
              <SectionErrorBoundary name="currency-strength">
                <CurrencyStrength variant="sidebar" />
              </SectionErrorBoundary>
            )}
            <SectionErrorBoundary name="news">
              <MarketNews fallbackItems={newsFallback} />
            </SectionErrorBoundary>
            <SectionErrorBoundary name="calendar">
              <EconomicCalendar fallbackEvents={calendarFallback} />
            </SectionErrorBoundary>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
