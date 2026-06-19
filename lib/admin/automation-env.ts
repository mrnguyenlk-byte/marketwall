import "server-only"

export type AutomationEnvFlags = {
  blobStorage: boolean
  openAi: boolean
  telegram: boolean
  facebook: boolean
  dailyAutomationSecret: boolean
}

export function getAutomationEnvFlags(): AutomationEnvFlags {
  return {
    blobStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
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
