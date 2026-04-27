// lib/srt.ts
// ─────────────────────────────────────────────
// SRT is the most universal subtitle format.
// It looks like this:
//
//   1
//   00:00:05,000 --> 00:00:08,500
//   This is an official raid.
//
//   2
//   00:00:09,000 --> 00:00:13,000
//   Nobody moves until we say so.
//
// This file has functions to build and parse that format.

import { TranslatedSegment } from './translate.ts'

/**
 * secondsToSrtTime
 * Converts a number of seconds into the SRT timestamp format.
 * 
 * Example: 65.5 → "00:01:05,500"
 *           ^hours ^min ^sec ^milliseconds
 */
function secondsToSrtTime(seconds: number): string {
  const hours   = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs    = Math.floor(seconds % 60)
  const ms      = Math.round((seconds % 1) * 1000)
  
  // Pad each part with zeros so it's always 2 or 3 digits
  const hh  = String(hours).padStart(2, '0')    // "01"
  const mm  = String(minutes).padStart(2, '0')  // "05"
  const ss  = String(secs).padStart(2, '0')     // "08"
  const mss = String(ms).padStart(3, '0')       // "500"
  
  return `${hh}:${mm}:${ss},${mss}`  // "00:01:05,500"
}

/**
 * buildSrtContent
 * Takes translated segments and returns a complete SRT file as a string.
 * 
 * @param segments - translated subtitle segments
 * @returns complete .srt file content as a string
 */
export function buildSrtContent(segments: TranslatedSegment[]): string {
  return segments
    .map((seg, index) => {
      const num   = index + 1                        // subtitle number (1, 2, 3...)
      const start = secondsToSrtTime(seg.start)      // "00:00:05,000"
      const end   = secondsToSrtTime(seg.end)        // "00:00:08,500"
      const text  = seg.translatedText               // the translated line
      
      // Each SRT block is: number, timing, text, blank line
      return `${num}\n${start} --> ${end}\n${text}`
    })
    .join('\n\n')  // blank line between each subtitle block
}

/**
 * segmentsToJson
 * Stores subtitles in a format our database can save (JSON string).
 * Also includes the original text so the editor can show "original | translation"
 */
export function segmentsToJson(segments: TranslatedSegment[]): string {
  const data = segments.map((seg, i) => ({
    id:       i + 1,
    start:    secondsToSrtTime(seg.start),
    end:      secondsToSrtTime(seg.end),
    original: seg.text,           // original language text
    text:     seg.translatedText, // translated text
  }))
  return JSON.stringify(data)
}
