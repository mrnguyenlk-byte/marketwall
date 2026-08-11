import { runTelegramMarketAlerts } from "@/lib/telegram/market-alerts"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function isAuthorized(request: Request): boolean {
  const secrets = [
    process.env.CRON_SECRET?.trim(),
    process.env.SYNC_SECRET?.trim(),
    process.env.DAILY_AUTOMATION_SECRET?.trim(),
  ].filter((value): value is string => Boolean(value))
  // Match the existing scheduled sync behaviour: production Cron can run even
  // before a dedicated cron secret is configured.
  if (!secrets.length) return true
  const authorization = request.headers.get("authorization")
  const headerSecret = request.headers.get("x-btrading-secret")
  return secrets.some(
    (secret) => authorization === `Bearer ${secret}` || headerSecret === secret,
  )
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const result = await runTelegramMarketAlerts()
  return Response.json({ ok: result.status !== "failed", ...result })
}
