"use client"

import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type MobileSectionPreviewProps = {
  maxHeight: number
  seeMoreHref?: string
  scrollTargetId?: string
  onSeeMore?: () => void
  children: React.ReactNode
  className?: string
}

export function MobileSectionPreview({
  maxHeight,
  seeMoreHref,
  scrollTargetId,
  onSeeMore,
  children,
  className,
}: MobileSectionPreviewProps) {
  const { t } = useLang()

  const handleScroll = () => {
    if (onSeeMore) {
      onSeeMore()
      return
    }
    if (scrollTargetId) {
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const linkClassName =
    "inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"

  return (
    <div className={cn("relative min-w-0", className)}>
      <div className="overflow-hidden" style={{ maxHeight: `${maxHeight}px` }}>
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-9 h-14 bg-gradient-to-t from-background via-background/80 to-transparent"
      />
      <div className="relative z-10 flex justify-center border-t border-border/50 bg-background py-2">
        {seeMoreHref ? (
          <Link href={seeMoreHref} className={linkClassName}>
            {t("action.viewMore")}
            <ChevronDown className="size-3.5" aria-hidden />
          </Link>
        ) : (
          <button type="button" onClick={handleScroll} className={linkClassName}>
            {t("action.viewMore")}
            <ChevronDown className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
