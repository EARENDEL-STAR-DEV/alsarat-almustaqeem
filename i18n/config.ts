export const locales = ['ar', 'en', 'zh', 'es', 'fr', 'de', 'tr', 'ur', 'ru', 'hi', 'id', 'fil'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ar'

export const rtlLocales: readonly Locale[] = ['ar', 'ur'] as const

export function isRTL(locale: Locale): boolean {
  return (rtlLocales as readonly string[]).includes(locale)
}

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  tr: 'Türkçe',
  ur: 'اردو',
  ru: 'Русский',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  fil: 'Filipino',
}

// ISO country code of each locale's flag, served as an SVG from public/images/flags/.
// SVGs rather than flag emoji because Windows has no flag emoji glyphs: browsers there
// show the bare letters ("SA", "PH") instead of a flag.
export const localeFlags: Record<Locale, string> = {
  ar: 'sa',
  en: 'gb',
  zh: 'cn',
  es: 'es',
  fr: 'fr',
  de: 'de',
  tr: 'tr',
  ur: 'pk',
  ru: 'ru',
  hi: 'in',
  id: 'id',
  fil: 'ph',
}

// Microsoft Edge Neural TTS voices per locale (male voices)
export const ttVoices: Record<Locale, string> = {
  ar: 'ar-SA-HamedNeural',
  en: 'en-US-GuyNeural',
  zh: 'zh-CN-YunxiNeural',
  es: 'es-ES-AlvaroNeural',
  fr: 'fr-FR-HenriNeural',
  de: 'de-DE-ConradNeural',
  tr: 'tr-TR-AhmetNeural',
  ur: 'ur-PK-AsadNeural',
  ru: 'ru-RU-DmitryNeural',
  hi: 'hi-IN-MadhurNeural',
  id: 'id-ID-ArdiNeural',
  fil: 'fil-PH-AngeloNeural',
}

// BCP-47 tags for the browser's built-in Web Speech API (SpeechSynthesisUtterance.lang).
// Used only as a last-resort fallback if the server-side narrator voice below is unreachable.
export const webSpeechLang: Record<Locale, string> = {
  ar: 'ar-SA',
  en: 'en-US',
  zh: 'zh-CN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  tr: 'tr-TR',
  ur: 'ur-PK',
  ru: 'ru-RU',
  hi: 'hi-IN',
  id: 'id-ID',
  fil: 'fil-PH',
}

// Single multilingual Edge Neural voice used for the homepage voice intro, so every
// locale is narrated by the same voice identity instead of a different one per language.
// Exception: the Arabic locale uses arabicVoiceIntroVoice below instead, since this
// voice reads Arabic with a foreign accent.
export const voiceIntroVoice = 'en-US-AndrewMultilingualNeural'

// Egyptian Arabic narrator used only for the homepage voice intro when locale === 'ar',
// chosen over ttVoices.ar (Saudi) because it reads as a natural, non-foreign Arabic voice.
export const arabicVoiceIntroVoice = 'ar-EG-ShakirNeural'
