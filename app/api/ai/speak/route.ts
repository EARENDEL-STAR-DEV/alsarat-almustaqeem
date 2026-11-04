import { NextRequest, NextResponse } from 'next/server'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

import { ttVoices } from '@/i18n/config'

// Synthesizing new text can take 20+ seconds in total, so audio is streamed as it arrives
// and the connection is only dropped if the service stops sending anything for this long.
// The slowest voice (Russian) has been measured at over 11 seconds before its first audio.
const STALL_TIMEOUT_MS = 25000

function getVoice(lang: string): string {
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

// GET so an <audio> element can play the response while it's still streaming.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const raw = (params.get('text') ?? '').trim()
  const voice = getVoice(params.get('lang') ?? 'ar')
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

  const tts = new MsEdgeTTS()
  let stallTimer: ReturnType<typeof setTimeout> | undefined
  const watchForStall = () => {
    clearTimeout(stallTimer)
    stallTimer = setTimeout(() => tts.close(), STALL_TIMEOUT_MS)
  }
  const cleanUp = () => {
    clearTimeout(stallTimer)
    tts.close()
  }

  try {
    watchForStall()
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text)

    // Set when the listener stops playback. Closing the connection then makes the audio
    // stream emit an error, which is expected and must not touch the cancelled controller.
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        audioStream.on('data', (chunk: Buffer) => {
          if (cancelled) return
          watchForStall()
          controller.enqueue(new Uint8Array(chunk))
        })
        audioStream.on('end', () => {
          cleanUp()
          if (!cancelled) controller.close()
        })
        audioStream.on('error', (err: Error) => {
          cleanUp()
          if (cancelled) return
          console.error('Edge TTS error:', err)
          controller.error(err)
        })
      },
      cancel() {
        cancelled = true
        cleanUp()
      },
    })

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error('Edge TTS error:', err)
    cleanUp()
    return NextResponse.json({ error: 'tts_unavailable' }, { status: 503 })
  }
}
