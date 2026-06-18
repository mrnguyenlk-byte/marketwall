"use client"

import { useLang } from "@/lib/i18n"
import { DAILY_ANALYSIS_MOCK_CARDS } from "@/lib/daily-analysis/mock-data"
import { DailyAnalysisArticleCard } from "./daily-analysis-card"
import { DailyAnalysisHero } from "./daily-analysis-hero"

export function DailyAnalysisPageContent() {
  const { t } = useLang()

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <DailyAnalysisHero />

      <header>
        <h1 className="text-xl font-bold text-foreground lg:text-2xl">{t("sec.dailyAnalysis")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("sec.dailyAnalysisSub")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DAILY_ANALYSIS_MOCK_CARDS.map((card) => (
          <DailyAnalysisArticleCard key={card.id} card={card} variant="full" />
        ))}
      </div>
    </div>
  )
}
