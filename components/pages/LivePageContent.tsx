'use client'

import { useLocale, useTranslations } from 'next-intl'
import { LIVE_CHANNELS } from '@/data/liveChannels'

export function LivePageContent() {
  const locale = useLocale()
  const t = useTranslations('livePage')
  const tc = useTranslations('common')
  const th = useTranslations('home')

  const tvChannels = LIVE_CHANNELS.filter((c) => c.category === 'tv')
  const radioChannels = LIVE_CHANNELS.filter((c) => c.category === 'radio')

  return (
    <div className="min-h-screen bg-islamic-cream">
      <section className="bg-hero-gradient py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gold-400/40 bg-white/10 text-gold-300 text-3xl mb-6">
            📡
          </div>
          <h1 className="font-arabic text-white text-4xl sm:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-gold-200 text-lg max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-arabic text-2xl font-bold text-islamic-green mb-6 text-center">{t('tvTitle')}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {tvChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} locale={locale} statusLabel={th('liveMakkah.status')} playLabel={tc('play')} />
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-4 text-center">
        <div className="rounded-2xl bg-islamic-green/5 border border-gold-400/30 px-6 py-8">
          <div className="text-3xl mb-3">🎙️</div>
          <p className="font-arabic text-islamic-green text-lg leading-relaxed">{t('radioPromo')}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-arabic text-2xl font-bold text-islamic-green mb-6 text-center">{t('radioTitle')}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {radioChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} locale={locale} statusLabel={th('liveMakkah.status')} playLabel={tc('play')} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ChannelCard({
  channel,
  locale,
  statusLabel,
  playLabel,
}: {
  channel: (typeof LIVE_CHANNELS)[number]
  locale: string
  statusLabel: string
  playLabel: string
}) {
  return (
    <article className="card-islamic p-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-4xl">{channel.logo}</span>
        <span className="text-xs font-bold rounded-full bg-gold-100 text-gold-700 px-3 py-1">{statusLabel}</span>
      </div>
      <div>
        <h3 className="font-arabic text-2xl font-bold text-islamic-green mb-3">
          {locale === 'ar' ? channel.nameAr : channel.nameEn}
        </h3>
        <p className="text-gray-700 leading-relaxed">
          {locale === 'ar' ? channel.descriptionAr : channel.descriptionEn}
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.open(channel.livePage, '_blank', 'noopener,noreferrer')}
        className="btn-gold inline-flex items-center justify-center"
      >
        {playLabel}
      </button>
    </article>
  )
}
