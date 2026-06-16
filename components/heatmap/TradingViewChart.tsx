"use client"

import { useEffect, useId, useRef, useState } from "react"

import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => void
    }
  }
}

const TV_SCRIPT_SRC = "https://s3.tradingview.com/tv.js"

let tvScriptPromise: Promise<void> | null = null

function loadTradingViewScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.TradingView) return Promise.resolve()
  if (tvScriptPromise) return tvScriptPromise

  tvScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TV_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("TradingView script failed")))
      return
    }

    const script = document.createElement("script")
    script.src = TV_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("TradingView script failed"))
    document.head.appendChild(script)
  })

  return tvScriptPromise
}

type TradingViewChartProps = {
  symbol: string
  className?: string
  onAvailabilityChange?: (available: boolean) => void
}

export function TradingViewChart({
  symbol,
  className,
  onAvailabilityChange,
}: TradingViewChartProps) {
  const { lang } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const containerId = useId().replace(/:/g, "")
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ""
    setFailed(false)
    onAvailabilityChange?.(false)

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.TradingView) {
          throw new Error("TradingView unavailable")
        }

        const mount = document.createElement("div")
        mount.id = containerId
        mount.className = "h-full w-full"
        containerRef.current.appendChild(mount)

        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: lang === "vi" ? "vi_VN" : "en",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          container_id: containerId,
          studies: [],
        })

        if (!cancelled) onAvailabilityChange?.(true)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          onAvailabilityChange?.(false)
        }
      })

    return () => {
      cancelled = true
      container.innerHTML = ""
      onAvailabilityChange?.(false)
    }
  }, [symbol, lang, containerId, onAvailabilityChange])

  if (failed) return null

  return (
    <div
      className={cn(
        "relative min-h-[220px] overflow-hidden rounded-md border border-border bg-chart-bg sm:min-h-[320px]",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
}
