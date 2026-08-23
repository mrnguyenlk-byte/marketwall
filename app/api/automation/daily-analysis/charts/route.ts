import { putR2Object } from "@/lib/r2"
import { saveDailyAnalysisImage } from "@/lib/daily-analysis/storage"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date)
}

function expectedSessionDate(reportDate: string): string {
  const candidate = new Date(`${reportDate}T00:00:00.000Z`)
  do {
    candidate.setUTCDate(candidate.getUTCDate() - 1)
  } while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6)
  return candidate.toISOString().slice(0, 10)
}

function authorized(secret: unknown): boolean {
  const expected = process.env.DAILY_AUTOMATION_SECRET?.trim()
  return Boolean(expected && typeof secret === "string" && secret === expected)
}

/**
 * VPS-only chart ingress. This endpoint intentionally does not generate an
 * article or call Telegram/Facebook. Command Center owns those operations.
 */
export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ ok: false, error: "Invalid multipart form data" }, { status: 400 })
  }

  if (!authorized(formData.get("secret"))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const date = String(formData.get("date") ?? "").trim()
  const vnindexSessionDate = String(formData.get("vnindexSessionDate") ?? "").trim()
  const goldSessionDate = String(formData.get("goldSessionDate") ?? "").trim()
  if (!isValidDate(date) || !isValidDate(vnindexSessionDate) || !isValidDate(goldSessionDate)) {
    return Response.json({ ok: false, error: "date and both session dates must be YYYY-MM-DD" }, { status: 400 })
  }

  const expected = expectedSessionDate(date)
  if (vnindexSessionDate !== expected || goldSessionDate !== expected) {
    console.error("[daily-analysis] CHART_UPLOAD_SESSION_BLOCKED", {
      date,
      expected,
      vnindexSessionDate,
      goldSessionDate,
    })
    return Response.json(
      { ok: false, status: "session_blocked", date, expectedSessionDate: expected, vnindexSessionDate, goldSessionDate },
      { status: 422 },
    )
  }

  const vnindexImage = formData.get("vnindexImage")
  const goldImage = formData.get("goldImage")
  if (!(vnindexImage instanceof File) || !(goldImage instanceof File)) {
    return Response.json({ ok: false, error: "vnindexImage and goldImage files are required" }, { status: 400 })
  }

  try {
    const [vnindexImageUrl, goldImageUrl] = await Promise.all([
      saveDailyAnalysisImage(date, "vnindex.png", vnindexImage),
      saveDailyAnalysisImage(date, "gold.png", goldImage),
    ])
    const chartSet = {
      date,
      uploadedAt: new Date().toISOString(),
      expectedSessionDate: expected,
      vnindex: { sessionDate: vnindexSessionDate, imageUrl: vnindexImageUrl },
      gold: { sessionDate: goldSessionDate, imageUrl: goldImageUrl },
    }
    const body = JSON.stringify(chartSet, null, 2)
    await Promise.all([
      putR2Object({ key: `daily-analysis/charts/${date}.json`, body, contentType: "application/json" }),
      putR2Object({ key: "daily-analysis/charts/latest.json", body, contentType: "application/json" }),
    ])
    console.log("[daily-analysis] CHARTS_UPLOADED", { date, expected, vnindexSessionDate, goldSessionDate })
    return Response.json({ success: true, status: "charts_uploaded", ...chartSet })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save chart images"
    console.error("[daily-analysis] CHART_UPLOAD_FAILED", { date, message })
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
