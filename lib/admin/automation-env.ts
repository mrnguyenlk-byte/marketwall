import "server-only"

import { isR2Configured } from "@/lib/r2"

export type AutomationEnvFlags = {
  /** Remote object storage configured (Cloudflare R2). */
  blobStorage: boolean
  openAi: boolean
  telegram: boolean
  facebook: boolean
  dailyAutomationSecret: boolean
}

export function getAutomationEnvFlags(): AutomationEnvFlags {
  return {
    // Keep key name for admin UI compatibility; value reflects R2 readiness.
    blobStorage: isR2Configured(),
    openAi: Boolean(process.env.OPENAI_API_KEY?.trim()),
    telegram: Boolean(
      process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHANNEL_ID?.trim(),
    ),
    facebook: Boolean(
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() &&
        process.env.FACEBOOK_PAGE_ID?.trim(),
    ),
    dailyAutomationSecret: Boolean(process.env.DAILY_AUTOMATION_SECRET?.trim()),
  }
}
