import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { BrokersPageContent } from "@/components/marketwall/brokers-page"
import { platformsMetadata } from "@/lib/seo"

export const metadata = platformsMetadata

export default function BrokersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full px-3 py-5 sm:px-4 lg:px-6 xl:px-8">
        <BrokersPageContent />
      </main>

      <Footer />
    </div>
  )
}
