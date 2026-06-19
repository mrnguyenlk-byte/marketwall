import type { DailyAnalysis } from "./types"
import type { DailyAnalysisCard } from "./mock-data"

export function formatDailyAnalysisDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-")
  return `${d}/${m}/${y}`
}

type ParsedBullets = {
  trend?: string
  resistance?: string
  support?: string
}

function parseAnalysisBullets(analysis: string): ParsedBullets {
  const bullets: ParsedBullets = {}
  const firstSentence = analysis.split(/[.!?]/)[0]?.trim()
  if (firstSentence) {
    bullets.trend = analysis.startsWith(firstSentence)
      ? `${firstSentence}.`
      : firstSentence
  }

  const resistanceMatch = analysis.match(/[Kk]háng cự[^.!?]*[.!?]?/)
  if (resistanceMatch) {
    bullets.resistance = resistanceMatch[0].replace(/^[Kk]háng cự\s*/i, "").replace(/[.!?]$/, "").trim()
  }

  const supportMatch = analysis.match(/[Hh]ỗ trợ[^.!?]*[.!?]?/)
  if (supportMatch) {
    bullets.support = supportMatch[0].replace(/^[Hh]ỗ trợ\s*/i, "").replace(/[.!?]$/, "").trim()
  }

  return bullets
}

function buildBullets(parsed: ParsedBullets): DailyAnalysisCard["bullets"] {
  const items: DailyAnalysisCard["bullets"] = []
  if (parsed.trend) {
    items.push({ labelKey: "dailyAnalysis.trend", text: parsed.trend })
  }
  if (parsed.resistance) {
    items.push({ labelKey: "dailyAnalysis.resistance", text: parsed.resistance })
  }
  if (parsed.support) {
    items.push({ labelKey: "dailyAnalysis.support", text: parsed.support })
  }
  return items
}

function truncateSummary(text: string, max = 140): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

function mapVnindexCard(article: DailyAnalysis, mode: "preview" | "full"): DailyAnalysisCard {
  const bullets = buildBullets(parseAnalysisBullets(article.vnindexAnalysis))
  const fullSummary = article.vnindexAnalysis

  return {
    id: "vnindex",
    badgeKey: "dailyAnalysis.vnBadge",
    symbol: "VNINDEX",
    date: formatDailyAnalysisDate(article.date),
    titleKey: "dailyAnalysis.vnTitle",
    summary: mode === "preview" ? truncateSummary(fullSummary) : undefined,
    fullSummary,
    imageUrl: article.vnindexImage,
    bullets,
    chartColor: "#22c55e",
  }
}

function mapGoldCard(article: DailyAnalysis, mode: "preview" | "full"): DailyAnalysisCard {
  const bullets = buildBullets(parseAnalysisBullets(article.goldAnalysis))
  const fullSummary = article.goldAnalysis

  return {
    id: "gold",
    badgeKey: "dailyAnalysis.goldBadge",
    symbol: "XAUUSD",
    date: formatDailyAnalysisDate(article.date),
    titleKey: "dailyAnalysis.goldTitle",
    summary: mode === "preview" ? truncateSummary(fullSummary) : undefined,
    fullSummary,
    imageUrl: article.goldImage,
    bullets,
    chartColor: "#eab308",
  }
}

/** Dashboard preview: VNINDEX + Gold cards from the latest article. */
export function mapLatestToPreviewCards(article: DailyAnalysis): DailyAnalysisCard[] {
  return [mapVnindexCard(article, "preview"), mapGoldCard(article, "preview")]
}

/** Full market cards for an article detail page. */
export function mapArticleToMarketCards(article: DailyAnalysis): DailyAnalysisCard[] {
  return [mapVnindexCard(article, "full"), mapGoldCard(article, "full")]
}

/** Archive list: one summary card per stored article. */
export function mapArticleToListCard(article: DailyAnalysis): DailyAnalysisCard {
  return {
    id: "article",
    badgeKey: "nav.dailyAnalysis",
    symbol: "",
    date: formatDailyAnalysisDate(article.date),
    title: article.title,
    summary: truncateSummary(article.summary, 200),
    fullSummary: article.summary,
    href: `/daily-analysis/${article.slug}`,
    bullets: [],
    chartColor: "#22c55e",
  }
}
