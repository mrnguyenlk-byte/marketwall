"use client"

import { useLang } from "@/lib/i18n"
import { DashboardCard, SectionHeading } from "./shared"
import { cn } from "@/lib/utils"

type AnalysisCard = {
  id: string
  badgeKey: string
  symbol: string
  date: string
  titleKey: string
  summaryKey: string
  bullets: { labelKey: string; textKey: string }[]
  chartColor: string
}

const MOCK_CARDS: AnalysisCard[] = [
  {
    id: "vnindex",
    badgeKey: "dailyAnalysis.vnBadge",
    symbol: "VNINDEX",
    date: "18/06/2026",
    titleKey: "dailyAnalysis.vnTitle",
    summaryKey: "dailyAnalysis.vnSummary",
    bullets: [
      { labelKey: "dailyAnalysis.trend", textKey: "dailyAnalysis.vnTrend" },
      { labelKey: "dailyAnalysis.resistance", textKey: "dailyAnalysis.vnResistance" },
      { labelKey: "dailyAnalysis.support", textKey: "dailyAnalysis.vnSupport" },
    ],
    chartColor: "#22c55e",
  },
  {
    id: "gold",
    badgeKey: "dailyAnalysis.goldBadge",
    symbol: "XAUUSD",
    date: "18/06/2026",
    titleKey: "dailyAnalysis.goldTitle",
    summaryKey: "dailyAnalysis.goldSummary",
    bullets: [
      { labelKey: "dailyAnalysis.trend", textKey: "dailyAnalysis.goldTrend" },
      { labelKey: "dailyAnalysis.resistance", textKey: "dailyAnalysis.goldResistance" },
      { labelKey: "dailyAnalysis.support", textKey: "dailyAnalysis.goldSupport" },
    ],
    chartColor: "#eab308",
  },
]

function PlaceholderChart({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 280 80"
      className="h-20 w-full text-muted-foreground/40"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`chart-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M0 55 L35 48 L70 52 L105 38 L140 42 L175 28 L210 32 L245 18 L280 22 L280 80 L0 80 Z"
        fill={`url(#chart-fill-${color})`}
      />
      <polyline
        points="0,55 35,48 70,52 105,38 140,42 175,28 210,32 245,18 280,22"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AnalysisPreviewCard({ card }: { card: AnalysisCard }) {
  const { t } = useLang()

  return (
    <article className="flex h-full flex-col rounded-lg border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            card.id === "gold"
              ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
              : "bg-red-500/15 text-red-700 dark:text-red-300",
          )}
          title={card.id === "gold" ? card.symbol : undefined}
        >
          {t(card.badgeKey)}
        </span>
        <time className="text-[11px] text-muted-foreground">{card.date}</time>
      </div>
      <h3 className="text-sm font-semibold leading-snug text-foreground">{t(card.titleKey)}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(card.summaryKey)}</p>
      <ul className="mt-3 space-y-1.5 text-xs">
        {card.bullets.map((item) => (
          <li key={item.labelKey} className="flex gap-2">
            <span className="shrink-0 font-semibold text-foreground">{t(item.labelKey)}:</span>
            <span className="text-muted-foreground">{t(item.textKey)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-md bg-secondary/30 px-2 py-1">
        <PlaceholderChart color={card.chartColor} />
      </div>
      <button
        type="button"
        className="mt-4 self-start text-xs font-semibold text-primary transition-colors hover:text-primary/80"
      >
        {t("dailyAnalysis.readMore")}
      </button>
    </article>
  )
}

export function DailyAnalysisPreview() {
  const { t } = useLang()

  return (
    <section id="daily-analysis" aria-labelledby="daily-analysis-title" className="min-w-0 scroll-mt-20">
      <SectionHeading
        id="daily-analysis-title"
        title={t("sec.dailyAnalysis")}
        subtitle={t("sec.dailyAnalysisSub")}
      />
      <DashboardCard className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MOCK_CARDS.map((card) => (
            <AnalysisPreviewCard key={card.id} card={card} />
          ))}
        </div>
      </DashboardCard>
    </section>
  )
}
