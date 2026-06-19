"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const MIN_SCALE = 1
const DEFAULT_SCALE = 1.75
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
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 })
  const isPreview = variant === "preview"
  const canPan = scale > 1

  const resetPan = useCallback(() => {
    setTranslateX(0)
    setTranslateY(0)
    setIsDragging(false)
  }, [])

  const resetZoom = useCallback(() => {
    setScale(DEFAULT_SCALE)
    setTransformOrigin("center center")
    resetPan()
  }, [resetPan])

  useEffect(() => {
    if (scale <= MIN_SCALE) {
      resetPan()
    }
  }, [scale, resetPan])

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canPan || e.button !== 0) return
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        translateX,
        translateY,
      }
    },
    [canPan, translateX, translateY],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setTranslateX(dragStartRef.current.translateX + dx)
      setTranslateY(dragStartRef.current.translateY + dy)
    },
    [isDragging],
  )

  const endDrag = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!canPan || e.touches.length !== 1) return
      const touch = e.touches[0]
      setIsDragging(true)
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        translateX,
        translateY,
      }
    },
    [canPan, translateX, translateY],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging || e.touches.length !== 1) return
      e.preventDefault()
      const touch = e.touches[0]
      const dx = touch.clientX - dragStartRef.current.x
      const dy = touch.clientY - dragStartRef.current.y
      setTranslateX(dragStartRef.current.translateX + dx)
      setTranslateY(dragStartRef.current.translateY + dy)
    },
    [isDragging],
  )

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
            className={cn(
              "overflow-hidden select-none",
              canPan && (isDragging ? "cursor-grabbing" : "cursor-grab"),
            )}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={endDrag}
            onTouchCancel={endDrag}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(!isDragging && "transition-transform duration-100")}
              style={{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transformOrigin,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="max-h-[95vh] max-w-[min(98vw,1400px)] object-contain"
              />
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
