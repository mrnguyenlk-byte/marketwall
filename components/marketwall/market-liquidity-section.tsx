"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"

import { SectionHeading } from "./shared"
import { LiquidityTabContent } from "./vn-analytics-views"

export function MarketLiquiditySection() {
  const { t } = useLang()
  const { data, isLoading } = useVietnamMarkets()
  const isLive = data?.source === "live"

  return (
    <section aria-labelledby="market-liquidity-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading id="market-liquidity-title" title={t("sec.marketLiquidity")} />
        <span className="text-[10px] text-muted-foreground">
          {isLive ? t("vnAnalytics.sourceLive") : t("vnAnalytics.sourceMock")}
        </span>
      </div>
      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardContent className="min-h-[120px] px-3 py-3">
          <LiquidityTabContent analytics={data?.analytics} loading={isLoading} showTopTable={false} />
        </CardContent>
      </Card>
    </section>
  )
}
