'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIPage() {
  const t = useTranslations('ai')
  const locale = useLocale()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [ttsMode, setTtsMode] = useState<'server' | 'browser'>('server')
  const messagesRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Init greeting
  useEffect(() => {
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: t('greeting'),
      timestamp: new Date(),
    }])
  }, [locale]) // re-run on locale change

  // Scroll the messages pane itself directly (rather than scrollIntoView on a sentinel
  // element) so this doesn't depend on smooth-scroll animation timing/support — it's
  // instant and immune to layout races with the just-rendered message bubble.
  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const quickQuestions = [
    t('quickQuestions.0'),
    t('quickQuestions.1'),
    t('quickQuestions.2'),
    t('quickQuestions.3'),
    t('quickQuestions.4'),
    t('quickQuestions.5'),
  ]

  async function send(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language: locale }),
      })
      const data = await res.json()
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || t('errorGeneral'),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
      if (soundEnabled) speakText(aiMsg.id, aiMsg.content)
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('errorConnection'),
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  async function speakText(msgId: string, text: string) {
    setSpeaking(msgId)
    if (ttsMode === 'server') {
      try {
        const res = await fetch('/api/ai/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.slice(0, 500), lang: locale }),
        })
        if (!res.ok) throw new Error()
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        if (audioRef.current) {
          audioRef.current.src = url
          audioRef.current.onended = () => { setSpeaking(null); URL.revokeObjectURL(url) }
          await audioRef.current.play()
        }
        return
      } catch {
        setTtsMode('browser')
      }
    }
    // Browser fallback
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = locale === 'ar' ? 'ar-SA' : locale === 'ur' ? 'ur-PK' : locale === 'zh' ? 'zh-CN' : locale
    utter.onend = () => setSpeaking(null)
    speechSynthesis.speak(utter)
  }

  function stopSpeaking() {
    audioRef.current?.pause()
    speechSynthesis.cancel()
    setSpeaking(null)
  }

  return (
    <div className="h-[calc(100vh-5rem)] bg-islamic-cream dark:bg-islamic-navy flex flex-col">
      <audio ref={audioRef} hidden />

      {/* Header */}
      <div className="bg-hero-gradient py-10 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* SVG Avatar */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold-400/50 shadow-xl flex-shrink-0">
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1a3a2a"/>
                    <stop offset="100%" stopColor="#0d1f17"/>
                  </linearGradient>
                </defs>
                <rect width="120" height="120" fill="url(#bg)"/>
                <circle cx="60" cy="48" r="22" fill="none" stroke="#C9A227" strokeWidth="1.5"/>
                <circle cx="60" cy="48" r="16" fill="#C9A227" opacity="0.15"/>
                <text x="60" y="54" textAnchor="middle" fontSize="20" fill="#C9A227">ر</text>
                <path d="M20 85 Q60 65 100 85" fill="none" stroke="#C9A227" strokeWidth="1.5"/>
                <text x="60" y="108" textAnchor="middle" fontSize="10" fill="#C9A227" opacity="0.7">الراشد</text>
              </svg>
            </div>
            <div>
              <h1 className="font-arabic text-white text-3xl font-bold">{t('title')}</h1>
              <p className="text-gold-300 text-sm">{t('subtitle')}</p>
              <span className="inline-flex items-center gap-1 text-green-400 text-xs mt-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {t('online')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSoundEnabled(v => !v); if (speaking) stopSpeaking() }}
              className="p-2 text-gray-300 hover:text-gold-300 hover:bg-white/10 rounded-lg transition-colors"
              title={soundEnabled ? t('soundOff') : t('soundOn')}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            {speaking && (
              <button onClick={stopSpeaking} className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors">
                ⏹ {t('stop')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div ref={messagesRef} className="flex-1 min-h-0 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-4 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
              msg.role === 'user' ? 'bg-gold-400 text-islamic-navy' : 'bg-islamic-green text-gold-300'
            }`}>
              {msg.role === 'user' ? t('userAvatar') : 'ر'}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'user'
                ? 'bg-gold-400/15 border border-gold-400/30 text-gray-100 rounded-tr-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              {msg.role === 'assistant' && soundEnabled && msg.id !== 'greeting' && (
                <button
                  onClick={() => speaking === msg.id ? stopSpeaking() : speakText(msg.id, msg.content)}
                  className="mt-2 text-xs text-gold-400 hover:text-gold-300 transition-colors"
                >
                  {speaking === msg.id ? `⏹ ${t('stop')}` : t('listen')}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-islamic-green text-gold-300 flex items-center justify-center text-sm font-bold">ر</div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick questions */}
      <div className="max-w-4xl w-full mx-auto px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-white dark:bg-gray-900 border border-gold-200 dark:border-gold-800/50 text-gray-600 dark:text-gray-300 rounded-full hover:border-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="max-w-4xl w-full mx-auto px-4 pb-6 flex-shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-lg"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('placeholder')}
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-gold px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </form>
        <p className="text-center text-gray-400 text-xs mt-2">{t('disclaimer')}</p>
      </div>
    </div>
  )
}
