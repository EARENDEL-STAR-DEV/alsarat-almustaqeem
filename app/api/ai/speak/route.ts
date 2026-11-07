import { NextRequest, NextResponse } from 'next/server'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

import { ttVoices, ttsBackupVoices, type Locale } from '@/i18n/config'

// Synthesizing new text can take 20+ seconds in total, so audio is streamed as it arrives
// and the connection is only dropped if the service stops sending anything for this long.
const STALL_TIMEOUT_MS = 25000
// Before any audio has arrived a hung attempt is abandoned sooner, so a retry still fits
// within the 25 seconds the assistant page waits for playback to start.
const FIRST_AUDIO_TIMEOUT_MS = 10000
const MAX_ATTEMPTS = 4

// Attempts alternate between the language's main voice and its backup voice.
function getVoices(lang: string): [string, string] {
  const locale = (lang in ttVoices ? lang : 'ar') as Locale
  return [ttVoices[locale], ttsBackupVoices[locale]]
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
  const voices = getVoices(params.get('lang') ?? 'ar')
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

  let tts: MsEdgeTTS | undefined
  let sentAudio = false
  let stallTimer: ReturnType<typeof setTimeout> | undefined
  // Ends the current attempt as failed. Closing the connection alone doesn't always make
  // the audio stream emit an error, so a hung attempt is failed explicitly.
  let abortAttempt: (() => void) | undefined
  const watchForStall = () => {
    clearTimeout(stallTimer)
    const abort = abortAttempt
    stallTimer = setTimeout(() => abort?.(), sentAudio ? STALL_TIMEOUT_MS : FIRST_AUDIO_TIMEOUT_MS)
  }
  const cleanUp = () => {
    clearTimeout(stallTimer)
    tts?.close()
  }

  // Set when the listener stops playback. Closing the connection then makes the audio
  // stream emit an error, which is expected and must not touch the cancelled controller.
  let cancelled = false
  let attempt = 0

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      // The service sometimes drops the connection before sending any audio. Nothing has
      // reached the listener yet at that point, so the synthesis is simply started again.
      const fail = (err: unknown) => {
        cleanUp()
        if (cancelled) return
        if (!sentAudio && attempt < MAX_ATTEMPTS) {
          console.warn(`Edge TTS attempt ${attempt} failed, retrying:`, (err as Error)?.message)
          void synthesize()
          return
        }
        console.error('Edge TTS error:', err)
        controller.error(err)
      }

      const synthesize = async () => {
        const voice = voices[attempt % voices.length]
        attempt += 1
        let finished = false
        tts = new MsEdgeTTS()
        abortAttempt = () => {
          if (finished) return
          finished = true
          fail(new Error(`no audio for ${sentAudio ? STALL_TIMEOUT_MS : FIRST_AUDIO_TIMEOUT_MS}ms`))
        }
        watchForStall()
        try {
          await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
          const { audioStream } = tts.toStream(text)
          audioStream.on('data', (chunk: Buffer) => {
            if (cancelled || finished) return
            sentAudio = true
            watchForStall()
            controller.enqueue(new Uint8Array(chunk))
          })
          audioStream.on('end', () => {
            if (finished) return
            finished = true
            if (!sentAudio) return fail(new Error('stream ended without audio'))
            cleanUp()
            if (!cancelled) controller.close()
          })
          audioStream.on('error', (err: Error) => {
            if (finished) return
            finished = true
            fail(err)
          })
        } catch (err) {
          if (finished) return
          finished = true
          fail(err)
        }
      }

      void synthesize()
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
}
