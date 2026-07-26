import "server-only"

import { SITE_EMAIL, TELEGRAM_LINK, ZALO_LINK } from "@/lib/contact"
import { prisma } from "@/lib/prisma"

export type PublicSiteSettings = {
  email: string
  phone: string | null
  telegramLink: string
  facebookLink: string | null
  zaloLink: string | null
  liveUrl: string | null
  liveStreamUrl: string | null
  communityCtaUrl: string
  communityCta: string | null
  footerContent: string | null
}

const DEFAULTS: PublicSiteSettings = {
  email: SITE_EMAIL,
  phone: null,
  telegramLink: TELEGRAM_LINK,
  facebookLink: null,
  zaloLink: ZALO_LINK,
  liveUrl: null,
  liveStreamUrl: null,
  communityCtaUrl: TELEGRAM_LINK,
  communityCta: null,
  footerContent: null,
}

/** Prefer platform live stream URL, then generic live URL. */
export function resolveLiveOverrideUrl(settings: {
  liveUrl?: string | null
  liveStreamUrl?: string | null
}): string | null {
  return settings.liveStreamUrl?.trim() || settings.liveUrl?.trim() || null
}

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "singleton" } })
    if (!row) return DEFAULTS

    return {
      email: row.email?.trim() || DEFAULTS.email,
      phone: row.phone?.trim() || null,
      telegramLink: row.telegramLink?.trim() || DEFAULTS.telegramLink,
      facebookLink: row.facebookLink?.trim() || null,
      zaloLink: row.zaloLink?.trim() || DEFAULTS.zaloLink,
      liveUrl: row.liveUrl?.trim() || null,
      liveStreamUrl: row.liveStreamUrl?.trim() || null,
      communityCtaUrl: row.communityCtaUrl?.trim() || DEFAULTS.communityCtaUrl,
      communityCta: row.communityCta?.trim() || null,
      footerContent: row.footerContent?.trim() || null,
    }
  } catch {
    return DEFAULTS
  }
}

export type SiteSettingsInput = {
  email?: string | null
  phone?: string | null
  telegramLink?: string | null
  facebookLink?: string | null
  zaloLink?: string | null
  liveUrl?: string | null
  liveStreamUrl?: string | null
  communityCtaUrl?: string | null
  communityCta?: string | null
  footerContent?: string | null
}

export async function upsertSiteSettings(input: SiteSettingsInput) {
  return prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...input },
    update: input,
  })
}
