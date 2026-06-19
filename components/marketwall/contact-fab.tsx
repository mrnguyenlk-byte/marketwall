"use client"

import { useLang } from "@/lib/i18n"
import { TELEGRAM_LINK } from "@/lib/social-links"
import { cn } from "@/lib/utils"

const fabClass =
  "flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-colors"

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-white", className)} aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

type ContactFabProps = {
  telegramLink?: string
}

export function ContactFab({ telegramLink = TELEGRAM_LINK }: ContactFabProps) {
  const { t } = useLang()

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      <a
        href={telegramLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(fabClass, "bg-[#229ED9] hover:bg-[#1c8bc2]")}
        aria-label={t("contactFab.telegram")}
        title={t("contactFab.telegram")}
      >
        <TelegramIcon className="size-7" />
      </a>
    </div>
  )
}
