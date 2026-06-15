"use client"

import { useLang } from "@/lib/i18n"
import { ZALO_LINK } from "@/lib/social-links"
import { cn } from "@/lib/utils"

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-white", className)} aria-hidden>
      <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.64 1.35 5 3.48 6.58L4.5 20.5l3.9-1.62C9.38 19.16 10.66 19.5 12 19.5c5.52 0 10-3.82 10-9S17.52 2 12 2zm-2.2 11.2-2.5-2.7 5.1-4.8 2.5 2.7-5.1 4.8zm4.4 0-5.1-4.8 2.5-2.3 5.1 4.8-2.5 2.3z" />
    </svg>
  )
}

export function ContactFab() {
  const { t } = useLang()

  return (
    <a
      href={ZALO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 flex size-14 items-center justify-center rounded-full bg-[#0068FF] text-white shadow-lg transition-colors hover:bg-[#0056d6]"
      aria-label={t("contactFab.zalo")}
      title={t("contactFab.zalo")}
    >
      <ZaloIcon className="size-8" />
    </a>
  )
}
