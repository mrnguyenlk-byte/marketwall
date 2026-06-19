import {
  deleteDailyAnalysis,
  getDailyAnalysisByDate,
  saveDailyAnalysis,
} from "@/lib/daily-analysis/storage"
import type { DailyAnalysis, DailyAnalysisPublishStatus } from "@/lib/daily-analysis/types"
import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const PUBLISH_STATUSES = new Set<DailyAnalysisPublishStatus>(["draft", "pending", "published"])

type RouteContext = { params: Promise<{ date: string }> }

function isValidDate(date: string): boolean {
  return DATE_PATTERN.test(date)
}

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { date } = await context.params
  const article = await getDailyAnalysisByDate(date)
  if (!article) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ article })
}

export async function PUT(request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { date } = await context.params
  if (!isValidDate(date)) {
    return Response.json({ error: "Invalid date" }, { status: 400 })
  }

  const existing = await getDailyAnalysisByDate(date)
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json()) as Partial<DailyAnalysis>
  if (body.publishStatus && !PUBLISH_STATUSES.has(body.publishStatus)) {
    return Response.json({ error: "Invalid publishStatus" }, { status: 400 })
  }

  const article: DailyAnalysis = {
    ...existing,
    title: typeof body.title === "string" ? body.title.trim() : existing.title,
    summary: typeof body.summary === "string" ? body.summary : existing.summary,
    vnindexAnalysis:
      typeof body.vnindexAnalysis === "string" ? body.vnindexAnalysis : existing.vnindexAnalysis,
    goldAnalysis:
      typeof body.goldAnalysis === "string" ? body.goldAnalysis : existing.goldAnalysis,
    usMacroSummary:
      typeof body.usMacroSummary === "string" ? body.usMacroSummary : existing.usMacroSummary,
    cta: typeof body.cta === "string" ? body.cta : existing.cta,
    publishStatus: body.publishStatus ?? existing.publishStatus,
    updatedAt: new Date().toISOString(),
  }

  const saved = await saveDailyAnalysis(article)
  return Response.json({ article: saved })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { date } = await context.params
  if (!isValidDate(date)) {
    return Response.json({ error: "Invalid date" }, { status: 400 })
  }

  await deleteDailyAnalysis(date)
  return Response.json({ ok: true })
}
