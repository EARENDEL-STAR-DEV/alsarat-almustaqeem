import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import SurahViewer from './SurahViewer'
import { fallbackSurahMap } from '../fallback-data'
import { buildAlternates } from '@/lib/seo'

interface Ayah {
  number: number
  numberInSurah: number
  text: string
  juz: number
  page: number
}

interface SurahData {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
  ayahs: Ayah[]
}

async function fetchSurah(id: number): Promise<SurahData | null> {
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`,
      { next: { revalidate: 86400 } },
    )
    const data = await res.json()
    if (data.code === 200) return data.data as SurahData
  } catch {}
  return fallbackSurahMap[id] as SurahData | null
}

// Translations are pre-downloaded locally (see scripts/download-quran-translations.js)
// rather than fetched live, so each static surah page reads only its own small
// per-surah file at build time instead of pulling the whole Quran over the network.
const TRANSLATED_LOCALES = new Set(['en', 'fr', 'de', 'tr', 'ru', 'es', 'zh', 'ur', 'hi', 'id', 'fil', 'he', 'vi', 'ne', 'it', 'sv', 'fi'])

function getTranslation(id: number, lang: string): Record<number, string> {
  if (!TRANSLATED_LOCALES.has(lang)) return {}
  try {
    const filePath = path.join(process.cwd(), 'data', 'quran-translations', lang, `${id}.json`)
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw) as { ayahs: Record<string, string> }
    return parsed.ayahs as Record<number, string>
  } catch {
    return {}
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; surahId: string }>
}): Promise<Metadata> {
  const { locale, surahId } = await params
  const id = parseInt(surahId)
  if (isNaN(id) || id < 1 || id > 114) return {}
  const surah = await fetchSurah(id)
  if (!surah) return {}
  const t = await getTranslations({ locale, namespace: 'quran' })
  return {
    title: `${surah.name} — ${t('title')}`,
    description: `${surah.englishName} — ${surah.numberOfAyahs} ${t('ayahsCount')}`,
    alternates: buildAlternates(locale, `quran/${surahId}`),
  }
}

export async function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ surahId: String(i + 1) }))
}

export default async function SurahPage({
  params,
}: {
  params: Promise<{ locale: string; surahId: string }>
}) {
  const { locale, surahId } = await params
  const id = parseInt(surahId)

  if (isNaN(id) || id < 1 || id > 114) notFound()

  const t = await getTranslations({ locale, namespace: 'quran' })
  const surah = await fetchSurah(id)
  const translation = getTranslation(id, locale)

  if (!surah) notFound()

  const prevId = id > 1 ? id - 1 : null
  const nextId = id < 114 ? id + 1 : null

  return (
    <div className="min-h-screen bg-islamic-cream dark:bg-islamic-navy">
      {/* Header */}
      <div className="bg-hero-gradient py-14 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          {/* Back + nav */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href={`/${locale}/quran`}
              className="flex items-center gap-2 text-gray-300 hover:text-gold-300 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToList')}
            </Link>
            <div className="flex items-center gap-3">
              {prevId && (
                <Link href={`/${locale}/quran/${prevId}`} className="btn-outline-gold text-xs px-3 py-1.5">
                  ← {prevId}
                </Link>
              )}
              {nextId && (
                <Link href={`/${locale}/quran/${nextId}`} className="btn-outline-gold text-xs px-3 py-1.5">
                  {nextId} →
                </Link>
              )}
            </div>
          </div>

          {/* Surah info */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-gold-400/10 border border-gold-400/30 rounded-full px-5 py-1.5 mb-5">
              <span className="text-gold-400 text-sm">{surah.number}</span>
              <span className="w-px h-4 bg-gold-400/40" />
              <span className="text-gold-300 text-sm">
                {surah.revelationType === 'Meccan' ? t('meccan') : t('medinan')}
              </span>
            </div>
            <h1 className="font-arabic text-white text-5xl md:text-6xl font-bold mb-3">
              {surah.name}
            </h1>
            <p className="text-gold-300 text-lg mb-1">{surah.englishName}</p>
            <p className="text-gray-400 text-sm">{surah.englishNameTranslation}</p>
            <div className="mt-4 text-gold-400 text-sm">
              {surah.numberOfAyahs} {t('ayahsCount')}
            </div>
          </div>
        </div>
      </div>

      {/* Bismillah — except Al-Fatiha and At-Tawbah */}
      {id !== 9 && (
        <div className="text-center py-8 bg-islamic-navy-mid border-b border-gold-400/10">
          <p className="font-arabic text-gold-300 text-3xl md:text-4xl">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
        </div>
      )}

      {/* Ayahs */}
      <SurahViewer
        surah={surah}
        translation={translation}
        locale={locale}
        surahId={id}
      />

      {/* Bottom nav */}
      <div className="max-w-3xl mx-auto px-4 py-10 flex justify-between">
        {prevId ? (
          <Link href={`/${locale}/quran/${prevId}`} className="btn-outline-gold text-sm px-5 py-2">
            ← {t('prevSurah')}
          </Link>
        ) : <span />}
        {nextId ? (
          <Link href={`/${locale}/quran/${nextId}`} className="btn-outline-gold text-sm px-5 py-2">
            {t('nextSurah')} →
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
