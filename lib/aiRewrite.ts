// lib/aiRewrite.ts
// ─────────────────────────────────────────────
// After translation, subtitles can sometimes sound robotic.
// This function sends them to GPT and asks for a more natural rewrite.
// Think of it as a "polish pass" — the meaning stays the same
// but the phrasing becomes more natural and cinematic.

import { getOpenAIClient, parseJsonResponse } from './openai'

export interface SubtitleLine {
  id: number
  text: string
}

/**
 * rewriteSubtitles
 * Takes subtitle lines and returns AI-polished versions.
 * Processes in batches of 30 to stay within token limits.
 * 
 * @param subtitles - array of { id, text } objects
 * @returns array of { id, text } with improved text
 */
export async function rewriteSubtitles(
  subtitles: SubtitleLine[]
): Promise<SubtitleLine[]> {
  
  const BATCH_SIZE = 30
  const results: SubtitleLine[] = []
  
  for (let i = 0; i < subtitles.length; i += BATCH_SIZE) {
    const batch = subtitles.slice(i, i + BATCH_SIZE)
    
    // Format: "1: This is an official raid."
    const input = batch.map(s => `${s.id}: ${s.text}`).join('\n')
    
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          // We give very specific instructions:
          // - keep meaning the same
          // - make it shorter and more natural
          // - film-quality language
          content: `You are a professional subtitle editor.
Rewrite these subtitles to sound more natural and cinematic.
Rules:
- Keep the meaning exactly the same
- Make phrasing shorter and more natural sounding
- Use the tone of a well-dubbed Hollywood film
- Do NOT change names or places
Return ONLY a JSON object like: { "1": "rewritten line", "2": "rewritten line" }
No markdown, no extra text.`
        },
        { role: 'user', content: input }
      ],
      temperature: 0.4
    })
    
    const rewrites = parseJsonResponse<Record<string, string>>(
      response.choices[0].message.content
    )
    
    // Merge rewrites back — if a rewrite failed, keep original
    batch.forEach(sub => {
      results.push({
        id:   sub.id,
        text: rewrites[String(sub.id)] || sub.text
      })
    })
  }
  
  return results
}
