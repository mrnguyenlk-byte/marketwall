"use client"

import { usePathname } from "next/navigation"
import { HeaderSearch } from "./header-search"
import { BrandLogo } from "./brand-logo"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { AuthButtons } from "./auth-buttons"
import { TickerBar } from "./ticker-bar"
import { useLang } from "@/lib/i18n"
import type { TickerBarItem } from "@/lib/market-types"
import { cn } from "@/lib/utils"
import { LiveNavLink } from "./live-nav-link"

const NAV_ITEMS: { key: string; href: string; match?: string }[] = [
  { key: "nav.dashboard", href: "/" },
  { key: "nav.dailyAnalysis", href: "/#daily-analysis" },
  { key: "nav.brokers", href: "/brokers", match: "/brokers" },
  { key: "nav.contact", href: "/contact", match: "/contact" },
]

type HeaderProps = {
  tickerItems?: TickerBarItem[]
}

export function Header({ tickerItems }: HeaderProps) {
  const { t } = useLang()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative flex h-11 w-full items-center justify-between gap-2 px-3 sm:px-4 md:h-16 lg:px-6">
        <div className="ml-1 flex shrink-0 items-center">
          <BrandLogo height={44} priority className="md:hidden" />
          <BrandLogo height={72} priority className="hidden md:inline-flex" />
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
          <HeaderSearch />
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
