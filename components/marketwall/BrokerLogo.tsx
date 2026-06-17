"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import type { Broker } from "@/lib/broker-data"
import { cn } from "@/lib/utils"

export type BrokerLogoVariant = "vn" | "global"

export type BrokerLogoSize = "md" | "lg" | "xl"

const SIZE_CLASS: Record<BrokerLogoSize, string> = {
  md: "h-16 w-[4.75rem] sm:h-[4.5rem] sm:w-20",
  lg: "h-24 w-28 sm:h-28 sm:w-32",
  xl: "h-28 w-32 sm:h-32 sm:w-36",
}

const INITIALS_TEXT: Record<BrokerLogoSize, string> = {
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-3xl sm:text-4xl",
}

function resolveDomain(broker: Broker): string {
  if (broker.domain) return broker.domain
  try {
    return new URL(broker.websiteUrl).hostname.replace(/^www\./i, "")
  } catch {
    return ""
  }
}

/** Remote logo sources tried in order; initials render when all fail. */
export function buildBrokerLogoSources(broker: Broker): string[] {
  const domain = resolveDomain(broker)
  const sources: string[] = []

  if (broker.logoUrl) sources.push(broker.logoUrl)
  if (domain) {
    sources.push(`https://logo.clearbit.com/${domain}`)
    sources.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)
  }

  return sources
}

type BrokerLogoProps = {
  broker: Broker
  variant?: BrokerLogoVariant
  size?: BrokerLogoSize
  className?: string
}

export function BrokerLogo({
  broker,
  variant = "global",
  size = "lg",
  className,
}: BrokerLogoProps) {
  const sources = useMemo(() => buildBrokerLogoSources(broker), [broker])
  const [sourceIndex, setSourceIndex] = useState(0)

  const showInitials = sourceIndex >= sources.length || sources.length === 0
  const currentSrc = showInitials ? null : sources[sourceIndex]

  const shellClass = cn(
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 transition-transform",
    SIZE_CLASS[size],
    variant === "vn"
      ? "bg-gradient-to-br from-[#c41e3a]/30 via-secondary/50 to-card ring-[#c41e3a]/35"
      : "bg-gradient-to-br from-primary/25 via-secondary/50 to-card ring-primary/25",
    className,
  )

  if (showInitials) {
    return (
      <span
        className={cn(
          shellClass,
          "font-bold",
          variant === "vn" ? "text-[#fca5a5]" : "text-primary",
          INITIALS_TEXT[size],
        )}
        aria-hidden
      >
        {broker.initials}
      </span>
    )
  }

  return (
    <span className={cn(shellClass, "bg-card/80")} aria-hidden>
      <Image
        src={currentSrc!}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 640px) 112px, 144px"
        className="object-contain p-2"
        onError={() => setSourceIndex((i) => i + 1)}
      />
    </span>
  )
}
