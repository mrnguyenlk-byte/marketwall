"use client"

import { useEffect, useRef } from "react"
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts"

import type { VnChartResponse } from "@/hooks/useVietnamChart"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type VietnamNativeChartProps = {
  symbol: string
  className?: string
  data?: VnChartResponse
  isLoading?: boolean
  hasError?: boolean
}

const MA_COLORS = {
  ma10: "#fbbf24",
  ma20: "#22d3ee",
  ma50: "#a78bfa",
} as const

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function toChartTime(date: string): Time {
  return date as Time
}

export function VietnamNativeChart({
  symbol,
  className,
  data,
  isLoading,
  hasError,
}: VietnamNativeChartProps) {
  const { t } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !data?.bars?.length) return

    const border = cssVar("--border", "#334155")
    const text = cssVar("--muted-foreground", "#94a3b8")
    const gain = cssVar("--gain", "#22c55e")
    const loss = cssVar("--loss", "#ef4444")

    const chart: IChartApi = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 360,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: text,
        fontFamily: "var(--font-geist-mono, monospace)",
      },
      grid: {
        vertLines: { visible: true, color: border },
        horzLines: { visible: true, color: border },
      },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
    })

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: gain,
      downColor: loss,
      borderUpColor: gain,
      borderDownColor: loss,
      wickUpColor: gain,
      wickDownColor: loss,
    })

    candles.setData(
      data.bars.map((bar) => ({
        time: toChartTime(bar.time),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    )

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    })

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.28 },
    })

    volumeSeries.setData(
      data.bars.map((bar) => ({
        time: toChartTime(bar.time),
        value: bar.volume,
        color: bar.close >= bar.open ? `${gain}66` : `${loss}66`,
      })),
    )

    const maSeries: ISeriesApi<"Line">[] = []
    const maDefs = [
      { key: "ma10" as const, color: MA_COLORS.ma10, label: "MA10" },
      { key: "ma20" as const, color: MA_COLORS.ma20, label: "MA20" },
      { key: "ma50" as const, color: MA_COLORS.ma50, label: "MA50" },
    ]

    for (const ma of maDefs) {
      const points = data[ma.key]
      if (!points?.length) continue
      const line = chart.addSeries(LineSeries, {
        color: ma.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: ma.label,
      })
      line.setData(points.map((p) => ({ time: toChartTime(p.time), value: p.value })))
      maSeries.push(line)
    }

    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight || 360 })
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [data, symbol])

  const showLoading = isLoading && !data?.bars?.length
  const showError = hasError || (data?.unavailable && !data?.bars?.length)

  return (
    <div
      className={cn(
        "relative min-h-[220px] overflow-hidden rounded-md border border-border bg-chart-bg sm:min-h-[360px]",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {data?.bars?.length ? (
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-2 text-[10px] font-medium">
          <span className="rounded bg-card/80 px-1.5 py-0.5 text-gain">MA10</span>
          <span className="rounded bg-card/80 px-1.5 py-0.5 text-cyan-400">MA20</span>
          <span className="rounded bg-card/80 px-1.5 py-0.5 text-violet-400">MA50</span>
        </div>
      ) : null}
      {(showLoading || showError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-chart-bg/90 px-4 text-center text-xs text-muted-foreground">
          {showLoading ? t("heatmapDetail.chartLoading") : t("heatmapDetail.chartFallback")}
        </div>
      )}
    </div>
  )
}
