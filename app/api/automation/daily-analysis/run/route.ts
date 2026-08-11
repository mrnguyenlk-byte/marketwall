import { generateDailyAnalysis } from "@/lib/daily-analysis/generate"
import {
  extractDailyAnalysisOcr,
  fetchImageBuffer,
} from "@/lib/daily-analysis/ocr-chart-header"
import { ensureArticleUsesOcrValues } from "@/lib/daily-analysis/ocr-article-sync"
import {
  appendDailyAnalysisLog,
  claimDailyAnalysisRun,
  getDailyAnalysisByDate,
  releaseDailyAnalysisRun,
  saveDailyAnalysis,
  saveDailyAnalysisImage,
} from "@/lib/daily-analysis/storage"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import {
  applyFacebookPublishResult,
  facebookResultToAutomationLog,
} from "@/lib/publishers/apply-facebook-publish-result"
import {
  publishDailyAnalysisToFacebook,
  type FacebookPublishResult,
} from "@/lib/publishers/facebook"
import {
  publishDailyAnalysisToTelegram,
  type TelegramPublishResult,
} from "@/lib/publishers/telegram"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type RunRequestBody = {
  date?: string
  vnindexSessionDate?: string
  goldSessionDate?: string
  vnindexImage?: string
  goldImage?: string
  usMacroData?: string
  secret?: string
}

function expectedSessionDate(reportDate: string): string {
  const candidate = new Date(`${reportDate}T00:00:00.000Z`)
  do {
    candidate.setUTCDate(candidate.getUTCDate() - 1)
  } while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6)
  return candidate.toISOString().slice(0, 10)
}

function validateChartSessions(
  reportDate: string,
  vnindexSessionDate: string,
  goldSessionDate: string,
): Response | null {
  const expected = expectedSessionDate(reportDate)
  if (
    !isValidDate(vnindexSessionDate) ||
    !isValidDate(goldSessionDate) ||
    vnindexSessionDate !== expected ||
    goldSessionDate !== expected
  ) {
    console.error("[daily-analysis] SESSION_BLOCKED", {
      reportDate,
      expected,
      vnindexSessionDate,
      goldSessionDate,
    })
    return Response.json(
      {
        ok: false,
        status: "session_blocked",
        error: "Chart candle dates do not match the expected completed session",
        reportDate,
        expectedSessionDate: expected,
        vnindexSessionDate,
        goldSessionDate,
      },
      { status: 422 },
    )
  }
  return null
}

function isValidDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date)
}

function validateSecret(secret: string | undefined): boolean {
  const expected = process.env.DAILY_AUTOMATION_SECRET?.trim()
  if (!expected) return false
  return secret === expected
}

function unauthorizedResponse() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
}

async function existingRunResponse(date: string): Promise<Response | null> {
  const existing = await getDailyAnalysisByDate(date)
  if (!existing) return null

  return Response.json({
    success: true,
    status: "already_processed",
    date,
    article: existing,
    telegram: { ok: true, skipped: true, reason: "duplicate run" },
    facebook: { ok: true, skipped: true, reason: "duplicate run" },
  })
}

function inProgressResponse(date: string) {
  return Response.json(
    { success: true, status: "in_progress", date },
    { status: 202 },
  )
}

