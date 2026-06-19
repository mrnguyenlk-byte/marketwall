"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const MIN_SCALE = 1
const DEFAULT_SCALE = 1.5
const MAX_SCALE = 4
const ZOOM_STEP = 0.15

type DailyAnalysisChartImageProps = {
  src: string
  alt: string
  variant?: "preview" | "full"
}

export function DailyAnalysisChartImage({ src, alt, variant = "full" }: DailyAnalysisChartImageProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [transformOrigin, setTransformOrigin] = useState("center center")
  const isPreview = variant === "preview"

  const resetZoom = useCallback(() => {
    setScale(DEFAULT_SCALE)
    setTransformOrigin("center center")
  }, [])

  const openLightbox = useCallback(() => {
    resetZoom()
    setIsOpen(true)
    dialogRef.current?.showModal()
  }, [resetZoom])

  const closeLightbox = useCallback(() => {
    dialogRef.current?.close()
    setIsOpen(false)
    resetZoom()
  }, [resetZoom])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setTransformOrigin(`${x}% ${y}%`)
    setScale((current) => {
      const next = current + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next))
    })
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        className={cn(
          "relative block w-full cursor-pointer overflow-hidden rounded-sm transition-shadow",
          "hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isPreview
            ? "aspect-[16/10] min-h-36 sm:min-h-52 md:min-h-56"
            : "h-48 min-h-48 md:h-56 md:min-h-56",
        )}
        aria-label="Xem biểu đồ phóng to"
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setIsOpen(false)
          resetZoom()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLightbox()
        }}
        className="fixed inset-0 z-50 m-0 hidden h-full max-h-full w-full max-w-full items-center justify-center border-0 bg-transparent p-2 backdrop:bg-black/80 open:flex"
      >
        <div className="relative max-h-[95vh] max-w-[min(98vw,1400px)]">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute -right-2 -top-2 z-10 rounded-full border border-border bg-card p-1.5 text-foreground shadow-md transition-colors hover:bg-secondary"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
          <div
            className="overflow-hidden"
            onWheel={handleWheel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="max-h-[95vh] max-w-[min(98vw,1400px)] object-contain transition-transform duration-100"
              style={{
                transform: `scale(${scale})`,
                transformOrigin,
              }}
            />
          </div>
        </div>
      </dialog>
    </>
  )
}
