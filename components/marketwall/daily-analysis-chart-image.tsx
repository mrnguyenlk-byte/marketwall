"use client"

import { useCallback, useRef } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type DailyAnalysisChartImageProps = {
  src: string
  alt: string
  variant?: "preview" | "full"
}

export function DailyAnalysisChartImage({ src, alt, variant = "full" }: DailyAnalysisChartImageProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isPreview = variant === "preview"

  const openLightbox = useCallback(() => {
    dialogRef.current?.showModal()
  }, [])

  const closeLightbox = useCallback(() => {
    dialogRef.current?.close()
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
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLightbox()
        }}
        className="fixed inset-0 z-50 m-0 flex h-full max-h-full w-full max-w-full items-center justify-center border-0 bg-transparent p-4 backdrop:bg-black/80 open:flex"
      >
        <div className="relative max-h-[90vh] max-w-[min(95vw,1200px)]">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute -right-2 -top-2 z-10 rounded-full border border-border bg-card p-1.5 text-foreground shadow-md transition-colors hover:bg-secondary"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-[85vh] max-w-full object-contain" />
        </div>
      </dialog>
    </>
  )
}
