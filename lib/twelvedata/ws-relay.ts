import "server-only"

import { buildCurrencyStrengthSnapshot } from "@/lib/currency-strength"
import { sanitizePairSymbol, parsePairSymbol } from "@/lib/currency-strength/normalize-pairs"
import { round2 } from "@/lib/market/normalize"
import { apiSymbolToDisplay, symbolsForChannels } from "@/lib/realtime/symbols"
import type {
  RealtimeChannel,
  RealtimeEvent,
  RealtimeQuoteEvent,
  RealtimeStrengthEvent,
} from "@/lib/realtime/types"

const WS_URL = "wss://ws.twelvedata.com/v1/quotes/price"
const HEARTBEAT_MS = 10_000
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

type PriceBaseline = {
  open: number
  changePercent: number
}

type PairCacheEntry = {
  symbol: string
  price: number
  changePercent: number
  updatedAt: string
}

type Listener = (event: RealtimeEvent) => void

type Subscription = {
  channels: RealtimeChannel[]
  listener: Listener
}

function getApiKey(): string | null {
  try {
    const key = process.env.TWELVE_DATA_API_KEY?.trim()
    return key || null
  } catch {
    return null
  }
}

function getWebSocketCtor(): typeof WebSocket | null {
  if (typeof globalThis.WebSocket === "function") return globalThis.WebSocket
  return null
}

function pairKeyFromApiSymbol(apiSymbol: string): string | null {
  const sanitized = sanitizePairSymbol(apiSymbol.replace("/", ""))
  return sanitized ?? null
}

function computeChangePercent(price: number, open: number): number {
  if (open <= 0) return 0
  return round2(((price - open) / open) * 100)
}

class TwelveDataWsRelay {
  private ws: WebSocket | null = null
  private subscriptions = new Set<Subscription>()
  private subscribedSymbols = new Set<string>()
  private baselines = new Map<string, PriceBaseline>()
  private pairCache = new Map<string, PairCacheEntry>()
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0
  private connecting = false
  private connected = false
  private unavailableReason: string | null = null

  isConnected(): boolean {
    return this.connected
  }

  isAvailable(): boolean {
    return Boolean(getApiKey()) && Boolean(getWebSocketCtor())
  }

  subscribe(channels: RealtimeChannel[], listener: Listener): () => void {
    const sub: Subscription = { channels, listener }
    this.subscriptions.add(sub)

    listener({
      type: "status",
      connected: this.connected,
      fallback: !this.connected,
      message: this.unavailableReason ?? undefined,
    })

    void this.ensureConnection()
    this.syncSymbolSubscriptions()

    return () => {
      this.subscriptions.delete(sub)
      this.syncSymbolSubscriptions()
      if (this.subscriptions.size === 0) {
        this.disconnect()
      }
    }
  }

  /** Seed open prices from REST so WS ticks can derive change %. */
  seedBaselines(
    rows: Array<{ apiSymbol: string; price: number; changePercent: number; open?: number }>,
  ): void {
    for (const row of rows) {
      const open =
        row.open && row.open > 0
          ? row.open
          : row.changePercent !== 0
            ? row.price / (1 + row.changePercent / 100)
            : row.price
      this.baselines.set(row.apiSymbol, {
        open: round2(open),
        changePercent: row.changePercent,
      })
    }
  }

  /** Seed FX pair cache from REST for immediate strength recalculation. */
  seedPairQuotes(
    rows: Array<{ symbol: string; price: number; changePercent: number; updatedAt?: string }>,
  ): void {
    const updatedAt = new Date().toISOString()
    for (const row of rows) {
      const key = pairKeyFromApiSymbol(row.symbol) ?? parsePairSymbol(row.symbol)
      if (!key) continue
      this.pairCache.set(key, {
        symbol: key,
        price: row.price,
        changePercent: row.changePercent,
        updatedAt: row.updatedAt ?? updatedAt,
      })
    }
  }

  private activeChannels(): RealtimeChannel[] {
    const set = new Set<RealtimeChannel>()
    for (const sub of this.subscriptions) {
      for (const ch of sub.channels) set.add(ch)
    }
    return [...set]
  }

  private requiredSymbols(): string[] {
    return symbolsForChannels(this.activeChannels())
  }

  private syncSymbolSubscriptions(): void {
    const required = new Set(this.requiredSymbols())
    const toAdd = [...required].filter((s) => !this.subscribedSymbols.has(s))
    const toRemove = [...this.subscribedSymbols].filter((s) => !required.has(s))

    if (toAdd.length && this.ws?.readyState === WebSocket.OPEN) {
      this.sendJson({
        action: "subscribe",
        params: { symbols: toAdd.join(",") },
      })
      for (const s of toAdd) this.subscribedSymbols.add(s)
    }

    if (toRemove.length && this.ws?.readyState === WebSocket.OPEN) {
      this.sendJson({
        action: "unsubscribe",
        params: { symbols: toRemove.join(",") },
      })
      for (const s of toRemove) this.subscribedSymbols.delete(s)
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.connected || this.connecting) return

    const apiKey = getApiKey()
    const Ws = getWebSocketCtor()
    if (!apiKey) {
      this.unavailableReason = "TWELVE_DATA_API_KEY is not configured"
      this.broadcastStatus(false, true, this.unavailableReason)
      return
    }
    if (!Ws) {
      this.unavailableReason = "WebSocket is not available in this runtime"
      this.broadcastStatus(false, true, this.unavailableReason)
      return
    }

    this.connecting = true
    try {
      const ws = new Ws(`${WS_URL}?apikey=${encodeURIComponent(apiKey)}`)
      this.ws = ws

      ws.addEventListener("open", () => {
        this.connecting = false
        this.connected = true
        this.reconnectAttempt = 0
        this.unavailableReason = null
        this.startHeartbeat()
        this.broadcastStatus(true, false)
        this.subscribedSymbols.clear()
        this.syncSymbolSubscriptions()
      })

      ws.addEventListener("message", (event) => {
        const data = "data" in event ? String(event.data) : ""
        this.handleMessage(data)
      })

      ws.addEventListener("error", () => {
        this.unavailableReason = "Twelve Data WebSocket error"
      })

      ws.addEventListener("close", () => {
        this.connecting = false
        this.connected = false
        this.stopHeartbeat()
        this.subscribedSymbols.clear()
        this.broadcastStatus(false, true, this.unavailableReason ?? "WebSocket closed")
        this.scheduleReconnect()
      })
    } catch {
      this.connecting = false
      this.unavailableReason = "Failed to open WebSocket"
      this.broadcastStatus(false, true, this.unavailableReason)
      this.scheduleReconnect()
    }
  }

