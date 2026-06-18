import { syncCafefProprietaryEod } from "@/lib/proprietary/sync-cafef-eod"

export const dynamic = "force-dynamic"

function isAuthorized(request: Request): boolean {
  const secret = process.env.SYNC_SECRET?.trim()
  if (!secret) return true

  const auth = request.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (token === secret) return true

  const cronSecret = process.env.CRON_SECRET?.trim()
  const cronHeader = request.headers.get("authorization")
  if (cronSecret && cronHeader === `Bearer ${cronSecret}`) return true

  const url = new URL(request.url)
  return url.searchParams.get("force") === "1"
}

/**
 * Manual EOD sync — POST/GET with `Authorization: Bearer <SYNC_SECRET>` or Vercel cron.
 * Does not run automatically during market hours unless force=1.
 */
async function runSync(request: Request) {
  const url = new URL(request.url)
  const force = url.searchParams.get("force") === "1"

  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const result = await syncCafefProprietaryEod({ force })
  return Response.json(result, { status: result.ok ? 200 : result.skipped ? 409 : 503 })
}

export async function POST(request: Request) {
  return runSync(request)
}

/** Vercel Cron invokes GET on schedule (weekdays 17:30 ICT). */
export async function GET(request: Request) {
  return runSync(request)
}
