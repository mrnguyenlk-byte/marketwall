export type DailyAnalysisCard = {
  id: string
  badgeKey: string
  symbol: string
  date: string
  titleKey?: string
  summaryKey?: string
  fullSummaryKey?: string
  title?: string
  summary?: string
  fullSummary?: string
  imageUrl?: string
  href?: string
  bullets: { labelKey: string; textKey?: string; text?: string }[]
  chartColor: string
}

export const DAILY_ANALYSIS_MOCK_CARDS: DailyAnalysisCard[] = [
  {
    id: "vnindex",
    badgeKey: "dailyAnalysis.vnBadge",
    symbol: "VNINDEX",
    date: "18/06/2026",
    titleKey: "dailyAnalysis.vnTitle",
    summaryKey: "dailyAnalysis.vnSummary",
    fullSummaryKey: "dailyAnalysis.vnSummaryFull",
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
    fullSummaryKey: "dailyAnalysis.goldSummaryFull",
    bullets: [
      { labelKey: "dailyAnalysis.trend", textKey: "dailyAnalysis.goldTrend" },
      { labelKey: "dailyAnalysis.resistance", textKey: "dailyAnalysis.goldResistance" },
      { labelKey: "dailyAnalysis.support", textKey: "dailyAnalysis.goldSupport" },
    ],
    chartColor: "#eab308",
  },
]