async function saveWithTelegramPublish(article: DailyAnalysis): Promise<{
  article: DailyAnalysis
  telegram: TelegramPublishResult
  facebook: FacebookPublishResult
}> {
  await saveDailyAnalysis(article)

  const telegram = await publishDailyAnalysisToTelegram(article)
  const updated: DailyAnalysis = {
    ...article,
    updatedAt: new Date().toISOString(),
  }

  if (telegram.ok) {
    updated.telegramStatus = "sent"
    updated.telegramMessageId = telegram.messageId
  } else if (telegram.error.startsWith("skipped:")) {
    updated.telegramStatus = "skipped"
  } else {
    updated.telegramStatus = "failed"
    console.error("[daily-analysis] Telegram publish failed:", telegram.error)
  }

  const facebook = await publishDailyAnalysisToFacebook(updated)
  const withFacebook = applyFacebookPublishResult(updated, facebook)
  Object.assign(updated, withFacebook)

  if (!facebook.ok && !facebook.error.startsWith("skipped:")) {
    console.error("[daily-analysis] Facebook publish failed:", facebook.error)
  }

  const saved = await saveDailyAnalysis(updated)

  try {
    const fbLog = facebookResultToAutomationLog(saved, facebook)
    await prisma.automationLog.create({
      data: {
        date: saved.date,
        status: "automation-run",
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

function formatOcrLogSuffix(
  ocrData: Awaited<ReturnType<typeof extractDailyAnalysisOcr>> | null,
): string {
  if (!ocrData) return ""
  return ` ocr_vn=${ocrData.vnindexSuccess ? "ok" : "fail"} ocr_gold=${ocrData.goldSuccess ? "ok" : "fail"}`
}

async function handleMultipartRequest(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ ok: false, error: "Invalid multipart form data" }, { status: 400 })
  }

  const secret = formData.get("secret")
  if (!validateSecret(typeof secret === "string" ? secret : undefined)) {
    return unauthorizedResponse()
  }

  const dateField = formData.get("date")
  const date = typeof dateField === "string" ? dateField.trim() : ""
  if (!date || !isValidDate(date)) {
    return Response.json(
      { ok: false, error: "Invalid date — expected YYYY-MM-DD" },
      { status: 400 },
    )
  }

  const vnindexSessionDate = String(formData.get("vnindexSessionDate") ?? "").trim()
  const goldSessionDate = String(formData.get("goldSessionDate") ?? "").trim()
  if (vnindexSessionDate || goldSessionDate) {
    const sessionError = validateChartSessions(date, vnindexSessionDate, goldSessionDate)
    if (sessionError) return sessionError
  } else {
    // Temporary compatibility for the original Python publisher. Its PowerShell
    // wrapper performs the same CSV gate before launching Python. New runners
    // always send both fields and receive this server-side second gate.
    console.warn("[daily-analysis] LEGACY_SESSION_GATE", { reportDate: date })
  }

  const existingResponse = await existingRunResponse(date)
  if (existingResponse) return existingResponse
  if (!(await claimDailyAnalysisRun(date))) return inProgressResponse(date)

  try {
    const justCompleted = await existingRunResponse(date)
    if (justCompleted) return justCompleted
    const vnindexFile = formData.get("vnindexImage")
    const goldFile = formData.get("goldImage")
    if (!(vnindexFile instanceof File) || !(goldFile instanceof File)) {
      return Response.json(
        { ok: false, error: "vnindexImage and goldImage files are required" },
        { status: 400 },
      )
    }

  let vnindexImageUrl: string
  let goldImageUrl: string
  let ocrData = null

  try {
    const vnindexBuffer = Buffer.from(await vnindexFile.arrayBuffer())
    const goldBuffer = Buffer.from(await goldFile.arrayBuffer())
    ocrData = await extractDailyAnalysisOcr({ vnindexBuffer, goldBuffer })
    vnindexImageUrl = await saveDailyAnalysisImage(date, "vnindex.png", vnindexFile)
    goldImageUrl = await saveDailyAnalysisImage(date, "gold.png", goldFile)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save uploaded images"
    return Response.json({ ok: false, error: message }, { status: 400 })
  }

  const { article, source, fallbackUsed, model } = await generateDailyAnalysis(date, {
    vnindexImage: vnindexImageUrl,
    goldImage: goldImageUrl,
    ocrData,
  })

  const { article: saved, telegram, facebook } = await saveWithTelegramPublish(
    ensureArticleUsesOcrValues(article, ocrData),
  )

  try {
    const modelNote = model ? ` model=${model}` : ""
    const fallbackNote = fallbackUsed ? " (fallback mock)" : ""
    const telegramNote =
      telegram.ok
        ? ` telegram=sent msg=${telegram.messageId}`
        : ` telegram=${saved.telegramStatus ?? "unknown"}`
    const facebookNote =
      facebook.ok
        ? ` facebook=sent post=${facebook.postId}`
        : ` facebook=${saved.facebookStatus ?? "unknown"}`
    await appendDailyAnalysisLog(
      date,
      `Generated daily analysis via ${source}${modelNote}${fallbackNote} (slug=${saved.slug})${telegramNote}${facebookNote}${formatOcrLogSuffix(ocrData)}`,
    )
  } catch {
    // Logging is optional; do not fail the request.
  }

  return Response.json({
    success: true,
    date,
    vnindexImage: vnindexImageUrl,
    goldImage: goldImageUrl,
    article: saved,
    telegram,
    facebook,
  })
  } finally {
    await releaseDailyAnalysisRun(date)
  }
}

async function handleJsonRequest(request: Request) {
  let body: RunRequestBody
  try {
    body = (await request.json()) as RunRequestBody
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  if (!validateSecret(body.secret)) {
    return unauthorizedResponse()
  }

  const date = body.date?.trim()
  if (!date || !isValidDate(date)) {
    return Response.json(
      { ok: false, error: "Invalid date — expected YYYY-MM-DD" },
      { status: 400 },
    )
  }


  if (body.vnindexImage?.trim() || body.goldImage?.trim()) {
    const sessionError = validateChartSessions(
      date,
      body.vnindexSessionDate?.trim() ?? "",
      body.goldSessionDate?.trim() ?? "",
    )
    if (sessionError) return sessionError
  }

  const existingResponse = await existingRunResponse(date)
  if (existingResponse) return existingResponse
  if (!(await claimDailyAnalysisRun(date))) return inProgressResponse(date)

  try {
    const justCompleted = await existingRunResponse(date)
    if (justCompleted) return justCompleted
    let ocrData = null
    if (body.vnindexImage?.trim() && body.goldImage?.trim()) {
      const [vnindexBuffer, goldBuffer] = await Promise.all([
        fetchImageBuffer(body.vnindexImage.trim()),
        fetchImageBuffer(body.goldImage.trim()),
      ])
      if (vnindexBuffer && goldBuffer) {
        ocrData = await extractDailyAnalysisOcr({ vnindexBuffer, goldBuffer })
      }
    }

  const { article, source, fallbackUsed, model } = await generateDailyAnalysis(date, {
    vnindexImage: body.vnindexImage,
    goldImage: body.goldImage,
    usMacroDataText: body.usMacroData,
    ocrData,
  })

  const { article: saved, telegram, facebook } = await saveWithTelegramPublish(
    ensureArticleUsesOcrValues(article, ocrData),
  )

  try {
    const modelNote = model ? ` model=${model}` : ""
    const fallbackNote = fallbackUsed ? " (fallback mock)" : ""
    const telegramNote =
      telegram.ok
        ? ` telegram=sent msg=${telegram.messageId}`
        : ` telegram=${saved.telegramStatus ?? "unknown"}`
    const facebookNote =
      facebook.ok
        ? ` facebook=sent post=${facebook.postId}`
        : ` facebook=${saved.facebookStatus ?? "unknown"}`
    await appendDailyAnalysisLog(
      date,
      `Generated daily analysis via ${source}${modelNote}${fallbackNote} (slug=${saved.slug})${telegramNote}${facebookNote}${formatOcrLogSuffix(ocrData)}`,
    )
  } catch {
    // Logging is optional; do not fail the request.
  }

  return Response.json(
    {
      success: true,
      date,
      vnindexImage: saved.vnindexImage,
      goldImage: saved.goldImage,
      article: saved,
      telegram,
      facebook,
    },
    { status: 200 },
  )
  } finally {
    await releaseDailyAnalysisRun(date)
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("multipart/form-data")) {
    return handleMultipartRequest(request)
  }
  return handleJsonRequest(request)
}
