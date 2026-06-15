import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { BrokersPageContent } from "@/components/marketwall/brokers-page"

export default function PlatformsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full px-3 py-4 lg:px-4">
        <BrokersPageContent />
      </main>

      <Footer />
    </div>
  )
}
