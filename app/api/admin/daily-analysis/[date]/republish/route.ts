import {
  getDailyAnalysisByDate,
  saveDailyAnalysis,
} from "@/lib/daily-analysis/storage"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { publishDailyAnalysisToFacebook } from "@/lib/publishers/facebook"
import { publishDailyAnalysisToTelegram } from "@/lib/publishers/telegram"
import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteContext = { params: Promise<{ date: string }> }

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { date } = await context.params
  const article = await getDailyAnalysisByDate(date)
  if (!article) return Response.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json()) as { channel?: "telegram" | "facebook" }
  const channel = body.channel
  if (channel !== "telegram" && channel !== "facebook") {
    return Response.json({ error: "channel must be telegram or facebook" }, { status: 400 })
  }

  const updated: DailyAnalysis = { ...article, updatedAt: new Date().toISOString() }

  if (channel === "telegram") {
    const result = await publishDailyAnalysisToTelegram(article)
    if (result.ok) {
      updated.telegramStatus = "sent"
      updated.telegramMessageId = result.messageId
    } else if (result.error.startsWith("skipped:")) {
      updated.telegramStatus = "skipped"
    } else {
      updated.telegramStatus = "failed"
    }
    const saved = await saveDailyAnalysis(updated)
    try {
      await prisma.automationLog.create({
        data: {
          date,
          status: "republish-telegram",
          telegramStatus: saved.telegramStatus ?? null,
          errors: result.ok ? undefined : { error: result.error },
        },
      })
    } catch {
      // Optional.
    }
    return Response.json({ article: saved, result })
  }

  const result = await publishDailyAnalysisToFacebook(article)
  if (result.ok) {
    updated.facebookStatus = "sent"
    updated.facebookPostId = result.postId
  } else if (result.error.startsWith("skipped:")) {
    updated.facebookStatus = "skipped"
  } else {
    updated.facebookStatus = "failed"
  }
  const saved = await saveDailyAnalysis(updated)
  try {
    await prisma.automationLog.create({
      data: {
        date,
        status: "republish-facebook",
        facebookStatus: saved.facebookStatus ?? null,
        errors: result.ok ? undefined : { error: result.error },
      },
    })
  } catch {
    // Optional.
  }

  return Response.json({ article: saved, result })
}
