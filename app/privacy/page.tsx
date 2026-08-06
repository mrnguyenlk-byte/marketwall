import type { Metadata } from "next"
import { Footer } from "@/components/marketwall/footer"
import { Header } from "@/components/marketwall/header"
import { LegalPageContent } from "@/components/marketwall/legal-page"
import { SITE_NAME } from "@/lib/brand"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: `Privacy Policy | ${SITE_NAME}`,
  description: "BTrading Privacy Policy.",
  path: "/privacy",
})

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <main className="w-full px-4 py-6">
        <LegalPageContent slug="privacy" />
      </main>
      <Footer />
    </div>
  )
}
