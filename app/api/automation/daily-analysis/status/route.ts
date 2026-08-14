import { putR2Object } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type VpsStatus = {
  checkedAt?: unknown
  reportDate?: unknown
  exitCode?: unknown
  stage?: unknown
  error?: unknown
  expectedSession?: unknown
  vnindexSession?: unknown
  goldSession?: unknown
  logPath?: unknown
  mode?: unknown
}

function text(value: unknown, maximum = 500): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maximum) : null
}

function authorized(request: Request): boolean {
  const expected = process.env.DAILY_AUTOMATION_SECRET?.trim()
  if (!expected) return false
  const direct = request.headers.get("x-btrading-secret")?.trim()
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim()
  return direct === expected || bearer === expected
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: VpsStatus
  try {
    body = (await request.json()) as VpsStatus
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const checkedAt = text(body.checkedAt, 64) ?? new Date().toISOString()
  const reportDate = text(body.reportDate, 10) ?? checkedAt.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return Response.json({ ok: false, error: "Invalid reportDate" }, { status: 422 })
  }

  const status = {
    checkedAt,
    receivedAt: new Date().toISOString(),
    reportDate,
    exitCode: typeof body.exitCode === "number" && Number.isInteger(body.exitCode) ? body.exitCode : 1,
    stage: text(body.stage, 100) ?? "unknown",
    error: text(body.error),
    expectedSession: text(body.expectedSession, 10),
    vnindexSession: text(body.vnindexSession, 10),
    goldSession: text(body.goldSession, 10),
    logPath: text(body.logPath, 260),
    mode: text(body.mode, 32) ?? "unknown",
  }
  const json = JSON.stringify(status, null, 2)

  await Promise.all([
    putR2Object({ key: "daily-analysis/health/latest.json", body: json, contentType: "application/json" }),
    putR2Object({ key: `daily-analysis/health/${reportDate}.json`, body: json, contentType: "application/json" }),
  ])
  console.log("[daily-analysis] VPS_STATUS", status)

  return Response.json({ ok: true, reportDate, stage: status.stage })
}
