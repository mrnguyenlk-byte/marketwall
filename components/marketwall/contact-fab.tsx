"use client"

import { useLang } from "@/lib/i18n"
import { TELEGRAM_LINK, ZALO_LINK } from "@/lib/social-links"
import { cn } from "@/lib/utils"

const fabClass =
  "flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-colors"

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-white", className)} aria-hidden>
      <path d="M17.871 3.385a15.908 15.908 0 0 0-5.812-1.385c-5.578 0-10.059 3.896-10.059 8.694 0 2.566 1.382 4.885 3.531 6.451L3.634 22l4.647-1.93c1.176.362 2.426.56 3.773.56 5.578 0 10.059-3.896 10.059-8.694 0-.485-.038-.962-.115-1.426.888-.675 1.721-1.454 2.436-2.348-.337.028-.68.042-1.025.042-5.578 0-10.1 3.842-10.1 8.506 0 1.496.472 2.886 1.263 4.042.273-.196.552-.381.838-.552-.068-.514-.105-1.038-.105-1.574 0-4.08 3.544-7.392 7.915-7.392.309 0 .613.017.914.05z" />
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-white", className)} aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

export function ContactFab() {
  const { t } = useLang()

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      <a
        href={ZALO_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(fabClass, "bg-[#0068FF] hover:bg-[#0056d6]")}
        aria-label={t("contactFab.zalo")}
        title={t("contactFab.zalo")}
      >
        <ZaloIcon className="size-8" />
      </a>
      <a
        href={TELEGRAM_LINK}
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
