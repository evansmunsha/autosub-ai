// lib/ffmpeg.ts
// ─────────────────────────────────────────────
// FFmpeg is a powerful free tool that can cut, convert, and
// extract audio from any video format (MP4, MKV, AVI, etc.)
// We use it to pull out just the audio so Whisper can transcribe it.

import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import { promises as fs } from 'fs'

// Tell fluent-ffmpeg where the FFmpeg binary is installed
// Without this line, the code would not know where to find FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath.path)

const MAX_WHISPER_UPLOAD_BYTES = 24 * 1024 * 1024
const TRANSCRIPTION_CHUNK_SECONDS = 90 * 60

export interface AudioChunk {
  path: string
  offsetSeconds: number
}

/**
 * extractAudio
 * Takes a video file and extracts just the audio as an MP3 file.
 * 
 * @param videoPath - full path to the input video file
 * @param outputDir - folder where the audio file will be saved
 * @returns path to the new audio file
 * 
 * Example:
 *   const audioFile = await extractAudio('/tmp/movie.mp4', '/tmp')
 *   // returns: '/tmp/movie_audio.mp3'
 */
export function extractAudio(
  videoPath: string, 
  outputDir: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    
    // Build the output file path
    // e.g. if input is "special26.mp4", output is "special26_audio.mp3"
    const baseName = path.basename(videoPath, path.extname(videoPath))
    const outputPath = path.join(outputDir, `${baseName}_audio.mp3`)
    
    console.log(`🎵 Extracting audio from: ${videoPath}`)
    
    ffmpeg(videoPath)
      .noVideo()                    // ← remove all video tracks
      .audioCodec('libmp3lame')     // ← convert audio to MP3 format
      .audioBitrate('16k')          // ← tuned for long-form speech transcription
      .audioChannels(1)             // ← mono is enough for speech
      .audioFrequency(16000)        // ← 16kHz sample rate (Whisper likes this)
      .on('end', () => {
        console.log(`✅ Audio extracted to: ${outputPath}`)
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message)
        reject(err)
      })
      .save(outputPath)             // ← save to the output path
  })
}

export async function splitAudioForTranscription(
  audioPath: string,
  outputDir: string
): Promise<AudioChunk[]> {
  const stats = await fs.stat(audioPath)

  if (stats.size <= MAX_WHISPER_UPLOAD_BYTES) {
    return [{ path: audioPath, offsetSeconds: 0 }]
  }

  const chunksDir = path.join(outputDir, 'chunks')
  await fs.mkdir(chunksDir, { recursive: true })

  const outputPattern = path.join(chunksDir, 'chunk-%03d.mp3')

  await new Promise<void>((resolve, reject) => {
    ffmpeg(audioPath)
      .audioCodec('libmp3lame')
      .audioBitrate('16k')
      .audioChannels(1)
      .audioFrequency(16000)
      .outputOptions([
        '-f segment',
        `-segment_time ${TRANSCRIPTION_CHUNK_SECONDS}`,
        '-reset_timestamps 1',
      ])
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .save(outputPattern)
  })

  const files = (await fs.readdir(chunksDir))
    .filter((file) => file.endsWith('.mp3'))
    .sort()

  if (files.length === 0) {
    throw new Error('FFmpeg did not produce any transcription chunks.')
  }

  return files.map((file, index) => ({
    path: path.join(chunksDir, file),
    offsetSeconds: index * TRANSCRIPTION_CHUNK_SECONDS,
  }))
}
