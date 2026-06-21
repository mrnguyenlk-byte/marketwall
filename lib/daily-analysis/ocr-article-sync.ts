import "server-only"

import {
  applyOcrToAnalysisSections,
  buildArticleValuesSnapshot,
  emptyOcrMarketData,
  ocrToMarketData,
  type DailyAnalysisMarketData,
} from "./market-data"
import type { DailyAnalysisOcrResult } from "./ocr-chart-header"
import type { DailyAnalysis } from "./types"

function articleValuesMatchOcr(
  articleValues: ReturnType<typeof buildArticleValuesSnapshot>,
  ocrData: DailyAnalysisOcrResult,
): boolean {
  const expected = buildArticleValuesSnapshot(
    ocrToMarketData({ vnindex: ocrData.vnindex, gold: ocrData.gold }),
  )

  const compareInstrument = (
    actual: (typeof articleValues)["vnindex"],
    expectedRow: (typeof expected)["vnindex"],
  ) => {
    const closeOk =
      actual.close == null && expectedRow.close == null
        ? true
        : actual.close != null &&
          expectedRow.close != null &&
          Math.abs(actual.close - expectedRow.close) < 0.005
    const changeOk =
      actual.pointChange == null && expectedRow.pointChange == null
        ? true
        : actual.pointChange != null &&
          expectedRow.pointChange != null &&
          Math.abs(actual.pointChange - expectedRow.pointChange) < 0.02
    const percentOk =
      actual.changePercent == null && expectedRow.changePercent == null
        ? true
        : actual.changePercent != null &&
          expectedRow.changePercent != null &&
          Math.abs(actual.changePercent - expectedRow.changePercent) < 0.001
    return closeOk && changeOk && percentOk
  }

  const vnOk = ocrData.vnindexSuccess
    ? compareInstrument(articleValues.vnindex, expected.vnindex)
    : articleValues.vnindex.close == null
  const goldOk = ocrData.goldSuccess
    ? compareInstrument(articleValues.gold, expected.gold)
    : articleValues.gold.close == null

  return vnOk && goldOk
}

export function logArticleValues(
  marketData: DailyAnalysisMarketData,
  ocrData: DailyAnalysisOcrResult | null,
): void {
  const articleValues = buildArticleValuesSnapshot(marketData)
  const ocrValues = ocrData
    ? buildArticleValuesSnapshot(
        ocrToMarketData({ vnindex: ocrData.vnindex, gold: ocrData.gold }),
      )
    : null

  console.log(
    "[daily-analysis] ARTICLE_VALUES",
    JSON.stringify({ articleValues, ocrValues, match: ocrData ? articleValuesMatchOcr(articleValues, ocrData) : null }),
  )
}

/** Force article numeric fields to match OCR before publish. */
export function ensureArticleUsesOcrValues(
  article: DailyAnalysis,
  ocrData: DailyAnalysisOcrResult | null,
): DailyAnalysis {
  if (!ocrData) {
    logArticleValues(article.marketData ?? emptyOcrMarketData(), null)
    return article
  }

  const marketData = ocrToMarketData({
    vnindex: ocrData.vnindex,
    gold: ocrData.gold,
  })
  const withOcrAnalysis = applyOcrToAnalysisSections(article, marketData)
  const synced: DailyAnalysis = {
    ...article,
    ...withOcrAnalysis,
    marketData,
    ocrData: {
      vnindex: ocrData.vnindex,
      gold: ocrData.gold,
    },
  }

  logArticleValues(marketData, ocrData)

  const articleValues = buildArticleValuesSnapshot(marketData)
  if (!articleValuesMatchOcr(articleValues, ocrData)) {
    console.error(
      "[daily-analysis] ARTICLE_VALUES mismatch with OCR_VALUES — blocking incorrect provider numbers",
    )
  }

  return synced
}
