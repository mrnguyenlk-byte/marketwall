import { generateDailyAnalysis } from "@/lib/daily-analysis/generate"
import {
  extractDailyAnalysisOcr,
} from "@/lib/daily-analysis/ocr-chart-header"
import { ensureArticleUsesOcrValues } from "@/lib/daily-analysis/ocr-article-sync"
import {
  appendDailyAnalysisLog,
  saveDailyAnalysis,
  saveDailyAnalysisImage,
} from "@/lib/daily-analysis/storage"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { publishDailyAnalysisToFacebook } from "@/lib/publishers/facebook"
import {
  applyFacebookPublishResult,
  facebookResultToAutomationLog,
} from "@/lib/publishers/apply-facebook-publish-result"
import { publishDailyAnalysisToTelegram } from "@/lib/publishers/telegram"
import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date)
}

async function saveWithPublish(article: DailyAnalysis) {
  await saveDailyAnalysis(article)

  const telegram = await publishDailyAnalysisToTelegram(article)
  const updated: DailyAnalysis = { ...article, updatedAt: new Date().toISOString() }

  if (telegram.ok) {
    updated.telegramStatus = "sent"
    updated.telegramMessageId = telegram.messageId
  } else if (telegram.error.startsWith("skipped:")) {
    updated.telegramStatus = "skipped"
  } else {
    updated.telegramStatus = "failed"
  }

  const facebook = await publishDailyAnalysisToFacebook(updated)
  Object.assign(updated, applyFacebookPublishResult(updated, facebook))

  const saved = await saveDailyAnalysis(updated)

  try {
    const fbLog = facebookResultToAutomationLog(saved, facebook)
    await prisma.automationLog.create({
      data: {
        date: saved.date,
        status: "generated",
        telegramStatus: saved.telegramStatus ?? null,
        facebookStatus: fbLog.facebookStatus,
        facebookError: fbLog.facebookError,
        facebookErrorCode: fbLog.facebookErrorCode,
        errors: fbLog.errors,
      },
    })
  } catch {
    // Optional DB logging.
  }

  return { article: saved, telegram, facebook }
}

export async function POST(request: Request) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const formData = await request.formData()
  const date = String(formData.get("date") ?? "").trim()
  if (!isValidDate(date)) {
    return Response.json({ error: "Invalid date — expected YYYY-MM-DD" }, { status: 400 })
  }

  const vnindexFile = formData.get("vnindexImage")
  const goldFile = formData.get("goldImage")

  let vnindexImageUrl: string | undefined
  let goldImageUrl: string | undefined
  let vnindexBuffer: Buffer | undefined
  let goldBuffer: Buffer | undefined

  if (vnindexFile instanceof File && vnindexFile.size > 0) {
    vnindexBuffer = Buffer.from(await vnindexFile.arrayBuffer())
    vnindexImageUrl = await saveDailyAnalysisImage(date, "vnindex.png", vnindexFile)
  }
  if (goldFile instanceof File && goldFile.size > 0) {
    goldBuffer = Buffer.from(await goldFile.arrayBuffer())
    goldImageUrl = await saveDailyAnalysisImage(date, "gold.png", goldFile)
  }

  const ocrData =
    vnindexBuffer && goldBuffer
      ? await extractDailyAnalysisOcr({ vnindexBuffer, goldBuffer })
      : null

  const { article, source, fallbackUsed, model } = await generateDailyAnalysis(date, {
    vnindexImage: vnindexImageUrl,
    goldImage: goldImageUrl,
    ocrData,
  })

  const { article: saved } = await saveWithPublish(
    ensureArticleUsesOcrValues(article, ocrData),
  )

  try {
    await appendDailyAnalysisLog(
      date,
      `Admin generated daily analysis via ${source}${model ? ` model=${model}` : ""}${fallbackUsed ? " (fallback)" : ""}`,
    )
  } catch {
    // Optional logging.
  }

  return Response.json({ date: saved.date, article: saved })
}
