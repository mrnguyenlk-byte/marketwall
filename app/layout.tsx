import { Analytics } from '@vercel/analytics/next'

import type { Metadata, Viewport } from 'next'

import { Geist, Geist_Mono } from 'next/font/google'

import { LanguageProvider } from '@/lib/i18n'

import { ThemeProvider } from '@/lib/theme'

import { SITE_NAME } from '@/lib/brand'

import { ContactFab } from '@/components/marketwall/contact-fab'

import './globals.css'



const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

const geistMono = Geist_Mono({

  variable: '--font-geist-mono',

  subsets: ['latin'],

})



const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`



export const metadata: Metadata = {

  title: `${SITE_NAME} — Financial Market Information Platform`,

  description:

    'BTrading Market Insights is an independent financial information platform providing market information, market analytics, platform comparisons and educational content. Informational use only — not investment advice.',

  generator: 'v0.app',

  icons: {

    icon: '/brand/logo.png',

    apple: '/brand/logo.png',

  },

}



export const viewport: Viewport = {

  colorScheme: 'light dark',

  themeColor: [

    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },

    { media: '(prefers-color-scheme: dark)', color: '#0b0e11' },

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

          <LanguageProvider>
            {children}
            <ContactFab />
          </LanguageProvider>

        </ThemeProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}

      </body>

    </html>

  )

}