  private disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connected = false
    this.connecting = false
    this.subscribedSymbols.clear()
  }

  private scheduleReconnect(): void {
    if (this.subscriptions.size === 0) return
    if (this.reconnectTimer) return

    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_MS,
    )
    this.reconnectAttempt += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.ensureConnection()
    }, delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.sendJson({ action: "heartbeat" })
    }, HEARTBEAT_MS)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private sendJson(payload: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(payload))
  }

  private handleMessage(raw: string): void {
    let json: Record<string, unknown>
    try {
      json = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return
    }

    const eventType = json.event ?? json.type
    if (eventType === "heartbeat" || eventType === "subscribe-status") return
    if (eventType !== "price") return

    const apiSymbol = String(json.symbol ?? "")
    const price = Number(json.price)
    if (!apiSymbol || !Number.isFinite(price) || price <= 0) return

    const updatedAt =
      typeof json.timestamp === "number"
        ? new Date(json.timestamp * 1000).toISOString()
        : new Date().toISOString()

    const baseline = this.baselines.get(apiSymbol)
    const open = baseline?.open ?? price
    const changePercent = computeChangePercent(price, open)
    const displaySymbol = apiSymbolToDisplay(apiSymbol)

    const quoteEvent: RealtimeQuoteEvent = {
      type: "quote",
      symbol: displaySymbol,
      apiSymbol,
      price: round2(price),
      changePercent,
      updatedAt,
    }

    this.broadcastToChannels(quoteEvent)
    this.updatePairCache(apiSymbol, price, changePercent, updatedAt)
    this.maybeBroadcastStrength(updatedAt)
  }

  private updatePairCache(
    apiSymbol: string,
    price: number,
    changePercent: number,
    updatedAt: string,
  ): void {
    const key = pairKeyFromApiSymbol(apiSymbol)
    if (!key) return
    this.pairCache.set(key, { symbol: key, price, changePercent, updatedAt })
  }

  private maybeBroadcastStrength(updatedAt: string): void {
    const channels = this.activeChannels()
    if (!channels.includes("currency-strength")) return
    if (this.pairCache.size < 12) return

    const inputs = [...this.pairCache.values()].map((row) => ({
      symbol: row.symbol,
      price: row.price,
      changePercent: row.changePercent,
      updatedAt: row.updatedAt,
    }))

    const snapshot = buildCurrencyStrengthSnapshot(inputs)
    if (!snapshot.available) return

    const strengthEvent: RealtimeStrengthEvent = {
      type: "currency-strength",
      items: snapshot.currencies.map((c) => ({
        currency: c.code,
        strength: c.strength,
        change: c.changePercent,
        label: c.rankKey,
      })),
      updatedAt,
    }

    this.broadcastToChannel("currency-strength", strengthEvent)
  }

  private channelForQuote(event: RealtimeQuoteEvent): RealtimeChannel[] {
    const matched: RealtimeChannel[] = []
    const { apiSymbol } = event

    if (symbolsForChannels(["overview"]).includes(apiSymbol)) {
      matched.push("overview")
    }
    if (pairKeyFromApiSymbol(apiSymbol)) {
      matched.push("currency-strength")
    }
    if (symbolsForChannels(["heatmap-us"]).includes(apiSymbol)) {
      matched.push("heatmap-us")
    }
    if (symbolsForChannels(["heatmap-crypto"]).includes(apiSymbol)) {
      matched.push("heatmap-crypto")
    }

    return matched
  }

  private broadcastToChannels(event: RealtimeQuoteEvent): void {
    const channels = this.channelForQuote(event)
    for (const sub of this.subscriptions) {
      if (sub.channels.some((ch) => channels.includes(ch))) {
        sub.listener(event)
      }
    }
  }

  private broadcastToChannel(channel: RealtimeChannel, event: RealtimeEvent): void {
    for (const sub of this.subscriptions) {
      if (sub.channels.includes(channel)) {
        sub.listener(event)
      }
    }
  }

  private broadcastStatus(connected: boolean, fallback: boolean, message?: string): void {
    const status: RealtimeEvent = {
      type: "status",
      connected,
      fallback,
      message,
    }
    for (const sub of this.subscriptions) {
      sub.listener(status)
    }
  }
}

type GlobalRelay = typeof globalThis & { __twelveDataWsRelay?: TwelveDataWsRelay }

/** Process-wide relay singleton (survives warm serverless invocations). */
export function getTwelveDataWsRelay(): TwelveDataWsRelay {
  const g = globalThis as GlobalRelay
  if (!g.__twelveDataWsRelay) {
    g.__twelveDataWsRelay = new TwelveDataWsRelay()
  }
  return g.__twelveDataWsRelay
}
