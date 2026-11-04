import type { Metadata } from 'next'
import { Amiri, Noto_Naskh_Arabic, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AdminShortcut } from '@/components/providers/AdminShortcut'
import { Toaster } from 'sonner'
import { getLocale } from 'next-intl/server'
import { isRTL, type Locale } from '@/i18n/config'
import { SITE_URL } from '@/lib/seo'
import './globals.css'

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
})

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: { google: 'i09wG_Yi1lfk227f_bYjaFyAUZ1Xy815OShsPFbzCGY' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let locale = 'ar'
  let rtl = true
  try {
    locale = await getLocale()
    rtl = isRTL(locale as Locale)
  } catch {}

  return (
    <html
      lang={locale}
      dir={rtl ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={`${amiri.variable} ${notoNaskh.variable} ${inter.variable}`}
    >
      <body className={`${rtl ? 'font-naskh' : 'font-sans'} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster position="top-center" richColors />
          <AdminShortcut />
        </ThemeProvider>
      </body>
    </html>
  )
}
