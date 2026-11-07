import { NextRequest, NextResponse } from 'next/server'
import { PROPHETS } from '@/data/prophets'
import { SEERAH_TIMELINE } from '@/data/seerah'
import { ASMA_ALLAH } from '@/data/asmaAllah'
import { SCHOLARS } from '@/data/scholars'
import { LIVE_CHANNELS } from '@/data/liveChannels'
import { HADITHS } from '@/data/hadiths'
import { ADHKAR_CATEGORIES } from '@/data/adhkar'
import { homeFaq } from '@/data/homeFaq'

// No LLM, no API key, no external inference server: this endpoint answers purely by
// keyword-matching the user's question against the site's own local content and
// returning the best matches verbatim (with citations), formatted with a short
// per-language wrapper sentence. Free and fully self-contained.

const MESSAGES: Record<string, { intro: string; noAnswer: string; badRequest: string }> = {
  ar: {
    intro: 'هذا ما وجدته في محتوى الموقع متعلقاً بسؤالك:',
    noAnswer: 'لم أجد في محتوى الموقع إجابة مباشرة لهذا السؤال. جرّب صياغة مختلفة، أو استشر عالماً موثوقاً، أو راجع مواقع إفتاء معتمدة مثل islamweb.net أو dorar.net.',
    badRequest: 'اكتب سؤالاً أولاً.',
  },
  en: {
    intro: 'Here is what I found on the site related to your question:',
    noAnswer: "I couldn't find a direct answer to this in the site's content. Try rephrasing, or consult a trusted scholar, or check a site like islamweb.net or dorar.net.",
    badRequest: 'Please type a question first.',
  },
  de: {
    intro: 'Das habe ich auf der Website zu deiner Frage gefunden:',
    noAnswer: 'Dazu habe ich im Inhalt der Website keine direkte Antwort gefunden. Versuche es anders zu formulieren, oder frage einen vertrauenswürdigen Gelehrten bzw. eine Seite wie islamweb.net oder dorar.net.',
    badRequest: 'Bitte gib zuerst eine Frage ein.',
  },
  fr: {
    intro: 'Voici ce que j\'ai trouvé sur le site en rapport avec votre question :',
    noAnswer: "Je n'ai pas trouvé de réponse directe à cela dans le contenu du site. Essayez de reformuler, ou consultez un savant de confiance ou un site comme islamweb.net ou dorar.net.",
    badRequest: 'Veuillez d\'abord saisir une question.',
  },
  es: {
    intro: 'Esto es lo que encontré en el sitio relacionado con tu pregunta:',
    noAnswer: 'No encontré una respuesta directa a esto en el contenido del sitio. Intenta reformularla, o consulta a un erudito de confianza o un sitio como islamweb.net o dorar.net.',
    badRequest: 'Escribe una pregunta primero.',
  },
  zh: {
    intro: '这是我在网站内容中找到的与您问题相关的内容：',
    noAnswer: '未能在网站内容中找到直接答案。请尝试换一种表述，或咨询可信的学者，或查阅 islamweb.net、dorar.net 等网站。',
    badRequest: '请先输入问题。',
  },
  tr: {
    intro: 'Sorunuzla ilgili sitede bulduklarım:',
    noAnswer: 'Bunun için site içeriğinde doğrudan bir yanıt bulamadım. Farklı bir şekilde ifade etmeyi deneyin veya güvenilir bir alime ya da islamweb.net, dorar.net gibi bir siteye başvurun.',
    badRequest: 'Lütfen önce bir soru yazın.',
  },
  ur: {
    intro: 'یہ ہے جو مجھے آپ کے سوال سے متعلق سائٹ پر ملا:',
    noAnswer: 'مجھے سائٹ کے مواد میں اس کا براہ راست جواب نہیں ملا۔ مختلف انداز میں پوچھیں، یا کسی معتبر عالم سے رجوع کریں، یا islamweb.net یا dorar.net جیسی سائٹ دیکھیں۔',
    badRequest: 'پہلے ایک سوال لکھیں۔',
  },
  ru: {
    intro: 'Вот что я нашёл на сайте по вашему вопросу:',
    noAnswer: 'Я не нашёл прямого ответа на это в содержимом сайта. Попробуйте переформулировать вопрос, или обратитесь к надёжному учёному, или посетите такие сайты, как islamweb.net или dorar.net.',
    badRequest: 'Сначала введите вопрос.',
  },
  id: {
    intro: 'Inilah yang saya temukan di situs ini terkait pertanyaan Anda:',
    noAnswer: 'Saya tidak menemukan jawaban langsung untuk hal ini dalam konten situs. Coba ubah susunan pertanyaan Anda, atau tanyakan kepada ulama tepercaya, atau lihat situs seperti islamweb.net atau dorar.net.',
    badRequest: 'Silakan tulis pertanyaan terlebih dahulu.',
  },
  fil: {
    intro: 'Narito ang nakita ko sa site kaugnay ng iyong tanong:',
    noAnswer: 'Wala akong nakitang tuwirang sagot dito sa nilalaman ng site. Subukang ibahin ang pagkakatanong, o sumangguni sa mapagkakatiwalaang iskolar, o tingnan ang site gaya ng islamweb.net o dorar.net.',
    badRequest: 'Mangyaring mag-type muna ng tanong.',
  },
  he: {
    intro: 'הנה מה שמצאתי באתר בנוגע לשאלתך:',
    noAnswer: 'לא מצאתי תשובה ישירה לכך בתוכן האתר. נסה לנסח את השאלה אחרת, או פנה למלומד אמין, או עיין באתרים כמו islamweb.net או dorar.net.',
    badRequest: 'אנא כתוב שאלה תחילה.',
  },
  vi: {
    intro: 'Đây là những gì tôi tìm thấy trên trang liên quan đến câu hỏi của bạn:',
    noAnswer: 'Tôi không tìm thấy câu trả lời trực tiếp cho điều này trong nội dung của trang. Hãy thử đặt câu hỏi theo cách khác, hoặc hỏi một học giả đáng tin cậy, hoặc tham khảo các trang như islamweb.net hay dorar.net.',
    badRequest: 'Vui lòng nhập câu hỏi trước.',
  },
  ne: {
    intro: 'तपाईंको प्रश्नसँग सम्बन्धित साइटमा मैले यो भेटेँ:',
    noAnswer: 'साइटको सामग्रीमा मैले यसको सीधा उत्तर भेटिनँ। प्रश्न अर्को तरिकाले सोध्नुहोस्, वा भरपर्दो विद्वानसँग सोध्नुहोस्, वा islamweb.net वा dorar.net जस्ता साइटहरू हेर्नुहोस्।',
    badRequest: 'कृपया पहिले प्रश्न लेख्नुहोस्।',
  },
  it: {
    intro: 'Ecco cosa ho trovato sul sito riguardo alla tua domanda:',
    noAnswer: 'Non ho trovato una risposta diretta nei contenuti del sito. Prova a riformulare la domanda, oppure rivolgiti a un sapiente affidabile, o consulta siti come islamweb.net o dorar.net.',
    badRequest: 'Per favore, scrivi prima una domanda.',
  },
  sv: {
    intro: 'Här är vad jag hittade på webbplatsen om din fråga:',
    noAnswer: 'Jag hittade inget direkt svar på detta i webbplatsens innehåll. Försök formulera frågan på ett annat sätt, vänd dig till en pålitlig lärd, eller besök webbplatser som islamweb.net eller dorar.net.',
    badRequest: 'Skriv en fråga först.',
  },
  fi: {
    intro: 'Tässä on mitä löysin sivustolta kysymykseesi liittyen:',
    noAnswer: 'En löytänyt tähän suoraa vastausta sivuston sisällöstä. Kokeile muotoilla kysymys toisin, käänny luotettavan oppineen puoleen tai katso sivustoja kuten islamweb.net tai dorar.net.',
    badRequest: 'Kirjoita ensin kysymys.',
  },
}

