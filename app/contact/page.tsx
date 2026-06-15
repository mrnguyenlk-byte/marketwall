import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { ContactPageContent } from "@/components/marketwall/contact-page"

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Header />

      <main className="w-full px-4 py-4">
        <ContactPageContent />
      </main>

      <Footer />
    </div>
  )
}
