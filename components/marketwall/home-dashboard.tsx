"use client"

import { features } from "@/lib/config/features"
import type { DailyAnalysisCard } from "@/lib/daily-analysis/mock-data"
import type { FearGreedItem } from "@/lib/fear-greed"
import type {
  EconomicEvent,
  HeatmapMarket,
  MarketNewsItem,
  OverviewCategory,
  OverviewListItem,
} from "@/lib/market-types"
import { Sidebar } from "@/components/marketwall/sidebar"
import { FearGreed } from "@/components/marketwall/fear-greed"
import { DailyAnalysisPreview } from "@/components/marketwall/daily-analysis-preview"
import { MarketLiquiditySection } from "@/components/marketwall/market-liquidity-section"
import { HeatmapSection } from "@/components/marketwall/heatmap"
import { VietnamMarketDashboard } from "@/components/marketwall/vietnam-market-dashboard"
import { CurrencyStrength } from "@/components/marketwall/currency-strength"
import { EconomicCalendar } from "@/components/marketwall/economic-calendar"
import { MarketNews } from "@/components/marketwall/market-news"
import { MarketOverview } from "@/components/marketwall/market-overview"
import { RiskWarning } from "@/components/marketwall/risk-warning"
import { SectionErrorBoundary } from "@/components/marketwall/section-error-boundary"
import { ForeignFlowSection } from "@/components/marketwall/foreign-flow-section"
import { DomesticFlowSection } from "@/components/marketwall/domestic-flow-section"
import { useIsDesktopLg } from "@/components/marketwall/home-viewport-gate"
import type { HeatmapAsset } from "@/types/market"

export type HomeDashboardProps = {
  dailyAnalysisCards?: DailyAnalysisCard[]
  heatmapMarkets: HeatmapMarket[]
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>
  newsFallback: MarketNewsItem[]
  calendarFallback: EconomicEvent[]
  fearGreedItems: FearGreedItem[]
  initialVnHeatmap?: {
    items: HeatmapAsset[]
    source: "live" | "mock"
    proprietarySource?: "cafef-eod" | "gtgd-proxy"
    lastUpdatedAt?: string | null
    coverageCount?: number
    proprietaryStale?: boolean
  }
}

function CenterCoreSections({
  dailyAnalysisCards,
  heatmapMarkets,
  initialVnHeatmap,
}: Pick<HomeDashboardProps, "dailyAnalysisCards" | "heatmapMarkets" | "initialVnHeatmap">) {
  return (
    <>
      <SectionErrorBoundary name="daily-analysis">
        <DailyAnalysisPreview cards={dailyAnalysisCards} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="heatmap">
        <HeatmapSection markets={heatmapMarkets} initialVnHeatmap={initialVnHeatmap} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="market-liquidity">
        <MarketLiquiditySection />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="vn-dashboard">
        <VietnamMarketDashboard />
      </SectionErrorBoundary>
    </>
  )
}

function MobileHomeLayout(props: HomeDashboardProps) {
  const {
    dailyAnalysisCards,
    heatmapMarkets,
    initialVnHeatmap,
    overviewByCategory,
    newsFallback,
    calendarFallback,
  } = props

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Mobile market dashboard">
      <CenterCoreSections
        dailyAnalysisCards={dailyAnalysisCards}
        heatmapMarkets={heatmapMarkets}
        initialVnHeatmap={initialVnHeatmap}
      />
      <SectionErrorBoundary name="foreign-flow">
        <ForeignFlowSection />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="proprietary-flow">
        <DomesticFlowSection />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="global-markets">
        <MarketOverview overviewByCategory={overviewByCategory} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="community-news">
        <MarketNews fallbackItems={newsFallback} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="community-calendar">
        <EconomicCalendar fallbackEvents={calendarFallback} />
      </SectionErrorBoundary>
      <RiskWarning />
    </section>
  )
}

function DesktopHomeLayout(props: HomeDashboardProps) {
  const {
    dailyAnalysisCards,
    heatmapMarkets,
    initialVnHeatmap,
    overviewByCategory,
    newsFallback,
    calendarFallback,
    fearGreedItems,
  } = props

  return (
    <div className="dashboard-grid">
      <aside aria-label="Market sidebar" className="dashboard-sidebar-left min-w-0">
        <Sidebar overviewByCategory={overviewByCategory} />
      </aside>

      <section className="dashboard-center flex min-w-0 flex-col gap-4">
        <CenterCoreSections
          dailyAnalysisCards={dailyAnalysisCards}
          heatmapMarkets={heatmapMarkets}
          initialVnHeatmap={initialVnHeatmap}
        />
        <SectionErrorBoundary name="foreign-flow">
          <ForeignFlowSection />
        </SectionErrorBoundary>
        <SectionErrorBoundary name="proprietary-flow">
          <DomesticFlowSection />
        </SectionErrorBoundary>
        <RiskWarning />
      </section>

      <aside
        aria-label="Trader sidebar"
        className="dashboard-sidebar-right flex min-w-0 flex-col gap-4"
      >
        <SectionErrorBoundary name="fear-greed">
          <FearGreed items={fearGreedItems} variant="sidebar" />
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
  )
}

/**
 * Mounts exactly one homepage layout for the active viewport.
 * Mobile (&lt;1024): single column, each section once.
 * Desktop (≥1024): grid with sidebars; desktop-only widgets do not mount on mobile.
 */
export function HomeDashboard(props: HomeDashboardProps) {
  const isDesktop = useIsDesktopLg()
  return isDesktop ? <DesktopHomeLayout {...props} /> : <MobileHomeLayout {...props} />
}
