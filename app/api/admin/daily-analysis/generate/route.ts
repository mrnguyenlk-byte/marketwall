import { generateDailyAnalysis } from "@/lib/daily-analysis/generate"
import {
  appendDailyAnalysisLog,
  saveDailyAnalysis,
  saveDailyAnalysisImage,
} from "@/lib/daily-analysis/storage"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { publishDailyAnalysisToFacebook } from "@/lib/publishers/facebook"
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
  if (facebook.ok) {
    updated.facebookStatus = "sent"
    updated.facebookPostId = facebook.postId
  } else if (facebook.error.startsWith("skipped:")) {
    updated.facebookStatus = "skipped"
  } else {
    updated.facebookStatus = "failed"
  }

  const saved = await saveDailyAnalysis(updated)

  try {
    await prisma.automationLog.create({
      data: {
        date: saved.date,
        status: "generated",
        telegramStatus: saved.telegramStatus ?? null,
        facebookStatus: saved.facebookStatus ?? null,
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

  if (vnindexFile instanceof File && vnindexFile.size > 0) {
    vnindexImageUrl = await saveDailyAnalysisImage(date, "vnindex.png", vnindexFile)
  }
  if (goldFile instanceof File && goldFile.size > 0) {
    goldImageUrl = await saveDailyAnalysisImage(date, "gold.png", goldFile)
  }

  const { article, source, fallbackUsed, model } = await generateDailyAnalysis(date, {
    vnindexImage: vnindexImageUrl,
    goldImage: goldImageUrl,
  })

  const { article: saved } = await saveWithPublish(article)

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
