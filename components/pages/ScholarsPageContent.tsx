import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SCHOLARS } from '@/data/scholars'

export async function ScholarsPageContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'scholarsPage' })
  const categories = ['saudi', 'international', 'organization'] as const

  return (
    <div className="min-h-screen bg-islamic-cream">
      <section className="bg-hero-gradient py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gold-400/40 bg-white/10 text-gold-300 text-3xl mb-6">
            👳
          </div>
          <h1 className="font-arabic text-white text-4xl sm:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-gold-200 text-lg max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        {categories.map((cat) => {
          const items = SCHOLARS.filter((s) => s.category === cat)
          if (items.length === 0) return null

          return (
            <div key={cat} className="mb-14">
              <h2 className="font-arabic text-2xl md:text-3xl font-bold text-islamic-green mb-6">
                {t(`categories.${cat}`)}
              </h2>
              <div className="grid gap-6 lg:grid-cols-3">
                {items.map((scholar) => {
                  const name = locale === 'ar' ? scholar.nameAr : scholar.nameEn
                  const about = locale === 'ar' ? scholar.aboutAr : scholar.aboutEn
                  return (
                    <article key={scholar.id} className="card-islamic overflow-hidden">
                      <div className="relative h-56 w-full bg-hero-gradient flex items-center justify-center">
                        {scholar.photo ? (
                          <Image
                            src={scholar.photo}
                            alt={t('photoAlt', { name, specialty: scholar.specialty })}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                            style={{ objectPosition: scholar.photoPosition ?? 'center' }}
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-6xl text-gold-300" aria-hidden="true">👳</span>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-arabic text-2xl font-bold text-islamic-green mb-2">{name}</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">{about}</p>
                        <div className="space-y-2 text-sm text-gray-600 mb-5">
                          <p><span className="font-bold text-gold-600">{t('specialtyLabel')}</span> {scholar.specialty}</p>
                          <p><span className="font-bold text-gold-600">{t('countryLabel')}</span> {scholar.country}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {scholar.website && (
                            <Link href={scholar.website} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm px-4 py-2">
                              {t('links.website')}
                            </Link>
                          )}
                          {scholar.youtube && (
                            <Link href={scholar.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm px-4 py-2">
                              {t('links.youtube')}
                            </Link>
                          )}
                          {scholar.fatwaSite && (
                            <Link href={scholar.fatwaSite} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm px-4 py-2">
                              {t('links.fatwa')}
                            </Link>
                          )}
                          {scholar.lecturesSite && (
                            <Link href={scholar.lecturesSite} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm px-4 py-2">
                              {t('links.lectures')}
                            </Link>
                          )}
                          {scholar.x && (
                            <Link href={scholar.x} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm px-4 py-2">
                              {t('links.x')}
                            </Link>
                          )}
                          {scholar.facebook && (
                            <Link href={scholar.facebook} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm px-4 py-2">
                              {t('links.facebook')}
                            </Link>
                          )}
                          {scholar.instagram && (
                            <Link href={scholar.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm px-4 py-2">
                              {t('links.instagram')}
                            </Link>
                          )}
                          {scholar.telegram && (
                            <Link href={scholar.telegram} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm px-4 py-2">
                              {t('links.telegram')}
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
