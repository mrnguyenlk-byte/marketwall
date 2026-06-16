"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { features } from "@/lib/config/features"
import type {
  RealtimeEvent,
  RealtimeQuoteEvent,
  RealtimeStatusEvent,
  RealtimeStrengthEvent,
} from "@/lib/realtime/types"
import { REALTIME_CHANNELS } from "@/lib/realtime/types"

type RealtimeContextValue = {
  quoteBySymbol: ReadonlyMap<string, RealtimeQuoteEvent>
  strength: RealtimeStrengthEvent | null
  status: RealtimeStatusEvent
  isRealtime: boolean
}

const defaultStatus: RealtimeStatusEvent = {
  type: "status",
  connected: false,
  fallback: true,
}

const RealtimeContext = createContext<RealtimeContextValue>({
  quoteBySymbol: new Map(),
  strength: null,
  status: defaultStatus,
  isRealtime: false,
})

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [quoteBySymbol, setQuoteBySymbol] = useState<Map<string, RealtimeQuoteEvent>>(
    () => new Map(),
  )
  const [strength, setStrength] = useState<RealtimeStrengthEvent | null>(null)
  const [status, setStatus] = useState<RealtimeStatusEvent>(defaultStatus)
  const eventSourceRef = useRef<EventSource | null>(null)

  const enabled = features.liveClientFetch && features.realtimeStream

  useEffect(() => {
    if (!enabled) return

    const params = new URLSearchParams({
      channels: REALTIME_CHANNELS.join(","),
    })
    const es = new EventSource(`/api/realtime/stream?${params}`)
    eventSourceRef.current = es

    es.onmessage = (message) => {
      let event: RealtimeEvent
      try {
        event = JSON.parse(message.data) as RealtimeEvent
      } catch {
        return
      }

      if (event.type === "quote") {
        setQuoteBySymbol((prev) => {
          const next = new Map(prev)
          next.set(event.symbol, event)
          next.set(event.apiSymbol, event)
          return next
        })
      } else if (event.type === "currency-strength") {
        setStrength(event)
      } else if (event.type === "status") {
        setStatus(event)
      }
    }

    es.onerror = () => {
      setStatus({
        type: "status",
        connected: false,
        fallback: true,
        message: "SSE connection error",
      })
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [enabled])

  const value = useMemo<RealtimeContextValue>(
    () => ({
      quoteBySymbol,
      strength,
      status,
      isRealtime: enabled && status.connected && !status.fallback,
    }),
    [quoteBySymbol, strength, status, enabled],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext)
}

/** Lookup a live quote update by display or API symbol. */
export function useRealtimeQuote(symbol: string): RealtimeQuoteEvent | undefined {
  const { quoteBySymbol } = useRealtime()
  return quoteBySymbol.get(symbol)
}

export function useRealtimeStatus(): RealtimeStatusEvent {
  return useContext(RealtimeContext).status
}

export function useRealtimeStrength(): RealtimeStrengthEvent | null {
  return useContext(RealtimeContext).strength
}

export function useIsRealtimeActive(): boolean {
  return useContext(RealtimeContext).isRealtime
}
