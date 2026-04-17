import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not configured.`)
  }

  return value
}

export function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient
  }

  openaiClient = new OpenAI({
    apiKey: getRequiredEnv('OPENAI_API_KEY'),
  })

  return openaiClient
}

export function parseJsonResponse<T>(content: string | null | undefined): T {
  const raw = (content ?? '').trim()

  if (!raw) {
    throw new Error('The AI service returned an empty response.')
  }

  const normalized = raw.replace(/```json|```/gi, '').trim()
  return JSON.parse(normalized) as T
}
