"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"

import { SectionHeading } from "./shared"
import { ProprietaryFlowContent } from "./vn-analytics-views"

export function DomesticFlowSection() {
  const { t } = useLang()
  const { data, isLoading } = useVietnamMarkets()
  const isLive = data?.source === "live"

  return (
    <section aria-labelledby="domestic-flow-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading id="domestic-flow-title" title={t("sec.domesticFlow")} />
        <span className="text-[10px] text-muted-foreground">
          {isLive ? t("vnAnalytics.sourceLive") : t("vnAnalytics.sourceMock")}
        </span>
      </div>
      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardContent className="min-h-[120px] px-3 py-3">
          <ProprietaryFlowContent analytics={data?.analytics} loading={isLoading} />
        </CardContent>
      </Card>
    </section>
  )
}
