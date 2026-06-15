import { Header } from "@/components/marketwall/header"
import { TickerBar } from "@/components/marketwall/ticker-bar"
import { MarketOverview } from "@/components/marketwall/market-overview"
import { CurrencyPerformance } from "@/components/marketwall/currency-performance"
import { EconomicCalendar } from "@/components/marketwall/economic-calendar"
import { MarketNews } from "@/components/marketwall/market-news"
import { HeatmapSection } from "@/components/marketwall/heatmap"
import { FearGreed } from "@/components/marketwall/fear-greed"
import { MarketBreadth } from "@/components/marketwall/market-breadth"
import { TopMovers } from "@/components/marketwall/top-movers"
import { WatchlistPreview } from "@/components/marketwall/watchlist-preview"
import { BrokerHighlights } from "@/components/marketwall/broker-highlights"
import { RiskWarning } from "@/components/marketwall/risk-warning"
import { Footer } from "@/components/marketwall/footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TickerBar />

      <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 lg:px-6">
        <MarketOverview />
        <CurrencyPerformance />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EconomicCalendar />
          <MarketNews />
        </div>

        <HeatmapSection />
        <FearGreed />
        <MarketBreadth />
        <TopMovers />

        <WatchlistPreview />
        <BrokerHighlights />

        <RiskWarning />
      </main>

      <Footer />
    </div>
  )
}
