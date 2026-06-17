"use client"

import { Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { BrandLogo } from "./brand-logo"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { AuthButtons } from "./auth-buttons"
import { TickerBar } from "./ticker-bar"
import { useLang } from "@/lib/i18n"
import type { TickerBarItem } from "@/lib/market-types"
import { cn } from "@/lib/utils"
import {
  isLiveStreamActive,
  PRIMARY_LIVE_STREAM_URL,
} from "@/lib/config/live-streams"

const LIVE_ACTIVE = isLiveStreamActive()

const NAV_ITEMS: { key: string; href: string; match?: string }[] = [
  { key: "nav.dashboard", href: "/" },
  { key: "nav.brokers", href: "/brokers", match: "/brokers" },
  { key: "nav.contact", href: "/contact", match: "/contact" },
]

type HeaderProps = {
  tickerItems?: TickerBarItem[]
}

function LiveNavLink({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={PRIMARY_LIVE_STREAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "pointer-events-auto relative font-extrabold uppercase tracking-wider transition-colors",
        compact
          ? "px-3 text-sm leading-none"
          : "px-3 py-1 text-sm leading-none sm:text-base",
        LIVE_ACTIVE
          ? "animate-live-pulse text-red-500 hover:text-red-400"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      LIVE
    </a>
  )
}

export function Header({ tickerItems }: HeaderProps) {
  const { t } = useLang()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative flex h-11 w-full items-center justify-between gap-2 px-3 sm:px-4 md:h-14 lg:px-6">
        <div className="ml-1 flex shrink-0 items-center">
          <BrandLogo height={40} priority className="md:hidden" />
          <BrandLogo height={64} priority className="hidden md:inline-flex" />
        </div>

        <nav
          aria-label="Main navigation"
          className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-0 md:flex"
        >
          <LiveNavLink />
          {NAV_ITEMS.map((item) => {
            const active = item.match
              ? pathname === item.match
              : item.href === "/" && pathname === "/"
            return (
              <a
                key={item.key}
                href={item.href}
                className={cn(
                  "pointer-events-auto relative px-3 py-1 text-[13px] font-semibold leading-none transition-colors sm:text-sm",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {t(item.key)}
                {active && (
                  <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </a>
            )
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <div className="relative hidden w-44 min-w-0 sm:block md:w-48 lg:w-56">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("action.searchFull")}
              aria-label={t("action.searchFull")}
              className="h-8 w-full rounded-md border-border bg-surface-muted pl-8 text-xs"
            />
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <AuthButtons />
          </div>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex h-[26px] items-center justify-center gap-0 border-t border-border/80 px-3 md:hidden"
      >
        <LiveNavLink compact />
        {NAV_ITEMS.map((item) => {
          const active = item.match
            ? pathname === item.match
            : item.href === "/" && pathname === "/"
          return (
            <a
              key={item.key}
              href={item.href}
              className={cn(
                "relative px-3 text-xs font-semibold leading-none transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {t(item.key)}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </a>
          )
        })}
      </nav>

      {tickerItems ? <TickerBar items={tickerItems} compact /> : null}
    </header>
  )
}
