"use client"

import { useEffect, useRef } from "react"
import {
  AreaSeries,
  ColorType,
  createChart,
  LineSeries,
  LineStyle,
  type AreaSeriesPartialOptions,
  type IChartApi,
  type ISeriesApi,
  type LineSeriesPartialOptions,
  type Time,
} from "lightweight-charts"

import { cn } from "@/lib/utils"

export type ChartPoint = { time: number; value: number }

export type ChartSeries = {
  data: ChartPoint[]
  color: string
  lineWidth?: number
}

type LightweightChartProps = {
  series: ChartSeries[]
  height: number
  className?: string
  variant?: "line" | "area"
  showTimeScale?: boolean
  showGrid?: boolean
  /** Fixed left price scale minimum (e.g. currency strength 0). */
  priceMin?: number
  /** Fixed left price scale maximum (e.g. currency strength 100). */
  priceMax?: number
  /** Horizontal reference line (e.g. neutral strength at 50). */
  referencePrice?: number
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function LightweightChart({
  series,
  height,
  className,
  variant = "line",
  showTimeScale = false,
  showGrid = true,
  priceMin,
  priceMax,
  referencePrice,
}: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || series.length === 0) return

    const border = cssVar("--border", "#334155")
    const text = cssVar("--muted-foreground", "#94a3b8")

    const chart: IChartApi = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: text,
        fontFamily: "var(--font-geist-mono, monospace)",
      },
      grid: {
        vertLines: { visible: showGrid, color: border },
        horzLines: { visible: showGrid, color: border },
      },
      rightPriceScale: { visible: false },
      leftPriceScale: {
        visible:
          variant === "line" &&
          (series.length > 1 || (priceMin != null && priceMax != null)),
      },
      timeScale: { visible: showTimeScale, borderColor: border },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    })

    const apiSeries: ISeriesApi<"Line" | "Area">[] = []

    for (const entry of series) {
      const data = entry.data.map((p) => ({ time: p.time as Time, value: p.value }))
      if (variant === "area") {
        const opts: AreaSeriesPartialOptions = {
          lineColor: entry.color,
          topColor: entry.color,
          bottomColor: "transparent",
          lineWidth: (entry.lineWidth ?? 2) as AreaSeriesPartialOptions["lineWidth"],
          priceLineVisible: false,
          lastValueVisible: false,
        }
        const s = chart.addSeries(AreaSeries, opts)
        s.setData(data)
        apiSeries.push(s)
      } else {
        const opts: LineSeriesPartialOptions = {
          color: entry.color,
          lineWidth: (entry.lineWidth ?? 2) as LineSeriesPartialOptions["lineWidth"],
          priceLineVisible: false,
          lastValueVisible: false,
        }
        const s = chart.addSeries(LineSeries, opts)
        s.setData(data)
        apiSeries.push(s)
      }
    }

    if (priceMin != null && priceMax != null) {
      const priceScale = chart.priceScale("left")
      priceScale.applyOptions({ autoScale: false })
      priceScale.setVisibleRange({ from: priceMin, to: priceMax })
    }

    if (referencePrice != null && apiSeries[0]) {
      apiSeries[0].createPriceLine({
        price: referencePrice,
        color: border,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: "",
      })
    }

    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth })
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [series, height, variant, showTimeScale, showGrid, priceMin, priceMax, referencePrice])

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-hidden
    />
  )
}

/** Map numeric array to unix-day chart points for lightweight-charts. */
export function pointsFromValues(values: number[], startTime = 1_704_067_200): ChartPoint[] {
  const day = 86_400
  return values.map((value, i) => ({ time: startTime + i * day, value }))
}
