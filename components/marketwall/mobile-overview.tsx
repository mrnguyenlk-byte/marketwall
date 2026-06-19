"use client"

import type { DailyAnalysisCard } from "@/lib/daily-analysis/mock-data"
import type { FearGreedItem } from "@/lib/fear-greed"
import type { HeatmapMarket } from "@/lib/market-types"
import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"
import { DailyAnalysisPreview } from "./daily-analysis-preview"
import { FearGreed } from "./fear-greed"
import { MarketLiquiditySection } from "./market-liquidity-section"
import { HeatmapSection } from "./heatmap"
import { VietnamMarketDashboard } from "./vietnam-market-dashboard"
import { MobileSectionPreview } from "./mobile-section-preview"
import { SectionHeading } from "./shared"
import { ForeignTabContent } from "./vn-analytics-views"
import { SectionErrorBoundary } from "./section-error-boundary"

const MOBILE_PREVIEW_HEIGHTS = {
  dailyAnalysis: 320,
  fearGreed: 240,
  marketLiquidity: 300,
  heatmap: 450,
  priceBoard: 420,
  foreignFlow: 320,
} as const

const SCROLL_TARGETS = {
  dailyAnalysis: "daily-analysis",
  fearGreed: "fear-greed-full",
  marketLiquidity: "market-liquidity-full",
  heatmap: "heatmap-full",
  priceBoard: "vn-dashboard-full",
  foreignFlow: "foreign-flow-full",
} as const

type MobileOverviewProps = {
  fearGreedItems: FearGreedItem[]
  heatmapMarkets: HeatmapMarket[]
  dailyAnalysisCards?: DailyAnalysisCard[]
}

function MobileForeignFlowPreview() {
  const { t } = useLang()
  const { data, isLoading } = useVietnamMarkets()
  const isLive = data?.source === "live"

  return (
    <section aria-labelledby="mobile-foreign-flow-title" className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading id="mobile-foreign-flow-title" title={t("foreignFlow.title")} />
        <span className="text-[10px] text-muted-foreground">
          {isLive ? t("vnAnalytics.sourceLive") : t("vnAnalytics.sourceMock")}
        </span>
      </div>
      <ForeignTabContent analytics={data?.analytics} loading={isLoading} />
    </section>
  )
}

export function MobileOverview({
  fearGreedItems,
  heatmapMarkets,
  dailyAnalysisCards,
}: MobileOverviewProps) {
  return (
    <div className="flex flex-col gap-4" aria-label="Mobile market overview">
      <SectionErrorBoundary name="mobile-daily-analysis">
        <MobileSectionPreview
          maxHeight={MOBILE_PREVIEW_HEIGHTS.dailyAnalysis}
          scrollTargetId={SCROLL_TARGETS.dailyAnalysis}
        >
          <DailyAnalysisPreview cards={dailyAnalysisCards} />
        </MobileSectionPreview>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="mobile-fear-greed">
        <MobileSectionPreview
          maxHeight={MOBILE_PREVIEW_HEIGHTS.fearGreed}
          scrollTargetId={SCROLL_TARGETS.fearGreed}
        >
          <FearGreed items={fearGreedItems} variant="sidebar" />
        </MobileSectionPreview>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="mobile-market-liquidity">
        <MobileSectionPreview
          maxHeight={MOBILE_PREVIEW_HEIGHTS.marketLiquidity}
          scrollTargetId={SCROLL_TARGETS.marketLiquidity}
        >
          <MarketLiquiditySection />
        </MobileSectionPreview>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="mobile-heatmap">
        <MobileSectionPreview
          maxHeight={MOBILE_PREVIEW_HEIGHTS.heatmap}
          scrollTargetId={SCROLL_TARGETS.heatmap}
        >
          <HeatmapSection markets={heatmapMarkets} mobileHeight={450} />
        </MobileSectionPreview>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="mobile-price-board">
        <MobileSectionPreview
          maxHeight={MOBILE_PREVIEW_HEIGHTS.priceBoard}
          scrollTargetId={SCROLL_TARGETS.priceBoard}
        >
          <VietnamMarketDashboard maxRows={20} boards="volume" />
        </MobileSectionPreview>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="mobile-foreign-flow">
        <MobileSectionPreview
          maxHeight={MOBILE_PREVIEW_HEIGHTS.foreignFlow}
          scrollTargetId={SCROLL_TARGETS.foreignFlow}
        >
          <MobileForeignFlowPreview />
        </MobileSectionPreview>
      </SectionErrorBoundary>
    </div>
  )
}
