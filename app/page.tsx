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
import { HeatmapSection } from "@/components/marketwall/heatmap"
import { VietnamMarketDashboard } from "@/components/marketwall/vietnam-market-dashboard"
import { VietnamMarketAnalyticsPanel } from "@/components/marketwall/vietnam-market-analytics"
import { CurrencyStrength } from "@/components/marketwall/currency-strength"
import { EconomicCalendar } from "@/components/marketwall/economic-calendar"
import { MarketNews } from "@/components/marketwall/market-news"
import { BrokerHighlights } from "@/components/marketwall/broker-highlights"
import { RiskWarning } from "@/components/marketwall/risk-warning"
import { Footer } from "@/components/marketwall/footer"
import { SectionErrorBoundary } from "@/components/marketwall/section-error-boundary"

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

  return (
    <div className="min-h-screen w-full bg-background">
      <Header tickerItems={dashboard.dashboardTickerBarItems} />

      <main className="w-full overflow-x-hidden px-3 pt-1 pb-3 lg:px-4">
        <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-2 min-[1440px]:grid-cols-[240px_minmax(0,1fr)_280px] min-[1920px]:grid-cols-[250px_minmax(0,1fr)_300px]">
          <aside
            aria-label="Market sidebar"
            className="order-1 min-w-0 w-full lg:col-start-1 lg:row-start-1 lg:sticky lg:self-start top-[98px] md:top-[76px] min-[1440px]:col-start-1 min-[1440px]:w-[240px] min-[1920px]:w-[250px]"
          >
            <Sidebar overviewByCategory={dashboard.overviewByCategory} />
          </aside>

          <section className="order-2 min-w-0 space-y-2 lg:col-start-2 lg:row-start-1 min-[1440px]:col-start-2">
            <SectionErrorBoundary name="heatmap">
              <HeatmapSection markets={dashboard.heatmapMarkets} />
            </SectionErrorBoundary>
            <SectionErrorBoundary name="vn-dashboard">
              <VietnamMarketDashboard />
            </SectionErrorBoundary>
            <SectionErrorBoundary name="vn-analytics">
              <VietnamMarketAnalyticsPanel />
            </SectionErrorBoundary>
            {features.currencyStrength && (
              <SectionErrorBoundary name="currency-strength">
                <CurrencyStrength />
              </SectionErrorBoundary>
            )}
            <SectionErrorBoundary name="brokers">
              <BrokerHighlights />
            </SectionErrorBoundary>
            <RiskWarning />
          </section>

          <aside
            aria-label="Trader sidebar"
            className="order-3 flex min-w-0 w-full flex-col gap-2 lg:col-start-2 lg:row-start-2 lg:sticky lg:self-start top-[98px] md:top-[76px] min-[1440px]:col-start-3 min-[1440px]:row-start-1 min-[1440px]:w-[280px] min-[1920px]:w-[300px]"
          >
            <SectionErrorBoundary name="fear-greed">
              <FearGreed items={dashboard.fearGreedItems} variant="sidebar" />
            </SectionErrorBoundary>
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
