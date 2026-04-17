// lib/translate.ts
// ─────────────────────────────────────────────
// We use GPT to translate subtitle segments.
// We send segments in BATCHES of 20 at a time — this is faster
// and cheaper than sending one line at a time.

import { TranscriptSegment } from './whisper'
import { getOpenAIClient, parseJsonResponse } from './openai'

// Map language codes to human-readable names for the prompt
const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi',       ar: 'Arabic',      zh: 'Mandarin Chinese',
  es: 'Spanish',     fr: 'French',      pt: 'Portuguese',
  ru: 'Russian',     ja: 'Japanese',    ko: 'Korean',
  sw: 'Swahili',     de: 'German',      it: 'Italian',
  yo: 'Yoruba',      zu: 'Zulu',        bem: 'Bemba',
  ny: 'Chichewa',    en: 'English',
}

export interface TranslatedSegment extends TranscriptSegment {
  translatedText: string  // the English (or target language) translation
}

/**
 * translateSegments
 * Takes an array of transcript segments and translates them.
 * Processes 20 segments at a time for speed and cost efficiency.
 * 
 * @param segments - the transcribed segments from Whisper
 * @param sourceLang - original language code e.g. "hi"
 * @param targetLang - target language code e.g. "en"
 * @returns segments with translatedText added
 */
export async function translateSegments(
  segments: TranscriptSegment[],
  sourceLang: string,
  targetLang: string
): Promise<TranslatedSegment[]> {
  
  const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang
  const targetName = LANGUAGE_NAMES[targetLang] || targetLang
  const BATCH_SIZE = 20
  const results: TranslatedSegment[] = []
  
  // Split segments into chunks of 20
  // e.g. 60 segments → 3 batches of 20
  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    const batch = segments.slice(i, i + BATCH_SIZE)
    
    // Build a numbered list like:
    // 1: Yeh raid hai.
    // 2: Sahab, hamare paas koi khabar nahi thi.
    const inputText = batch
      .map(seg => `${seg.id}: ${seg.text}`)
      .join('\n')
    
    console.log(`🌍 Translating batch ${Math.floor(i/BATCH_SIZE)+1}`)
    
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini', // faster and cheaper than gpt-4
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a professional subtitle translator.
Translate from ${sourceName} to ${targetName}.
Keep translations natural, cinematic, and concise.
Return ONLY a JSON object like: { "1": "translation", "2": "translation" }
No extra text, no markdown.`
        },
        {
          role: 'user',
          content: inputText
        }
      ],
      temperature: 0.3, // low temperature = more consistent, less creative
    })
    
    // Parse the JSON response
    const translations = parseJsonResponse<Record<string, string>>(
      response.choices[0].message.content
    )
    
    // Attach each translation to its original segment
    batch.forEach(seg => {
      results.push({
        ...seg,
        translatedText: translations[String(seg.id)] || seg.text
      })
    })
  }
  
  return results
}
