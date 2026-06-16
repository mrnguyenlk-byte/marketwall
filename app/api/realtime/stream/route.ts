import "server-only"

import { OVERVIEW_SYMBOLS } from "@/config/market-symbols"
import { getOverviewQuotes, getForexPairsForCurrencyStrength } from "@/lib/twelvedata/client"
import { getTwelveDataWsRelay } from "@/lib/twelvedata/ws-relay"
import type { RealtimeChannel, RealtimeEvent } from "@/lib/realtime/types"
import { REALTIME_CHANNELS } from "@/lib/realtime/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const KEEPALIVE_MS = 15_000

function parseChannels(raw: string | null): RealtimeChannel[] {
  if (!raw?.trim()) return ["overview"]
  const requested = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const valid = requested.filter((c): c is RealtimeChannel =>
    (REALTIME_CHANNELS as string[]).includes(c),
  )
  return valid.length ? valid : ["overview"]
}

function seedRelayBaselines(): void {
  getTwelveDataWsRelay().seedBaselines(
    OVERVIEW_SYMBOLS.map((def) => ({
      apiSymbol: def.apiSymbol,
      price: 1,
      changePercent: 0,
      open: 1,
    })),
  )
}

async function seedRelayFromRest(channels: RealtimeChannel[]): Promise<void> {
  const relay = getTwelveDataWsRelay()
  seedRelayBaselines()

  if (channels.includes("overview")) {
    try {
      const quotes = await getOverviewQuotes()
      relay.seedBaselines(
        quotes.map((q) => {
          const def = OVERVIEW_SYMBOLS.find((d) => d.displaySymbol === q.symbol)
          return {
            apiSymbol: def?.apiSymbol ?? q.symbol,
            price: q.price,
            changePercent: q.changePercent,
            open: q.open,
          }
        }),
      )
    } catch {
      /* REST fallback only */
    }
  }

  if (channels.includes("currency-strength")) {
    try {
      const pairs = await getForexPairsForCurrencyStrength()
      relay.seedPairQuotes(pairs)
    } catch {
      /* REST fallback only */
    }
  }
}

/** SSE stream relaying Twelve Data WebSocket ticks to browser clients. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const channels = parseChannels(searchParams.get("channels"))

  const relay = getTwelveDataWsRelay()
  await seedRelayFromRest(channels)

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let keepalive: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          /* stream closed */
        }
      }

      send({
        type: "status",
        connected: relay.isConnected(),
        fallback: !relay.isAvailable() || !relay.isConnected(),
        message: relay.isAvailable()
          ? `channels:${channels.join(",")}`
          : "Realtime unavailable — use REST endpoints",
      })

      unsubscribe = relay.subscribe(channels, send)

      keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"))
        } catch {
          /* closed */
        }
      }, KEEPALIVE_MS)
    },
    cancel() {
      if (keepalive) clearInterval(keepalive)
      unsubscribe?.()
    },
  })

  request.signal.addEventListener("abort", () => {
    if (keepalive) clearInterval(keepalive)
    unsubscribe?.()
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

export type RealtimeStreamQuery = {
  channels?: string
}
