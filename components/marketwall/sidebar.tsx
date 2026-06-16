"use client"

import type { ReactNode } from "react"

import Link from "next/link"
import { features } from "@/lib/config/features"
import { useLang } from "@/lib/i18n"
import { MarketOverview } from "./market-overview"
import { Watchlist } from "./watchlist"
import { WatchlistSessionSync } from "./watchlist-session-sync"
import { SectionErrorBoundary } from "./section-error-boundary"
import type { OverviewCategory, OverviewListItem } from "@/lib/market-types"

const BANNER_H = {
  promo: 178,
  partner: 178,
} as const

/** Background art with CSS gradient fallback when images are missing. */
const BANNER_IMAGES = {
  promo: "/banners/promo-trade-bg.png",
  partner: "/banners/partner-platform-bg.png",
} as const

const BANNER_GRADIENT =
  "linear-gradient(135deg, #060d17 0%, #0f2847 45%, #1a3a5c 100%)"

function BannerShell({
  href,
  ariaLabel,
  imageSrc,
  height,
  children,
}: {
  href: string
  ariaLabel: string
  imageSrc: string
  height: number
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group block w-full max-w-[300px] shrink-0 overflow-hidden rounded-[12px] border border-border shadow-md transition-opacity hover:opacity-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
      style={{ height }}
    >
      <div
        className="relative h-full w-full bg-[#060d17] bg-cover bg-right bg-no-repeat"
        style={{
          // Image layer on top; gradient underneath when image fails to load.
          backgroundImage: `url("${imageSrc}"), ${BANNER_GRADIENT}`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060d17]/88 from-0% via-[#060d17]/45 via-48% to-transparent to-68%"
        />
        <div className="relative flex h-full w-[62%] flex-col justify-between px-4 py-4">
          {children}
        </div>
      </div>
    </Link>
  )
}

function PromoBanner({ href }: { href: string }) {
  const { t } = useLang()

  return (
    <BannerShell
      href={href}
      ariaLabel={t("ad.brokerPromo.title")}
      imageSrc={BANNER_IMAGES.promo}
      height={BANNER_H.promo}
    >
      <div>
        <h3 className="text-[15px] font-bold leading-[1.25] tracking-tight text-white drop-shadow-sm">
          {t("ad.brokerPromo.title")}
        </h3>
        <p className="mt-2 text-[12px] font-medium leading-[1.4] text-white/90 drop-shadow-sm">
          {t("ad.brokerPromo.subtitle")}
        </p>
      </div>
      <span className="inline-flex h-9 w-fit shrink-0 items-center rounded-lg bg-primary px-4 text-[12px] font-semibold text-white">
        {t("ad.brokerPromo.cta")}
      </span>
    </BannerShell>
  )
}

function PartnerBanner({ href }: { href: string }) {
  const { t } = useLang()

  return (
    <BannerShell
      href={href}
      ariaLabel={t("ad.proBroker.title")}
      imageSrc={BANNER_IMAGES.partner}
      height={BANNER_H.partner}
    >
      <div>
        <h3 className="text-[15px] font-bold leading-[1.25] tracking-tight text-white drop-shadow-sm">
          {t("ad.proBroker.title")}
        </h3>
        <p className="mt-2 text-[12px] font-medium leading-[1.4] text-white/90 drop-shadow-sm">
          {t("ad.proBroker.subtitle")}
        </p>
      </div>
      <span className="inline-flex h-9 w-fit shrink-0 items-center rounded-lg bg-warn px-4 text-[12px] font-semibold text-[#0a0f16]">
        {t("ad.proBroker.cta")}
      </span>
    </BannerShell>
  )
}

export function Sidebar({
  overviewByCategory,
}: {
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>
}) {
  return (
    <div className="flex w-full max-w-[300px] flex-col gap-3 lg:w-[300px]">
      <PromoBanner href="/brokers" />
      <PartnerBanner href="/contact" />
      {features.watchlist && (
        <>
          <WatchlistSessionSync />
          <SectionErrorBoundary name="watchlist">
            <Watchlist />
          </SectionErrorBoundary>
        </>
      )}
      <SectionErrorBoundary name="market-overview">
        <MarketOverview overviewByCategory={overviewByCategory} />
      </SectionErrorBoundary>
    </div>
  )
}
