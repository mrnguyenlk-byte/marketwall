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

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TickerBar />

      <main className="w-full px-3 py-3 lg:px-4">
        <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
          <aside
            aria-label="Market sidebar"
            className="w-full shrink-0 xl:sticky xl:top-[96px] xl:w-[340px]"
          >
            <Sidebar />
          </aside>

          <section className="min-w-0 space-y-4">
            <FearGreed />
            <HeatmapSection />
            <CurrencyStrength />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <EconomicCalendar />
              <MarketNews />
            </div>

            <BrokerHighlights />
            <RiskWarning />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
