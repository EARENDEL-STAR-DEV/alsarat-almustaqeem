'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'

function Flag({ locale }: { locale: Locale }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/flags/${localeFlags[locale]}.svg`}
      alt=""
      width={20}
      height={15}
      className="w-5 h-[15px] shrink-0 rounded-[2px] object-cover"
    />
  )
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function switchLocale(next: Locale) {
    setOpen(false)

    // Persist to localStorage
    try { localStorage.setItem('NEXT_LOCALE', next) } catch {}

    // Replace the locale segment in the current path
    // pathname is like /ar/quran → /en/quran
    const segments = pathname.split('/')
    // segments[1] is the current locale
    segments[1] = next
    const newPath = segments.join('/') || `/${next}`

    router.push(newPath)
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-gold-300 hover:bg-white/5 transition-colors text-sm"
        aria-label={t('language')}
      >
        <Flag locale={locale} />
        <span className="hidden sm:block text-xs font-medium whitespace-nowrap">{localeNames[locale]}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 end-0 w-52 max-h-[70vh] overflow-y-auto bg-islamic-navy border border-gold-400/20 rounded-xl shadow-xl shadow-black/40 py-1 z-50">
          {locales.map(l => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                l === locale
                  ? 'bg-gold-400/15 text-gold-300'
                  : 'text-gray-300 hover:bg-white/5 hover:text-gold-300'
              }`}
            >
              <Flag locale={l} />
              <span className="whitespace-nowrap">{localeNames[l]}</span>
              {l === locale && (
                <span className="ms-auto text-gold-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
