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
import { TickerBar } from "@/components/marketwall/ticker-bar"
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
      <Header />
      <SectionErrorBoundary name="ticker">
        <TickerBar items={dashboard.dashboardTickerBarItems} />
      </SectionErrorBoundary>

      <main className="w-full px-3 py-3 lg:px-4">
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)] xl:gap-4">
          <aside
            aria-label="Market sidebar"
            className="w-full md:col-start-1 md:row-start-1 md:sticky md:top-[104px] md:self-start xl:hidden"
          >
            <Sidebar overviewByCategory={dashboard.overviewByCategory} />
          </aside>

          <section className="min-w-0 space-y-3 md:col-start-2 md:row-start-1 xl:col-start-1">
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
            className="flex min-w-0 flex-col gap-3 md:col-span-2 md:col-start-1 md:row-start-2 xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:sticky xl:top-[104px] xl:max-w-[360px] xl:justify-self-end xl:w-full"
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
