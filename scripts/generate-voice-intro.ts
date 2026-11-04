// Generates the homepage voice intro for every locale as a static MP3 under
// public/audio/voice-intro/{locale}.mp3. Synthesizing it live took anywhere from 2 to
// over 75 seconds per request and sometimes failed outright, so it's done once here.
// Re-run this whenever home.voiceIntro.text or a voice in i18n/config.ts changes.
//
// Usage: npm run generate:voice-intro [-- locale ...]
//   With no arguments every locale is generated; otherwise only the ones listed.

import fs from 'fs'
import path from 'path'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { locales, voiceIntroVoices, type Locale } from '../i18n/config'

const OUT_DIR = path.join(process.cwd(), 'public', 'audio', 'voice-intro')
const ATTEMPTS = 3
const ATTEMPT_TIMEOUT_MS = 180_000
const CONCURRENCY = 3

function synthesize(voice: string, text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tts = new MsEdgeTTS()
    const timer = setTimeout(() => {
      tts.close()
      reject(new Error('timed out'))
    }, ATTEMPT_TIMEOUT_MS)
    const fail = (err: Error) => {
      clearTimeout(timer)
      reject(err)
    }

    tts
      .setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
      .then(() => {
        const { audioStream } = tts.toStream(text)
        const chunks: Buffer[] = []
        audioStream.on('data', (chunk: Buffer) => chunks.push(chunk))
        audioStream.on('error', fail)
        audioStream.on('end', () => {
          clearTimeout(timer)
          tts.close()
          const audio = Buffer.concat(chunks)
          if (audio.length === 0) reject(new Error('no audio returned'))
          else resolve(audio)
        })
      })
      .catch(fail)
  })
}

async function generate(locale: Locale): Promise<void> {
  const messages = JSON.parse(fs.readFileSync(path.join('locales', `${locale}.json`), 'utf8'))
  const text = String(messages.home.voiceIntro.text).replace(/\n+/g, ' ').trim()
  const voice = voiceIntroVoices[locale]

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const audio = await synthesize(voice, text)
      fs.writeFileSync(path.join(OUT_DIR, `${locale}.mp3`), audio)
      const seconds = Math.round((audio.length * 8) / 48_000)
      console.log(`${locale.padEnd(4)} ${voice.padEnd(24)} ${Math.round(audio.length / 1024)} KB  ~${seconds}s`)
      return
    } catch (err) {
      console.log(`${locale}: attempt ${attempt} failed: ${(err as Error).message}`)
    }
  }
  throw new Error(`${locale}: failed after ${ATTEMPTS} attempts`)
}

async function main() {
  const requested = process.argv.slice(2)
  const queue = locales.filter(l => requested.length === 0 || requested.includes(l))
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const failures: string[] = []
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let locale = queue.shift(); locale; locale = queue.shift()) {
        await generate(locale).catch((err: Error) => failures.push(err.message))
      }
    }),
  )

  if (failures.length > 0) {
    console.error(failures.join('\n'))
    process.exit(1)
  }
  process.exit(0)
}

main()
