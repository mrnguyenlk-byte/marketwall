"use client"

import Image from "next/image"
import Link from "next/link"
import { useLang } from "@/lib/i18n"
import type { DailyAnalysisCard } from "@/lib/daily-analysis/mock-data"
import { cn } from "@/lib/utils"

function PlaceholderChart({ color, variant }: { color: string; variant?: "preview" | "full" }) {
  return (
    <svg
      viewBox="0 0 280 80"
      className={cn(
        "w-full text-muted-foreground/40",
        variant === "preview" ? "h-28 min-h-28 sm:h-40 sm:min-h-40" : "h-28",
      )}
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`chart-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M0 55 L35 48 L70 52 L105 38 L140 42 L175 28 L210 32 L245 18 L280 22 L280 80 L0 80 Z"
        fill={`url(#chart-fill-${color})`}
      />
      <polyline
        points="0,55 35,48 70,52 105,38 140,42 175,28 210,32 245,18 280,22"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type DailyAnalysisArticleCardProps = {
  card: DailyAnalysisCard
  variant?: "preview" | "full"
}

export function DailyAnalysisArticleCard({ card, variant = "full" }: DailyAnalysisArticleCardProps) {
  const { t } = useLang()
  const isPreview = variant === "preview"
  const title = card.title ?? (card.titleKey ? t(card.titleKey) : "")
  const summary =
    (isPreview ? card.summary : card.fullSummary) ??
    (isPreview
      ? card.summaryKey
        ? t(card.summaryKey)
        : ""
      : card.fullSummaryKey
        ? t(card.fullSummaryKey)
        : "")

  return (
    <article className="flex h-full flex-col rounded-lg border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            card.id === "gold"
              ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
              : card.id === "vnindex"
                ? "bg-red-500/15 text-red-700 dark:text-red-300"
                : "bg-primary/15 text-primary",
          )}
          title={card.id === "gold" ? card.symbol : undefined}
        >
          {t(card.badgeKey)}
        </span>
        <time className="text-[11px] text-muted-foreground">{card.date}</time>
      </div>
      <h3
        className={cn(
          "font-semibold leading-snug text-foreground",
          isPreview ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 leading-relaxed text-muted-foreground",
          isPreview ? "line-clamp-2 text-xs" : "text-sm",
        )}
      >
        {summary}
      </p>
      {!isPreview && card.bullets.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm">
          {card.bullets.map((item) => (
            <li key={item.labelKey} className="flex gap-2">
              <span className="shrink-0 font-semibold text-foreground">{t(item.labelKey)}:</span>
              <span className="text-muted-foreground">
                {item.text ?? (item.textKey ? t(item.textKey) : "")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 rounded-md bg-secondary/30 px-2 py-1">
        {card.imageUrl ? (
          <div
            className={cn(
              "relative w-full overflow-hidden",
              isPreview ? "h-28 min-h-28 sm:h-40 sm:min-h-40" : "h-28",
            )}
          >
            <Image
              src={card.imageUrl}
              alt=""
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
          </div>
        ) : (
          <PlaceholderChart color={card.chartColor} variant={isPreview ? "preview" : "full"} />
        )}
      </div>
      {!isPreview ? (
        card.href ? (
          <Link
            href={card.href}
            className="mt-4 self-start text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {t("dailyAnalysis.readMore")}
          </Link>
        ) : (
          <button
            type="button"
            className="mt-4 self-start text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {t("dailyAnalysis.readMore")}
          </button>
        )
      ) : null}
    </article>
  )
}
