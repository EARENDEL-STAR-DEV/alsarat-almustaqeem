import { NextRequest, NextResponse } from 'next/server'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

import { ttVoices } from '@/i18n/config'

// Voices callers may explicitly request in place of the per-language default
// (currently just the narrator voices used for the homepage voice intro).
const ALLOWED_VOICE_OVERRIDES = new Set(['en-US-AndrewMultilingualNeural', 'ar-EG-ShakirNeural'])

function getVoice(lang: string, override: string | null): string {
  if (override && ALLOWED_VOICE_OVERRIDES.has(override)) return override
  return ttVoices[lang as keyof typeof ttVoices] ?? ttVoices.ar
}

function truncateAtSentence(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const cut = text.substring(0, maxLen)
  const lastBreak = Math.max(
    cut.lastIndexOf('.\n'),
    cut.lastIndexOf('،'),
    cut.lastIndexOf('.'),
    cut.lastIndexOf('\n'),
  )
  return lastBreak > maxLen * 0.6 ? cut.substring(0, lastBreak + 1) : cut
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  return speak(params.get('text') ?? '', params.get('lang') ?? 'ar', params.get('voice'))
}

// Preferred for long texts: non-Latin scripts (Arabic with diacritics, Hindi, ...)
// percent-encode to 10k+ chars, which hosting proxies reject with 414 URI Too Long.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  return speak(
    typeof body?.text === 'string' ? body.text : '',
    typeof body?.lang === 'string' ? body.lang : 'ar',
    typeof body?.voice === 'string' ? body.voice : null,
  )
}

async function speak(input: string, lang: string, voiceOverride: string | null) {
  const raw = input.trim()
  const VOICE = getVoice(lang, voiceOverride)
  if (!raw) return NextResponse.json({ error: 'text required' }, { status: 400 })

  // Clean markdown symbols and emojis
  const text = truncateAtSentence(
    raw
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
      .replace(/[📖📜📿🕌✨🌟🤲🌙]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#+\s/g, '')
      .replace(/\n+/g, ' ')
      .trim(),
    2000,
  )

  if (!text) return NextResponse.json({ error: 'empty text' }, { status: 400 })

  try {
    const tts = new MsEdgeTTS()
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)

    const chunks: Buffer[] = []
    const { audioStream } = tts.toStream(text)

    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
    }

    const audio = Buffer.concat(chunks)

    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Content-Length': String(audio.length),
      },
    })
  } catch (err) {
    console.error('Edge TTS error:', err)
    return NextResponse.json({ error: 'tts_unavailable' }, { status: 503 })
  }
}
