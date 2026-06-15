"use client"

import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLang, type Lang } from "@/lib/i18n"

const options: { code: Lang; flag: string; label: string }[] = [
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "en", flag: "🇺🇸", label: "English" },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  const current = options.find((o) => o.code === lang)!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-foreground" />
        }
      >
        <span className="text-base leading-none" aria-hidden>
          {current.flag}
        </span>
        <span className="text-xs font-semibold uppercase">{current.code}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.code}
            onClick={() => setLang(o.code)}
            className="gap-2"
          >
            <span className="text-base leading-none" aria-hidden>
              {o.flag}
            </span>
            <span className="flex-1 text-sm">{o.label}</span>
            {lang === o.code && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
