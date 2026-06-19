"use client"

import { TelegramIcon, ZaloIcon } from "@/components/marketwall/social-icons"
import { useLang } from "@/lib/i18n"
import { TELEGRAM_LINK, ZALO_LINK } from "@/lib/social-links"
import { cn } from "@/lib/utils"

const fabClass =
  "flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-colors"

type ContactFabProps = {
  telegramLink?: string
  zaloLink?: string | null
}

export function ContactFab({
  telegramLink = TELEGRAM_LINK,
  zaloLink = ZALO_LINK,
}: ContactFabProps) {
  const { t } = useLang()

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {zaloLink ? (
        <a
          href={zaloLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(fabClass, "bg-[#0068FF] hover:bg-[#0058d9]")}
          aria-label={t("contactFab.zalo")}
          title={t("contactFab.zalo")}
        >
          <ZaloIcon className="size-7" />
        </a>
      ) : null}
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
