"use client"

import type { ReactNode } from "react"

import Link from "next/link"
import { Check } from "lucide-react"
import { useLang } from "@/lib/i18n"
import { MarketOverview } from "./market-overview"
import type { OverviewCategory, OverviewListItem } from "@/lib/market-data"

const SIDEBAR_W = 300
/** ~1.45× natural height (123px) — taller box, image fills edge-to-edge */
const BANNER_H = {
  promo: 178,
  partner: 198,
} as const

const BANNER_BG = {
  promo: "/ads/banner-promo-bg.png",
  partner: "/ads/banner-partner-bg.png",
} as const

const PRO_BULLETS = [
  "ad.proBroker.b1",
  "ad.proBroker.b2",
  "ad.proBroker.b3",
  "ad.proBroker.b4",
] as const

function BannerShell({
  href,
  ariaLabel,
  bg,
  height,
  children,
}: {
  href: string
  ariaLabel: string
  bg: string
  height: number
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group relative block w-full shrink-0 overflow-hidden rounded-[12px] border border-border bg-[#060d17] shadow-md transition-opacity hover:opacity-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
      style={{ width: SIDEBAR_W, height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-right"
      />
      <div className="relative z-10 flex h-full w-[58%] flex-col justify-between bg-gradient-to-r from-[#060d17]/85 via-[#060d17]/40 to-transparent px-4 py-4">
        {children}
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
      bg={BANNER_BG.promo}
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
      bg={BANNER_BG.partner}
      height={BANNER_H.partner}
    >
      <div>
        <h3 className="text-[14px] font-bold leading-[1.25] tracking-tight text-white drop-shadow-sm">
          {t("ad.proBroker.title")}
        </h3>
        <ul className="mt-2 space-y-1">
          {PRO_BULLETS.map((key) => (
            <li
              key={key}
              className="flex items-center gap-1.5 text-[11px] font-medium leading-tight text-white/95 drop-shadow-sm"
            >
              <Check className="size-3 shrink-0 text-warn" strokeWidth={2.5} aria-hidden />
              {t(key)}
            </li>
          ))}
        </ul>
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
      <MarketOverview overviewByCategory={overviewByCategory} />
    </div>
  )
}
