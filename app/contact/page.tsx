import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { ContactPageContent } from "@/components/marketwall/contact-page"
import { contactMetadata } from "@/lib/seo"
import { getSiteSettings } from "@/lib/site-settings"

export const metadata = contactMetadata

export default async function ContactPage() {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full px-4 py-4">
        <ContactPageContent
          email={settings.email}
          telegramLink={settings.telegramLink}
          zaloLink={settings.zaloLink}
        />
      </main>

      <Footer />
    </div>
  )
}
