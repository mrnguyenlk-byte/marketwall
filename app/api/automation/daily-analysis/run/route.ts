import { generateMockDailyAnalysis } from "@/lib/daily-analysis/generator"
import { appendDailyAnalysisLog, saveDailyAnalysis } from "@/lib/daily-analysis/storage"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"

export const dynamic = "force-dynamic"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type RunRequestBody = {
  date?: string
  vnindexImage?: string
  goldImage?: string
  secret?: string
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

export async function POST(request: Request) {
  let body: RunRequestBody
  try {
    body = (await request.json()) as RunRequestBody
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  if (!validateSecret(body.secret)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const date = body.date?.trim()
  if (!date || !isValidDate(date)) {
    return Response.json(
      { ok: false, error: "Invalid date — expected YYYY-MM-DD" },
      { status: 400 },
    )
  }

  const article: DailyAnalysis = generateMockDailyAnalysis(
    date,
    body.vnindexImage,
    body.goldImage,
  )

  const saved = await saveDailyAnalysis(article)

  try {
    await appendDailyAnalysisLog(date, `Generated mock daily analysis (slug=${saved.slug})`)
  } catch {
    // Logging is optional; do not fail the request.
  }

  return Response.json(saved, { status: 200 })
}
