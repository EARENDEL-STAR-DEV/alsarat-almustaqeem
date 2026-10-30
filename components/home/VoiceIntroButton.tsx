'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Mic, Square, Loader2 } from 'lucide-react'
import { webSpeechLang, voiceIntroVoice, arabicVoiceIntroVoice, isRTL, type Locale } from '@/i18n/config'

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace('_', '-')
}

// Browser-voice fallback only (used if the server narrator is unreachable): try an
// exact locale match first (e.g. tr-TR), then any voice sharing the base language.
function findVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const target = normalizeLang(lang)
  const base = target.split('-')[0]
  return (
    voices.find(v => normalizeLang(v.lang) === target) ??
    voices.find(v => normalizeLang(v.lang).startsWith(`${base}-`)) ??
    voices.find(v => normalizeLang(v.lang) === base)
  )
}

type Status = 'idle' | 'loading' | 'speaking' | 'unavailable'

export function VoiceIntroButton() {
  const t = useTranslations('home')
  const locale = useLocale() as Locale
  const rtl = isRTL(locale)
  const [status, setStatus] = useState<Status>('idle')
  const [showTooltip, setShowTooltip] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const autoplayTriedRef = useRef(false)
  // Guards against the mount-time attempt and the first-real-interaction attempt
  // (below) both firing — whichever runs first "claims" playback.
  const playStartedRef = useRef(false)

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  // Stop any speech in progress when navigating away.
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      releaseObjectUrl()
    }
  }, [releaseObjectUrl])

  const stop = useCallback(() => {
    requestIdRef.current += 1 // invalidate any in-flight request's callbacks
    abortRef.current?.abort()
    audioRef.current?.pause()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setStatus('idle')
  }, [])

  // Last-resort fallback: the visitor's own browser voice for their language
  // (won't match the narrator's voice, but keeps the feature working offline
  // or if the Edge TTS service is unreachable).
  function speakWithBrowserVoice(text: string): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
    const lang = webSpeechLang[locale]
    const voice = findVoice(window.speechSynthesis.getVoices(), lang)
    if (!voice) return false

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.voice = voice
    utterance.onend = () => setStatus('idle')
    utterance.onerror = () => setStatus('idle')
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    return true
  }

  async function play(auto = false) {
    playStartedRef.current = true
    const requestId = ++requestIdRef.current
    setStatus('loading')
    const text = t('voiceIntro.text')
    const isStale = () => requestId !== requestIdRef.current

    const controller = new AbortController()
    abortRef.current = controller
    // Don't let a stalled request (slow network, unresponsive TTS service) leave
    // the button stuck on its loading spinner forever.
    const watchdog = setTimeout(() => controller.abort(), 15000)

    try {
      // Arabic listeners get a dedicated Egyptian Arabic narrator instead of the
      // English multilingual voice, so it sounds like a natural Arabic speaker
      // rather than a foreign accent reading Arabic text.
      // POST, not GET: the encoded intro text is too long for a URL on the host.
      const res = await fetch('/api/ai/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          lang: locale,
          voice: locale === 'ar' ? arabicVoiceIntroVoice : voiceIntroVoice,
        }),
        signal: controller.signal,
      })
      if (isStale()) return
      if (!res.ok) throw new Error('tts_unavailable')

      const blob = await res.blob()
      if (isStale()) return
      releaseObjectUrl()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url

      const audio = audioRef.current
      if (!audio) throw new Error('no_audio_element')

      audio.src = url
      audio.onended = () => {
        if (isStale()) return
        setStatus('idle')
        releaseObjectUrl()
      }
      audio.onerror = () => {
        if (isStale()) return
        releaseObjectUrl()
        if (!speakWithBrowserVoice(text)) setStatus('unavailable')
      }
      await audio.play()
      if (isStale()) return
      clearTimeout(watchdog)
      setStatus('speaking')
      if (typeof window !== 'undefined') window.sessionStorage.setItem('voiceIntroAutoplayed', '1')
    } catch {
      if (isStale()) return
      // Browsers routinely block autoplay of sound without a user gesture. That's
      // expected, not a real failure, so just reset quietly instead of showing
      // the "unavailable" state or falling back to the browser voice — and allow a
      // later real interaction to retry (see the first-interaction effect below).
      if (auto) {
        setStatus('idle')
        playStartedRef.current = false
        return
      }
      if (speakWithBrowserVoice(text)) {
        setStatus('speaking')
      } else {
        setStatus('unavailable')
      }
    } finally {
      clearTimeout(watchdog)
    }
  }

  // Try to narrate automatically once per browser session as soon as the homepage
  // loads. Browsers routinely block audio-with-sound autoplay with zero interaction,
  // in which case this fails silently — see the effect below for the fallback.
  useEffect(() => {
    if (autoplayTriedRef.current) return
    autoplayTriedRef.current = true
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem('voiceIntroAutoplayed')) return
    play(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fallback for when the above gets blocked (the common case): every browser
  // grants audio-with-sound playback once the visitor has interacted with the page
  // at all, so start narrating on the very first click/tap/keypress/scroll instead —
  // in practice this plays within a second or two of a real visit either way.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem('voiceIntroAutoplayed')) return

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'wheel']

    function onFirstInteraction() {
      events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction))
      if (playStartedRef.current) return
      if (window.sessionStorage.getItem('voiceIntroAutoplayed')) return
      play(true)
    }

    events.forEach((ev) => window.addEventListener(ev, onFirstInteraction, { once: true, passive: true }))
    return () => events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle() {
    if (status === 'loading' || status === 'speaking') {
      stop()
      return
    }
    if (status === 'unavailable') {
      setShowTooltip(v => !v)
      return
    }
    play()
  }

  const unavailable = status === 'unavailable'
  const loading = status === 'loading'
  const speaking = status === 'speaking'

  const label = unavailable
    ? t('voiceIntro.unavailable')
    : speaking
      ? t('voiceIntro.stop')
      : t('voiceIntro.listen')

  return (
    <div
      className={`fixed bottom-6 ${locale === 'ar' ? 'right-6' : 'left-6'} z-40 flex flex-col items-center gap-2`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <audio ref={audioRef} hidden />

      {showTooltip && (
        <div
          role="tooltip"
          className={`max-w-[220px] rounded-lg bg-islamic-navy border border-gold-400/30 px-3 py-2 text-xs text-gray-200 shadow-xl shadow-black/40 text-center ${rtl ? 'font-arabic' : ''}`}
        >
          {label}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-pressed={speaking}
        aria-busy={loading}
        aria-label={label}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full border-2 shadow-lg shadow-black/30 transition-colors duration-300 ${
          unavailable
            ? 'bg-islamic-navy/80 border-gray-500/40 text-gray-400 cursor-help'
            : speaking
              ? 'bg-gold-400 border-gold-400 text-islamic-navy'
              : 'bg-islamic-green border-gold-400 text-gold-200 hover:bg-islamic-green/90'
        }`}
      >
        {speaking && (
          <span className="absolute inset-0 rounded-full bg-gold-400/60 animate-ping" />
        )}
        <span className="relative">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : speaking ? (
            <Square className="w-5 h-5" fill="currentColor" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </span>
      </button>
    </div>
  )
}
