"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type LivestreamStatus = {
  isLive: boolean
  activePlatform: "youtube" | "facebook" | "tiktok" | null
  url: string
}

const POLL_MS = 60_000

const OFFLINE_FALLBACK_HREF =
  process.env.NEXT_PUBLIC_LIVESTREAM_FACEBOOK_PAGE ??
  process.env.NEXT_PUBLIC_LIVE_STREAM_FACEBOOK?.replace(/\/live\/?$/, "") ??
  "https://www.facebook.com/your-page"

export function LiveNavLink({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<LivestreamStatus | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const response = await fetch("/api/livestream/status")
        if (!response.ok) return
        const data = (await response.json()) as LivestreamStatus
        if (!cancelled) setStatus(data)
      } catch {
        // keep last known status
      }
    }

    fetchStatus()
    const intervalId = window.setInterval(fetchStatus, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  const isLive = status?.isLive ?? false
  const href = status?.url ?? OFFLINE_FALLBACK_HREF

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "pointer-events-auto inline-flex items-center font-extrabold uppercase tracking-wider transition-colors",
        compact
          ? "px-3 text-sm leading-none"
          : "px-3 py-1 text-sm leading-none sm:text-base",
        isLive
          ? "text-[#c41e3a] hover:text-red-400"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {isLive ? (
        <span
          className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#c41e3a] animate-live-dot-pulse"
          aria-hidden="true"
        />
      ) : null}
      LIVE
    </a>
  )
}
