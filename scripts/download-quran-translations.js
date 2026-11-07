// Downloads full-Quran translations from api.alquran.cloud (one request per edition)
// and splits each into per-surah JSON files under data/quran-translations/{lang}/{surahId}.json
// for lazy per-surah loading on the site. Re-run this if a translation edition changes
// or a new language is added to i18n/config.ts.
//
// Filipino and Vietnamese aren't on api.alquran.cloud, so they come from quranenc.com
// (one request per surah); Hebrew, Nepali and Finnish come from fawazahmed0/quran-api.
//
// Usage: node scripts/download-quran-translations.js [lang ...]
//   With no arguments every language is downloaded; otherwise only the ones listed.

const fs = require('fs')
const path = require('path')

const EDITIONS = {
  en: 'en.sahih',
  fr: 'fr.hamidullah',
  de: 'de.bubenheim',
  tr: 'tr.bulac',
  ru: 'ru.kuliev',
  es: 'es.bornez',
  zh: 'zh.jian',
  ur: 'ur.maududi',
  hi: 'hi.hindi',
  id: 'id.indonesian',
  it: 'it.piccardo',
  sv: 'sv.bernstrom',
}

const QURANENC_EDITIONS = {
  fil: 'tagalog_rwwad',
  vi: 'vietnamese_rwwad',
}

// Languages that neither API above carries, from github.com/fawazahmed0/quran-api.
const FAWAZ_EDITIONS = {
  he: 'heb-darusalamhousei',
  ne: 'nep-ahlalhadithcent',
  fi: 'fin-unknown',
}

const OUT_DIR = path.join(__dirname, '..', 'data', 'quran-translations')

function writeSurahs(lang, edition, surahs) {
  const langDir = path.join(OUT_DIR, lang)
  fs.mkdirSync(langDir, { recursive: true })

  let totalBytes = 0
  for (const surah of surahs) {
    const ayahs = {}
    for (const a of surah.ayahs) {
      ayahs[a.numberInSurah] = a.text
    }
    const payload = { edition, surah: surah.number, ayahCount: surah.ayahs.length, ayahs }
    const filePath = path.join(langDir, `${surah.number}.json`)
    const content = JSON.stringify(payload)
    fs.writeFileSync(filePath, content, 'utf8')
    totalBytes += Buffer.byteLength(content, 'utf8')
  }

  console.log(`  saved 114 files, ~${Math.round(totalBytes / 1024)} KB`)
  return { lang, edition, files: surahs.length, totalKB: Math.round(totalBytes / 1024) }
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (i === retries - 1) throw err
      console.log(`  retry ${i + 1} for ${url}: ${err.message}`)
      await new Promise(r => setTimeout(r, 1500))
    }
  }
}

// Returns the same shape as api.alquran.cloud's data.surahs. QuranEnc has no whole-Quran
// endpoint, and its verse text carries "[n]" footnote markers that are stripped here
// because the footnotes themselves aren't shown on the site.
async function fetchQuranEncSurahs(edition) {
  const surahs = []
  for (let number = 1; number <= 114; number++) {
    const json = await fetchWithRetry(`https://quranenc.com/api/v1/translation/sura/${edition}/${number}`)
    surahs.push({
      number,
      ayahs: json.result.map(a => ({
        numberInSurah: Number(a.aya),
        text: a.translation.replace(/\s*\[\d+\]/g, '').trim(),
      })),
    })
  }
  return surahs
}

// The whole Quran in one file as a flat [{ chapter, verse, text }] list.
async function fetchFawazSurahs(edition) {
  const json = await fetchWithRetry(`https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${edition}.min.json`)
  const surahs = Array.from({ length: 114 }, (_, i) => ({ number: i + 1, ayahs: [] }))
  for (const v of json.quran) {
    surahs[v.chapter - 1].ayahs.push({ numberInSurah: v.verse, text: v.text.replace(/\s*\[\d+\]/g, '').trim() })
  }
  const total = surahs.reduce((n, s) => n + s.ayahs.length, 0)
  if (total !== 6236) throw new Error(`${edition}: expected 6236 ayahs, got ${total}`)
  return surahs
}

async function main() {
  const summary = []
  const requested = process.argv.slice(2)
  const selected = lang => requested.length === 0 || requested.includes(lang)

  for (const [lang, edition] of Object.entries(QURANENC_EDITIONS)) {
    if (!selected(lang)) continue
    console.log(`Fetching ${lang} (${edition})...`)
    const surahs = await fetchQuranEncSurahs(edition)
    summary.push(writeSurahs(lang, edition, surahs))
  }

  for (const [lang, edition] of Object.entries(FAWAZ_EDITIONS)) {
    if (!selected(lang)) continue
    console.log(`Fetching ${lang} (${edition})...`)
    const surahs = await fetchFawazSurahs(edition)
    summary.push(writeSurahs(lang, edition, surahs))
  }

  for (const [lang, edition] of Object.entries(EDITIONS)) {
    if (!selected(lang)) continue
    console.log(`Fetching ${lang} (${edition})...`)
    const json = await fetchWithRetry(`https://api.alquran.cloud/v1/quran/${edition}`)
    if (json.code !== 200) {
      throw new Error(`${lang}: API returned code ${json.code}`)
    }
    const surahs = json.data.surahs
    if (surahs.length !== 114) {
      throw new Error(`${lang}: expected 114 surahs, got ${surahs.length}`)
    }
    summary.push(writeSurahs(lang, edition, surahs))
  }

  console.log('\n=== SUMMARY ===')
  for (const s of summary) {
    console.log(`${s.lang.padEnd(4)} ${s.edition.padEnd(16)} ${s.files} files  ~${s.totalKB} KB`)
  }
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