function messagesFor(language: string) {
  return MESSAGES[language] ?? MESSAGES.en
}

// ───────────────────────── Local site-content retrieval ─────────────────────────
// Every helper below searches the same static data that powers the site's own
// pages, so replies are grounded in what the site actually shows.

function norm(s: string): string {
  return s.toLowerCase().trim()
}

// Stripped from the query before scoring so short connector words (which appear in
// almost every piece of content) don't inflate relevance scores. Also includes a
// handful of domain-generic words ("Islam", "religion"...) that show up constantly
// across unrelated categories (an org literally named "IslamQA", FAQ answers, etc.)
// without actually pointing to any one of them — keeping them in would let them
// alone "win" a match against completely unrelated questions.
const AR_STOPWORDS = new Set([
  'من', 'في', 'على', 'عن', 'الى', 'إلى', 'أن', 'إن', 'ما', 'هل', 'و', 'أو', 'او',
  'ال', 'كان', 'كانت', 'مع', 'بين', 'هو', 'هي', 'هذا', 'هذه', 'ذلك', 'كل', 'لكن',
  'لا', 'لم', 'لن', 'قد', 'فى', 'اذا', 'إذا', 'كيف', 'لماذا', 'متى', 'اين', 'أين',
  'اسلام', 'إسلام', 'الاسلام', 'الإسلام', 'اسلامي', 'إسلامي', 'الاسلامي', 'الإسلامي',
  'دين', 'الدين', 'مسلم', 'المسلم', 'مسلمين', 'المسلمين',
])

