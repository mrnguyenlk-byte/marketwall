"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"

export function ThemeToggle() {
  const { t } = useLang()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground"
      onClick={toggleTheme}
      aria-label={isDark ? t("action.theme.light") : t("action.theme.dark")}
      title={isDark ? t("action.theme.light") : t("action.theme.dark")}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  )
}
