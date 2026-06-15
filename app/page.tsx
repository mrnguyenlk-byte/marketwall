import { buildDashboardData } from "@/lib/providers/build-dashboard-data"
import { features } from "@/lib/config/features"
import { getMockData as getMarketMock } from "@/lib/providers/market-provider"
import { getMockData as getHeatmapMock } from "@/lib/providers/heatmap-provider"
import { getMockData as getCryptoMock } from "@/lib/providers/crypto-provider"
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
    const crypto = getCryptoMock()
    const vnMarket = pickHeatmapMarket(heatmapMock.markets, "vn")
    const usMarket = pickHeatmapMarket(heatmapMock.markets, "us")
    const cryptoMarket = pickHeatmapMarket(heatmapMock.markets, "crypto")
    dashboard = {
      dashboardTickerBarItems: marketMock.dashboardTickerBarItems,
      overviewByCategory: marketMock.overviewByCategory,
      heatmapMarkets: [
        ...(vnMarket ? [vnMarket] : []),
        ...(usMarket ? [usMarket] : []),
        ...(cryptoMarket
          ? [{ ...cryptoMarket, tiles: crypto.heatmapTiles }]
          : []),
      ],
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

      <main className="w-full px-3 py-4 lg:px-4">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            aria-label="Market sidebar"
            className="w-full lg:sticky lg:top-[104px] lg:w-[300px] lg:shrink-0"
          >
            <Sidebar overviewByCategory={dashboard.overviewByCategory} />
          </aside>

          <section className="min-w-0 space-y-4">
            <SectionErrorBoundary name="fear-greed">
              <FearGreed items={dashboard.fearGreedItems} />
            </SectionErrorBoundary>
            <SectionErrorBoundary name="heatmap">
              <HeatmapSection markets={dashboard.heatmapMarkets} />
            </SectionErrorBoundary>
            {features.currencyStrength && (
              <SectionErrorBoundary name="currency-strength">
                <CurrencyStrength />
              </SectionErrorBoundary>
            )}

            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              <SectionErrorBoundary name="calendar">
                <EconomicCalendar fallbackEvents={calendarFallback} />
              </SectionErrorBoundary>
              <SectionErrorBoundary name="news">
                <MarketNews fallbackItems={newsFallback} />
              </SectionErrorBoundary>
            </div>

            <SectionErrorBoundary name="brokers">
              <BrokerHighlights />
            </SectionErrorBoundary>
            <RiskWarning />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
