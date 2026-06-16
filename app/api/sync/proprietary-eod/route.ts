import { syncCafefProprietaryEod } from "@/lib/proprietary/sync-cafef-eod"

export const dynamic = "force-dynamic"

/**
 * Manual EOD sync — POST with `Authorization: Bearer <SYNC_SECRET>` or `?force=1` after close.
 * Does not run automatically during market hours unless force=1.
 */
export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET
  const auth = request.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  const url = new URL(request.url)
  const force = url.searchParams.get("force") === "1"

  if (secret && token !== secret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const result = await syncCafefProprietaryEod({ force })
  return Response.json(result, { status: result.ok ? 200 : result.skipped ? 409 : 503 })
}
