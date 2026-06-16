import dynamic from "next/dynamic"

import { Analytics } from "@vercel/analytics/react"

import type { Metadata, Viewport } from "next"

import { Geist, Geist_Mono } from "next/font/google"

import { LanguageProvider } from "@/lib/i18n"
import { HeatmapDetailProvider } from "@/lib/heatmap-detail-context"
import { SymbolDetailProvider } from "@/lib/symbol-detail-context"
import { RealtimeProvider } from "@/lib/realtime/realtime-context"
import { features } from "@/lib/config/features"

import { ThemeProvider } from "@/lib/theme"

import { SITE_NAME, SITE_LOGO } from "@/lib/brand"
import { SITE_URL } from "@/lib/seo"

import { ContactFab } from "@/components/marketwall/contact-fab"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { StockDetailModal } from "@/components/heatmap/stock-detail-modal-lazy"
import { SymbolDetailModal } from "@/components/marketwall/symbol-detail-modal-lazy"

import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BTrading Market Insights | Global Market Analytics",
    template: "%s | BTrading Market Insights",
  },
  description:
    "Market data, heatmaps, economic calendar, market analytics and platform comparisons in one place.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "BTrading Market Insights | Global Market Analytics",
    description:
      "Market data, heatmaps, economic calendar, market analytics and platform comparisons in one place.",
    siteName: SITE_NAME,
    images: [{ url: SITE_LOGO, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BTrading Market Insights | Global Market Analytics",
    description:
      "Market data, heatmaps, economic calendar, market analytics and platform comparisons in one place.",
    images: [SITE_LOGO],
  },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e11" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-background font-sans antialiased">
        <ThemeProvider>
          <AuthSessionProvider>
            <LanguageProvider>
              <RealtimeProvider>
                <SymbolDetailProvider>
                  <HeatmapDetailProvider>
                    {children}
                    {features.symbolModal && <SymbolDetailModal />}
                    {features.heatmapDetailModal && <StockDetailModal />}
                    <ContactFab />
                  </HeatmapDetailProvider>
                </SymbolDetailProvider>
              </RealtimeProvider>
            </LanguageProvider>
          </AuthSessionProvider>
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  )
}
