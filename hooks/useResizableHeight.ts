"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const HEATMAP_PANEL_HEIGHT_KEY = "heatmap-height"
const LEGACY_HEATMAP_PANEL_HEIGHT_KEY = "heatmap-panel-height"

export const HEATMAP_HEIGHT_DEFAULT = 650
export const HEATMAP_HEIGHT_MIN = 500
export const HEATMAP_HEIGHT_MAX = 1500

function clampHeight(height: number): number {
  return Math.min(HEATMAP_HEIGHT_MAX, Math.max(HEATMAP_HEIGHT_MIN, Math.round(height)))
}

function readStoredHeight(): number | null {
  try {
    const raw =
      localStorage.getItem(HEATMAP_PANEL_HEIGHT_KEY) ??
      localStorage.getItem(LEGACY_HEATMAP_PANEL_HEIGHT_KEY)
    if (raw == null) return null
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    const clamped = clampHeight(n)
    if (localStorage.getItem(LEGACY_HEATMAP_PANEL_HEIGHT_KEY) != null) {
      localStorage.setItem(HEATMAP_PANEL_HEIGHT_KEY, String(clamped))
      localStorage.removeItem(LEGACY_HEATMAP_PANEL_HEIGHT_KEY)
    }
    return clamped
  } catch {
    return null
  }
}

function persistHeight(height: number) {
  try {
    localStorage.setItem(HEATMAP_PANEL_HEIGHT_KEY, String(height))
    localStorage.removeItem(LEGACY_HEATMAP_PANEL_HEIGHT_KEY)
  } catch {
    // ignore quota / private mode
  }
}

export function useResizableHeight() {
  const [height, setHeight] = useState<number | null>(null)
  const heightRef = useRef<number | null>(null)

  useEffect(() => {
    const stored = readStoredHeight()
    if (stored != null) {
      heightRef.current = stored
      setHeight(stored)
    }
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (heightRef.current == null) return
      const clamped = clampHeight(heightRef.current)
      heightRef.current = clamped
      setHeight(clamped)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const startResize = useCallback((clientY: number, startHeight: number) => {
    const baseHeight = clampHeight(startHeight)
    heightRef.current = baseHeight
    setHeight(baseHeight)

    const startY = clientY

    const onMove = (e: PointerEvent) => {
      const next = clampHeight(baseHeight + (e.clientY - startY))
      heightRef.current = next
      setHeight(next)
    }

    const onUp = () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      if (heightRef.current != null) {
        persistHeight(heightRef.current)
      }
    }

    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [])

  return { height, startResize, defaultHeight: HEATMAP_HEIGHT_DEFAULT }
}
