import { notFound } from "next/navigation"
import { Header } from "@/components/marketwall/header"
import { Footer } from "@/components/marketwall/footer"
import { LegalPageContent } from "@/components/marketwall/legal-page"
import { legalPages, type LegalSlug } from "@/lib/legal-content"

const SLUGS = Object.keys(legalPages) as LegalSlug[]

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!SLUGS.includes(slug as LegalSlug)) notFound()

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <main className="w-full px-4 py-6">
        <LegalPageContent slug={slug as LegalSlug} />
      </main>
      <Footer />
    </div>
  )
}
