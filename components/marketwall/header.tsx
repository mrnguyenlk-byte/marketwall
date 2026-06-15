"use client"

import { Bell, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "./language-switcher"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const NAV_ITEMS: { key: string; href: string; active?: boolean }[] = [
  { key: "nav.dashboard", href: "#", active: true },
  { key: "nav.markets", href: "#" },
  { key: "nav.heatmaps", href: "#" },
  { key: "nav.events", href: "#" },
  { key: "nav.news", href: "#" },
  { key: "nav.brokers", href: "#" },
]

export function Header() {
  const { t } = useLang()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 w-full items-center gap-3 px-3 lg:gap-4 lg:px-4">
        <a href="#" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrendingUp className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Market<span className="text-primary">Wall</span>
          </span>
        </a>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-0.5 xl:flex"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="relative mx-auto hidden w-full max-w-sm md:block lg:max-w-md">
          <Input
            type="search"
            placeholder={t("action.searchFull")}
            aria-label={t("action.searchFull")}
            className="h-9 border-border bg-secondary/60 text-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label={t("action.notifications")}
          >
            <Bell className="size-5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-foreground sm:inline-flex"
          >
            {t("action.login")}
          </Button>
          <Button size="sm" className="hidden font-semibold sm:inline-flex">
            {t("action.register")}
          </Button>
        </div>
      </div>
    </header>
  )
}
