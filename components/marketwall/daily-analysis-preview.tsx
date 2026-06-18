"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useLang } from "@/lib/i18n"
import { DAILY_ANALYSIS_MOCK_CARDS, type DailyAnalysisCard } from "@/lib/daily-analysis/mock-data"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DashboardCard, SectionHeading } from "./shared"
import { DailyAnalysisArticleCard } from "./daily-analysis-card"

type DailyAnalysisPreviewProps = {
  cards?: DailyAnalysisCard[]
}

export function DailyAnalysisPreview({ cards }: DailyAnalysisPreviewProps) {
  const { t } = useLang()
  const displayCards = cards?.length ? cards : DAILY_ANALYSIS_MOCK_CARDS

  return (
    <section id="daily-analysis" aria-labelledby="daily-analysis-title" className="min-w-0 scroll-mt-20">
      <SectionHeading
        id="daily-analysis-title"
        title={t("sec.dailyAnalysis")}
        subtitle={t("sec.dailyAnalysisSub")}
        action={
          <Link
            href="/daily-analysis"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 gap-1 type-table text-primary")}
          >
            {t("action.viewAll")}
            <ArrowUpRight className="size-3.5" />
          </Link>
        }
      />
      <DashboardCard className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {displayCards.map((card) => (
            <DailyAnalysisArticleCard key={card.id} card={card} variant="preview" />
          ))}
        </div>
      </DashboardCard>
    </section>
  )
}
