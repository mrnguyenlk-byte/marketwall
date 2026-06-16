import "server-only"

import {
  runVnstockCapabilityAudit,
  VNSTOCK_TEST_INDICES,
  VNSTOCK_TEST_STOCKS,
} from "@/lib/providers/vnstock-capability-probe"

export const dynamic = "force-dynamic"

const ALL_SYMBOLS = [...VNSTOCK_TEST_STOCKS, ...VNSTOCK_TEST_INDICES]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolParam = searchParams.get("symbol")?.trim().toUpperCase()
  const symbolsParam = searchParams.get("symbols")?.trim()

  let symbols: string[] | undefined
  if (symbolParam) {
    symbols = [symbolParam]
  } else if (symbolsParam) {
    symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  }

  try {
    const audit = await runVnstockCapabilityAudit(symbols)

    return Response.json({
      ok: true,
      defaultSymbols: ALL_SYMBOLS,
      query: symbols ?? ALL_SYMBOLS,
      ...audit,
    })
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "VNSTOCK audit failed",
        defaultSymbols: ALL_SYMBOLS,
      },
      { status: 500 },
    )
  }
}
