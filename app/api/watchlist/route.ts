import { auth } from "@/auth"
import {
  addUserWatchlistSymbol,
  getUserWatchlistSymbols,
  removeUserWatchlistSymbol,
  setUserWatchlistSymbols,
} from "@/lib/watchlist-service"
import { isWatchlistSymbol } from "@/lib/watchlist"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const symbols = await getUserWatchlistSymbols(session.user.id)
    return Response.json({ symbols })
  } catch {
    return Response.json({ error: "Failed to load watchlist" }, { status: 500 })
  }
}

type WatchlistBody = {
  symbol?: string
  symbols?: string[]
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as WatchlistBody

    if (Array.isArray(body.symbols)) {
      const symbols = await setUserWatchlistSymbols(session.user.id, body.symbols)
      return Response.json({ symbols })
    }

    const symbol = body.symbol?.trim().toUpperCase()
    if (!symbol || !isWatchlistSymbol(symbol)) {
      return Response.json({ error: "Invalid or missing symbol" }, { status: 400 })
    }

    const symbols = await addUserWatchlistSymbol(session.user.id, symbol)
    return Response.json({ symbols })
  } catch {
    return Response.json({ error: "Failed to update watchlist" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const symbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase()
  if (!symbol || !isWatchlistSymbol(symbol)) {
    return Response.json({ error: "Invalid or missing symbol" }, { status: 400 })
  }

  try {
    const symbols = await removeUserWatchlistSymbol(session.user.id, symbol)
    return Response.json({ symbols })
  } catch {
    return Response.json({ error: "Failed to remove symbol" }, { status: 500 })
  }
}
