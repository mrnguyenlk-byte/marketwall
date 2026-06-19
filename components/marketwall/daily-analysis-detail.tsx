"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLang } from "@/lib/i18n"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { formatDailyAnalysisDate, mapArticleToMarketCards } from "@/lib/daily-analysis/map-to-card"
import { DailyAnalysisArticleCard } from "./daily-analysis-card"

export function DailyAnalysisDetailContent({ article }: { article: DailyAnalysis }) {
  const { t } = useLang()
  const marketCards = mapArticleToMarketCards(article)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/daily-analysis"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("sec.dailyAnalysis")}
      </Link>

      <header>
        <time className="text-sm text-muted-foreground">{formatDailyAnalysisDate(article.date)}</time>
        <h1 className="mt-1 text-xl font-bold text-foreground lg:text-2xl">{article.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {marketCards.map((card) => (
          <DailyAnalysisArticleCard key={card.id} card={card} variant="full" />
        ))}
      </div>

      <section className="rounded-lg border border-border/80 bg-card p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">{t("dailyAnalysis.usMacro")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.usMacroSummary}</p>
      </section>

      <section className="rounded-lg border border-border/80 bg-card p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">{t("dailyAnalysis.ctaHeading")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.cta}</p>
      </section>
    </div>
  )
}
