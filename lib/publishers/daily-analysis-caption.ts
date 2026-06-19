import { SITE_DOMAIN } from "@/lib/brand"
import { formatDailyAnalysisDate } from "@/lib/daily-analysis/map-to-card"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"

export const DAILY_ANALYSIS_SOCIAL_DISCLAIMER =
  "⚠️ Nội dung chỉ mang tính tham khảo, không phải khuyến nghị đầu tư."

export const DAILY_ANALYSIS_SOCIAL_HASHTAGS = "#VNIndex #Gold #BTrading #MarketAnalysis"

const US_MACRO_PLACEHOLDER = "Dữ liệu đang được cập nhật"

function dailyAnalysisArticleUrl(slug: string): string {
  return `${SITE_DOMAIN}/daily-analysis/${slug}`
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  if (maxLen <= 1) return text.slice(0, maxLen)
  return `${text.slice(0, maxLen - 1).trimEnd()}…`
}

/** Split usMacroSummary into bullet lines; single paragraphs become one or more sentences. */
export function parseUsMacroBullets(usMacroSummary: string): string[] {
  const trimmed = usMacroSummary.trim()
  if (!trimmed) return []

  const lines = trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length > 1) {
    return lines.map((line) => line.replace(/^[-•*]\s*/, ""))
  }

  const sentences = trimmed.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  if (sentences.length > 1) return sentences
  return [trimmed]
}

function buildUsEconomySection(bullets: string[]): string {
  if (bullets.length === 0) {
    return `US Economy:\n• ${US_MACRO_PLACEHOLDER}`
  }
  return `US Economy:\n${bullets.map((bullet) => `• ${bullet}`).join("\n")}`
}

function buildFooter(articleUrl: string): string {
  return `\n\n${DAILY_ANALYSIS_SOCIAL_DISCLAIMER}\n\n👉 Đọc đầy đủ:\n${articleUrl}\n\n${DAILY_ANALYSIS_SOCIAL_HASHTAGS}`
}

function buildHeader(dateLabel: string, vnText: string, goldText: string): string {
  return `📊 BTrading Daily Analysis – ${dateLabel}\n\nVNIndex:\n${vnText}\n\nGold:\n${goldText}`
}

function fitCaptionWithinLimit(
  dateLabel: string,
  vnText: string,
  goldText: string,
  usMacroBullets: string[],
  articleUrl: string,
  maxLength: number,
): string {
  const footer = buildFooter(articleUrl)
  const minVnGold = 20

  let vn = vnText
  let gold = goldText
  let bullets = [...usMacroBullets]

  const assemble = () => {
    const header = buildHeader(dateLabel, vn, gold)
    const usMacro = buildUsEconomySection(bullets)
    return `${header}\n\n${usMacro}${footer}`
  }

  let caption = assemble()
  if (caption.length <= maxLength) return caption

  const footerLen = footer.length
  const usMacroHeaderLen = "US Economy:\n".length
  const fixedOverhead =
    buildHeader(dateLabel, "", "").length + 2 + usMacroHeaderLen + footerLen

  let bodyBudget = maxLength - fixedOverhead
  if (bodyBudget < minVnGold * 2) {
    vn = truncateText(vnText, minVnGold)
    gold = truncateText(goldText, minVnGold)
    bullets = bullets.length > 0 ? [truncateText(bullets[0], 40)] : []
    caption = assemble()
    return truncateText(caption, maxLength)
  }

  const vnGoldBudget = Math.floor(bodyBudget * 0.7)
  const halfBudget = Math.floor(vnGoldBudget / 2)
  vn = truncateText(vnText, Math.max(minVnGold, halfBudget))
  gold = truncateText(goldText, Math.max(minVnGold, vnGoldBudget - vn.length))

  caption = assemble()
  if (caption.length <= maxLength) return caption

  const bulletBudget = maxLength - (buildHeader(dateLabel, vn, gold).length + 2 + usMacroHeaderLen + footerLen)
  if (bulletBudget > 10 && bullets.length > 0) {
    bullets = bullets.map((bullet, index) =>
      index === 0 ? truncateText(bullet, bulletBudget - 2) : truncateText(bullet, 30),
    )
    while (bullets.length > 1 && assemble().length > maxLength) {
      bullets.pop()
    }
    caption = assemble()
    if (caption.length <= maxLength) return caption
  }

  while (caption.length > maxLength && (vn.length > minVnGold || gold.length > minVnGold)) {
    if (vn.length >= gold.length && vn.length > minVnGold) {
      vn = truncateText(vn, vn.length - 10)
    } else if (gold.length > minVnGold) {
      gold = truncateText(gold, gold.length - 10)
    } else {
      vn = truncateText(vn, vn.length - 10)
    }
    caption = assemble()
  }

  return truncateText(caption, maxLength)
}

/** Build the standardized daily analysis social caption from article fields. */
export function buildDailyAnalysisSocialCaption(
  article: DailyAnalysis,
  options?: { maxLength?: number },
): string {
  const dateLabel = formatDailyAnalysisDate(article.date)
  const articleUrl = dailyAnalysisArticleUrl(article.slug)
  const vnText = article.vnindexAnalysis.trim()
  const goldText = article.goldAnalysis.trim()
  const usMacroBullets = parseUsMacroBullets(article.usMacroSummary)

  if (options?.maxLength) {
    return fitCaptionWithinLimit(
      dateLabel,
      vnText,
      goldText,
      usMacroBullets,
      articleUrl,
      options.maxLength,
    )
  }

  const header = buildHeader(dateLabel, vnText, goldText)
  const usMacro = buildUsEconomySection(usMacroBullets)
  return `${header}\n\n${usMacro}${buildFooter(articleUrl)}`
}
