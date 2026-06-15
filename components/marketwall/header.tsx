"use client"

import { Bell, Menu, Search, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "./language-switcher"
import { useLang } from "@/lib/i18n"
import { notifications } from "@/lib/market-data"

const navKeys = [
  "nav.dashboard",
  "nav.markets",
  "nav.heatmaps",
  "nav.events",
  "nav.news",
  "nav.watchlist",
  "nav.brokers",
] as const

export function Header() {
  const { t, lang } = useLang()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <a href="#" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrendingUp className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Market<span className="text-primary">Wall</span>
          </span>
        </a>

        {/* Primary nav */}
        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {navKeys.map((key, i) => (
            <a
              key={key}
              href="#"
              className={
                "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                (i === 0
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t(key)}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          {/* Search */}
          <div className="relative hidden md:block md:w-44 lg:w-64">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder={t("action.search")}
              aria-label={t("action.search")}
              className="h-9 border-border bg-secondary/60 pl-8 text-sm"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t("action.search")}
          >
            <Search className="size-5" />
          </Button>

          <LanguageSwitcher />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={t("action.notifications")}
              >
                <Bell className="size-5" />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-loss ring-2 ring-background" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                {t("action.notifications")}
                <Badge variant="secondary" className="text-[10px]">
                  {notifications.length}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((n, i) => (
                <DropdownMenuItem
                  key={i}
                  className="flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-sm font-medium text-foreground">
                    {n.title[lang]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {n.detail[lang]}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {n.time[lang]}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth */}
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

          {/* Mobile nav */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden"
                aria-label="Menu"
              >
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {navKeys.map((key) => (
                <DropdownMenuItem key={key}>{t(key)}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="sm:hidden">
                {t("action.login")}
              </DropdownMenuItem>
              <DropdownMenuItem className="sm:hidden font-semibold text-primary">
                {t("action.register")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
