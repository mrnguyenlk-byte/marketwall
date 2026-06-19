import { ContactFab as ContactFabClient } from "@/components/marketwall/contact-fab"
import { getSiteSettings } from "@/lib/site-settings"

export async function ContactFab() {
  const settings = await getSiteSettings()
  return <ContactFabClient telegramLink={settings.telegramLink} />
}
