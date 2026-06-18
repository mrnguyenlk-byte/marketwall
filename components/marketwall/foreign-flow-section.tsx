"use client"

import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"

import { SectionHeading } from "./shared"
import { ForeignFlowChart } from "./foreign-flow-chart"

export function ForeignFlowSection() {
  const { t } = useLang()
  const { data, isLoading } = useVietnamMarkets()
  const dashboard = data?.dashboard
  const isLive = data?.source === "live"

  return (
    <section aria-labelledby="foreign-flow-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading id="foreign-flow-title" title={t("foreignFlow.title")} />
        <span className="text-[10px] text-muted-foreground">
          {isLive ? t("vnAnalytics.sourceLive") : t("vnAnalytics.sourceMock")}
        </span>
      </div>
      <ForeignFlowChart
        buyRows={dashboard?.topForeignBuy ?? []}
        sellRows={dashboard?.topForeignSell ?? []}
        loading={isLoading}
      />
    </section>
  )
}
