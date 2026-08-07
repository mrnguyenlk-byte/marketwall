import { runTelegramMarketAlerts } from "@/lib/telegram/market-alerts"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const result = await runTelegramMarketAlerts()
  return Response.json({ ok: result.status !== "failed", ...result })
}
