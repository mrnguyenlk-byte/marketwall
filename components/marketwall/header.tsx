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

const NAV_ITEMS: { key: string; href: string; match?: string }[] = [
  { key: "nav.dashboard", href: "/" },
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
      {/* Row 1 — logo left, utilities + search right */}
      <div className="flex h-11 w-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
        <BrandLogo height={36} priority className="shrink-0" />

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:flex-nowrap sm:gap-2">
          <div className="relative order-2 w-full min-w-0 sm:order-1 sm:w-44 md:w-52 lg:w-60">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("action.searchFull")}
              aria-label={t("action.searchFull")}
              className="h-8 w-full rounded-md border-border bg-surface-muted pl-8 text-xs"
            />
          </div>
          <div className="order-1 flex shrink-0 items-center gap-0.5 sm:order-2 sm:gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <AuthButtons />
          </div>
        </div>
      </div>

      {/* Row 2 — compact navigation */}
      <nav
        aria-label="Main navigation"
        className="flex h-[26px] items-center justify-center gap-0 border-t border-border/80 px-3 sm:px-4 lg:px-6"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.match
            ? pathname === item.match
            : item.href === "/" && pathname === "/"
          return (
            <a
              key={item.key}
              href={item.href}
              className={cn(
                "relative px-3 text-xs font-medium leading-none transition-colors",
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

      {/* Row 3 — live ticker (dashboard only) */}
      {tickerItems ? <TickerBar items={tickerItems} compact /> : null}
    </header>
  )
}
