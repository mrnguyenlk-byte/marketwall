"use client"

import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { SectionHeading } from "./shared"
import {
  BreadthTabContent,
  ForeignTabContent,
  ProprietaryFlowContent,
} from "./vn-analytics-views"

type AnalyticsTab = "breadth" | "foreign" | "proprietary"

const TABS: AnalyticsTab[] = ["breadth", "foreign", "proprietary"]

const TAB_LABEL_KEYS: Record<AnalyticsTab, string> = {
  breadth: "vnAnalytics.tabBreadth",
  foreign: "vnAnalytics.tabForeign",
  proprietary: "vnAnalytics.tabProprietary",
}

export function VietnamMarketAnalyticsPanel() {
  const { t } = useLang()
  const { data, isLoading } = useVietnamMarkets()
  const [tab, setTab] = useState<AnalyticsTab>("breadth")
  const analytics = data?.analytics
  const isLive = data?.source === "live"

  const tabContent = useMemo(() => {
    switch (tab) {
      case "breadth":
        return <BreadthTabContent analytics={analytics} loading={isLoading} />
      case "foreign":
        return <ForeignTabContent analytics={analytics} loading={isLoading} />
      case "proprietary":
        return <ProprietaryFlowContent analytics={analytics} loading={isLoading} />
    }
  }, [tab, analytics, isLoading])

  return (
    <section aria-labelledby="vn-analytics-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading id="vn-analytics-title" title={t("sec.vnAnalytics")} />
        <span className="text-[10px] text-muted-foreground">
          {isLive ? t("vnAnalytics.sourceLive") : t("vnAnalytics.sourceMock")}
        </span>
      </div>
      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  tab === key
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                {t(TAB_LABEL_KEYS[key])}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="min-h-[120px] px-3 py-3">{tabContent}</CardContent>
      </Card>
    </section>
  )
}