// Each element is the set of surface variants for ONE word the user actually typed —
// the word itself, plus the same word with a leading "ال" (definite article) stripped,
// so a query like "الغضب" also matches content phrased as "تغضب"/"غضب" without the
// article. Kept as a group (not flattened) so a single query word plus its stripped
// variant only ever counts as ONE match below, not two independent ones.
type TokenGroup = string[]

function tokenize(query: string): TokenGroup[] {
  const raw = norm(query)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !AR_STOPWORDS.has(t))
  return raw.map((t) => {
    const variants = new Set([t])
    if (t.startsWith('ال') && t.length > 4) variants.add(t.slice(2))
    return [...variants]
  })
}

// A field match only "counts" toward relevance if it's specific: a hit on a name/
// title is a strong signal, a hit buried in a long prose field is a weak one. Without
// this weighting, an incidental word shared with a long story/hadith body can outrank
// (or hide) the item whose *name* the user actually asked about.
type WeightedField = { text: string; weight: number }

// ── Corpus-wide word rarity (IDF) ──────────────────────────────────────────────
// Field weighting alone isn't enough: a generic word like "الإسلامية" showing up in
// some organization's *name* would otherwise outscore a rare, specific word like a
// hadith's actual topic. So on top of field weight, each matched token is scaled by
// how rare it is across the whole site (fewer places it appears → more it counts).
// Computed once at module load since all this data is static.
function rawWords(text: string): string[] {
  return norm(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
}

const CORPUS_DOCS: string[] = [
  ...PROPHETS.map((p) => [p.nameAr, p.nameEn, p.summary, p.nation, p.lessons.join(' '), p.story.join(' ')].join(' ')),
  ...SEERAH_TIMELINE.flatMap((era) => era.events.map((e) => [e.title, e.desc].join(' '))),
  ...ASMA_ALLAH.map((n) => [n.nameArabic, n.nameEnglish, n.meaning, n.explanation].join(' ')),
  ...HADITHS.map((h) => [h.text, h.narrator].join(' ')),
  ...ADHKAR_CATEGORIES.flatMap((c) => c.items.map((i) => [c.title, i.text].join(' '))),
  ...SCHOLARS.map((s) => [s.nameAr, s.nameEn, s.country, s.specialty, s.aboutAr].join(' ')),
  ...LIVE_CHANNELS.map((c) => [c.nameAr, c.nameEn, c.descriptionAr, c.category].join(' ')),
  ...homeFaq.map((f) => [f.questionAr, f.answerAr].join(' ')),
]

const DOC_FREQ = new Map<string, number>()
for (const doc of CORPUS_DOCS) {
  for (const t of new Set(rawWords(doc))) DOC_FREQ.set(t, (DOC_FREQ.get(t) ?? 0) + 1)
}
const TOTAL_DOCS = CORPUS_DOCS.length

function idf(token: string): number {
  const df = DOC_FREQ.get(token) ?? 0
  return Math.log((TOTAL_DOCS + 1) / (df + 1)) + 1
}

// A token this rare (appears in only a handful of items site-wide, e.g. a person's
// name) is trustworthy relevance signal on its own. A single match on a token below
// this bar (a generic word like "الإسلام") is NOT enough by itself — see below.
const RARE_TOKEN_IDF = 3.5

// Minimum weighted*rarity score for a category to be considered a real match.
const MIN_SCORE = 12

function scoreItems<T>(items: T[], tokenGroups: TokenGroup[], fields: (item: T) => WeightedField[]): Array<{ item: T; score: number }> {
  return items
    .map((item) => {
      const fieldList = fields(item)
      let score = 0
      let distinctMatches = 0
      let maxIdf = 0
      for (const group of tokenGroups) {
        // A word and its "ال"-stripped variant are the same underlying concept —
        // whichever surface form matches, this counts as ONE match for that word.
        let bestWeight = 0
        let bestRarity = 0
        for (const tok of group) {
          const rarity = idf(tok)
          for (const { text, weight } of fieldList) {
            if (norm(text).includes(tok)) {
              if (weight > bestWeight) bestWeight = weight
              if (rarity > bestRarity) bestRarity = rarity
            }
          }
        }
        if (bestWeight > 0) {
          distinctMatches++
          maxIdf = Math.max(maxIdf, bestRarity)
          score += bestWeight * bestRarity
        }
      }
      return { item, score, distinctMatches, maxIdf }
    })
    // Require either two-or-more independently matching words, or a single match
    // that's specific enough (rare) to trust on its own — blocks a lone generic
    // word shared with an unrelated item from masquerading as a real match.
    .filter((s) => s.distinctMatches >= 2 || (s.distinctMatches === 1 && s.maxIdf >= RARE_TOKEN_IDF))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
}

interface CategoryResult {
  label: string
  score: number
  block: string
}

function searchProphets(tokens: TokenGroup[]): CategoryResult | null {
  const scored = scoreItems(PROPHETS, tokens, (p) => [
    { text: p.nameAr, weight: 10 },
    { text: p.nameEn, weight: 10 },
    { text: p.summary, weight: 4 },
    { text: p.nation, weight: 2 },
    { text: p.lessons.join(' '), weight: 1 },
    { text: p.story.join(' '), weight: 1 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 2)
    .map(({ item: p }) => `${p.nameAr} (${p.nameEn})\nالفترة: ${p.period} | الأمة: ${p.nation}\n${p.summary}\nذُكر في القرآن الكريم ${p.quranMentions} مرة.\n[المصدر: صفحة قصص الأنبياء بالموقع]`)
    .join('\n\n')
  return { label: 'من قصص الأنبياء', score: scored[0].score, block }
}

function searchSeerah(tokens: TokenGroup[]): CategoryResult | null {
  const events = SEERAH_TIMELINE.flatMap((era) => era.events.map((e) => ({ ...e, era: era.era })))
  const scored = scoreItems(events, tokens, (e) => [
    { text: e.title, weight: 6 },
    { text: e.desc, weight: 2 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 3)
    .map(({ item: e }) => `[${e.era} — ${e.year}] ${e.title}\n${e.desc}\n[المصدر: صفحة السيرة النبوية بالموقع]`)
    .join('\n\n')
  return { label: 'من السيرة النبوية', score: scored[0].score, block }
}

function searchAsmaAllah(query: string, tokens: TokenGroup[]): CategoryResult | null {
  // Only take a bare number in the query as "give me name #N" when the question is
  // actually about the Names of Allah — otherwise an unrelated question that happens
  // to contain a number (e.g. "يتكرر 3 مرات") would wrongly short-circuit to a name.
  const mentionsAsmaAllah = tokens.some((group) => group.some((t) => ['اسم', 'اسماء', 'أسماء', 'حسنى'].includes(t)))
  const numMatch = mentionsAsmaAllah ? query.match(/\b([1-9][0-9]?)\b/) : null
  const num = numMatch ? Number(numMatch[1]) : NaN
  if (Number.isInteger(num) && num > 0) {
    const exact = ASMA_ALLAH.find((n) => n.number === num)
    if (exact) {
      return {
        label: 'من أسماء الله الحسنى',
        score: 100,
        block: `${exact.number}. ${exact.nameArabic} (${exact.nameEnglish}) — ${exact.meaning}\n${exact.explanation}\n[المصدر: صفحة أسماء الله الحسنى بالموقع${exact.quranRef ? ` — ${exact.quranRef}` : ''}]`,
      }
    }
  }
  const scored = scoreItems(ASMA_ALLAH, tokens, (n) => [
    // Lower than other categories' name-field weight on purpose: these "names" are
    // themselves common Arabic words (الحكم، العدل، الرحيم...), so a match here is a
    // much weaker signal than a match on an actual proper noun like a person's name.
    { text: n.nameArabic, weight: 5 },
    { text: n.nameEnglish, weight: 8 },
    { text: n.meaning, weight: 4 },
    { text: n.explanation, weight: 2 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 3)
    .map(({ item: n }) => `${n.number}. ${n.nameArabic} (${n.nameEnglish}) — ${n.meaning}\n${n.explanation}\n[المصدر: صفحة أسماء الله الحسنى بالموقع${n.quranRef ? ` — ${n.quranRef}` : ''}]`)
    .join('\n\n')
  return { label: 'من أسماء الله الحسنى', score: scored[0].score, block }
}

function searchHadith(tokens: TokenGroup[]): CategoryResult | null {
  const scored = scoreItems(HADITHS, tokens, (h) => [
    { text: h.text, weight: 6 }, // the hadith text itself IS the content being searched, unlike a "buried in prose" field
    { text: h.narrator, weight: 2 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 3)
    .map(({ item: h }) => `"${h.text}"\n[المصدر: ${h.source}${h.narrator ? ` — الراوي: ${h.narrator}` : ''} — درجته: ${h.grade}]`)
    .join('\n\n')
  return { label: 'من الأحاديث النبوية', score: scored[0].score, block }
}

function searchAdhkar(tokens: TokenGroup[]): CategoryResult | null {
  const flat = ADHKAR_CATEGORIES.flatMap((cat) => cat.items.map((item) => ({ cat: cat.title, item })))
  const scored = scoreItems(flat, tokens, (f) => [
    { text: f.cat, weight: 2 },
    { text: f.item.text, weight: 3 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 4)
    .map(({ item: f }) => `[${f.cat}] ${f.item.text}${f.item.count > 1 ? ` (يُكرر ${f.item.count} مرة)` : ''}\n[المصدر: صفحة الأذكار بالموقع]`)
    .join('\n\n')
  return { label: 'من الأذكار والأدعية', score: scored[0].score, block }
}

function searchScholars(tokens: TokenGroup[]): CategoryResult | null {
  const scored = scoreItems(SCHOLARS, tokens, (s) => [
    { text: s.nameAr, weight: 10 },
    { text: s.nameEn, weight: 10 },
    { text: s.country, weight: 3 },
    { text: s.specialty, weight: 4 },
    { text: s.aboutAr, weight: 1 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 2)
    .map(({ item: s }) => `${s.nameAr} (${s.nameEn}) — ${s.country}\nالتخصص: ${s.specialty}\n${s.aboutAr}\n[المصدر: دليل العلماء والدعاة بالموقع]`)
    .join('\n\n')
  return { label: 'من دليل العلماء والدعاة', score: scored[0].score, block }
}

function searchLiveChannels(tokens: TokenGroup[]): CategoryResult | null {
  const scored = scoreItems(LIVE_CHANNELS, tokens, (c) => [
    { text: c.nameAr, weight: 10 },
    { text: c.nameEn, weight: 10 },
    { text: c.descriptionAr, weight: 2 },
    { text: c.category, weight: 2 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 3)
    .map(({ item: c }) => `${c.nameAr} (${c.nameEn}) — ${c.category === 'tv' ? 'قناة تلفزيونية' : 'إذاعة'}\n${c.descriptionAr}\n[المصدر: صفحة البث المباشر بالموقع]`)
    .join('\n\n')
  return { label: 'من قنوات البث المباشر', score: scored[0].score, block }
}

function searchSiteFaq(tokens: TokenGroup[]): CategoryResult | null {
  const scored = scoreItems(homeFaq, tokens, (f) => [
    { text: f.questionAr, weight: 6 },
    { text: f.answerAr, weight: 2 },
  ])
  if (!scored.length) return null
  const block = scored
    .slice(0, 2)
    .map(({ item: f }) => `س: ${f.questionAr}\nج: ${f.answerAr}\n[المصدر: الأسئلة الشائعة بالصفحة الرئيسية]`)
    .join('\n\n')
  return { label: 'من الأسئلة الشائعة', score: scored[0].score, block }
}

// The site's own Quran pages read Arabic ayah text from this same public API (with a
// small local fallback for outages — see app/[locale]/(main)/quran/[surahId]/page.tsx),
// so it counts as "the site's own content" even though it isn't a local file. This is
// the one network call this endpoint makes; everything else is fully local/offline.
async function searchQuran(query: string): Promise<CategoryResult | null> {
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/quran-uthmani`,
      { next: { revalidate: 3600 } },
    )
    const data = await res.json()
    if (data.code !== 200 || !data.data?.matches?.length) return null
    const found: Array<{ text: string; surah: { name: string; number: number }; numberInSurah: number }> =
      data.data.matches.slice(0, 3)
    const block = found
      .map((m) => `﴿${m.text}﴾\n[المصدر: ${m.surah.name} — الآية ${m.numberInSurah} — رقم السورة ${m.surah.number}]`)
      .join('\n\n')
    return { label: 'من القرآن الكريم', score: 60, block } // literal-text match on the mushaf is a strong signal
  } catch {
    return null
  }
}

async function retrieveTop(query: string, language: string): Promise<string> {
  const tokens = tokenize(query)

  const [quran, ...local] = await Promise.all([
    searchQuran(query),
    Promise.resolve(searchHadith(tokens)),
    Promise.resolve(searchProphets(tokens)),
    Promise.resolve(searchSeerah(tokens)),
    Promise.resolve(searchAsmaAllah(query, tokens)),
    Promise.resolve(searchAdhkar(tokens)),
    Promise.resolve(searchSiteFaq(tokens)),
    Promise.resolve(searchScholars(tokens)),
    Promise.resolve(searchLiveChannels(tokens)),
  ])

  const results = [quran, ...local].filter((r): r is CategoryResult => r !== null).sort((a, b) => b.score - a.score)

  const msgs = messagesFor(language)
  if (!results.length) return msgs.noAnswer

  const top = results.slice(0, 2)
  const body = top.map((r) => `${r.label}:\n${r.block}`).join('\n\n---\n\n')
  return `${msgs.intro}\n\n${body}`
}

// ───────────────────────── Route handler ─────────────────────────

export async function POST(req: NextRequest) {
  let language = 'ar'
  try {
    const body = await req.json()
    const message: string = body.message ?? ''
    language = body.language ?? 'ar'

    if (!message.trim()) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    const reply = await retrieveTop(message, language)
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ reply: messagesFor(language).noAnswer }, { status: 500 })
  }
}
