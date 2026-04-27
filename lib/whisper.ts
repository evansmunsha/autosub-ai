// lib/whisper.ts
// ─────────────────────────────────────────────
// OpenAI Whisper is one of the best speech-to-text AIs available.
// It supports 99+ languages and gives us timestamps for each segment.
// We need those timestamps to sync subtitles with the video.

import fs from 'fs'
import type { AudioChunk } from './ffmpeg.ts'
import { getOpenAIClient } from './openai.ts'

// This is the shape of each subtitle segment Whisper returns
export interface TranscriptSegment {
  id: number
  start: number    // start time in seconds, e.g. 5.2
  end: number      // end time in seconds, e.g. 8.9
  text: string     // the spoken words in the original language
}

/**
 * transcribeAudio
 * Sends an audio file to Whisper and gets back a list of
 * time-stamped speech segments.
 * 
 * @param audioPath - path to the MP3/WAV/M4A audio file
 * @param sourceLang - language code e.g. "hi" (Hindi), "ar" (Arabic)
 * @returns array of TranscriptSegment with start/end times + text
 */
async function transcribeChunk(
  chunk: AudioChunk,
  sourceLang: string
): Promise<Omit<TranscriptSegment, 'id'>[]> {
  console.log(`Transcribing chunk at ${chunk.offsetSeconds}s in ${sourceLang}`)

  const response = await getOpenAIClient().audio.transcriptions.create({
    file: fs.createReadStream(chunk.path),
    model: 'whisper-1',
    language: sourceLang,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })

  return (response.segments ?? []).map((segment) => ({
    start: segment.start + chunk.offsetSeconds,
    end: segment.end + chunk.offsetSeconds,
    text: segment.text.trim(),
  }))
}

export async function transcribeAudio(
  chunks: AudioChunk[],
  sourceLang: string
): Promise<TranscriptSegment[]> {
  const allSegments: TranscriptSegment[] = []

  for (const chunk of chunks) {
    const chunkSegments = await transcribeChunk(chunk, sourceLang)

    for (const segment of chunkSegments) {
      allSegments.push({
        id: allSegments.length + 1,
        ...segment,
      })
    }
  }

  console.log(`Transcription done. Got ${allSegments.length} segments`)

  return allSegments
}
