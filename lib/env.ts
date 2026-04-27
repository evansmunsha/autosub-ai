import { z } from 'zod'

const workerConcurrencySchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'must be a whole number')
  .transform((value) => Number(value))
  .refine((value) => value >= 1 && value <= 32, 'must be between 1 and 32')
  .optional()

const envSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, 'is required'),
  REDIS_URL: z.string().trim().min(1, 'is required'),
  OPENAI_API_KEY: z.string().trim().min(1, 'is required'),
  UPLOADTHING_TOKEN: z.string().trim().min(1, 'is required'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .trim()
    .url('must be a valid URL')
    .refine((value) => value.startsWith('http://') || value.startsWith('https://'), {
      message: 'must start with http:// or https://',
    }),
  WORKER_CONCURRENCY: workerConcurrencySchema,
})

const webEnvSchema = envSchema.pick({
  DATABASE_URL: true,
  REDIS_URL: true,
  UPLOADTHING_TOKEN: true,
})

const workerEnvSchema = envSchema.pick({
  DATABASE_URL: true,
  REDIS_URL: true,
  OPENAI_API_KEY: true,
  WORKER_CONCURRENCY: true,
})

const productionEnvSchema = envSchema.pick({
  DATABASE_URL: true,
  REDIS_URL: true,
  OPENAI_API_KEY: true,
  UPLOADTHING_TOKEN: true,
  NEXT_PUBLIC_APP_URL: true,
  WORKER_CONCURRENCY: true,
})

export type EnvKey = keyof z.infer<typeof envSchema>
export type EnvTarget = 'web' | 'worker' | 'production'

const allEnvKeys: EnvKey[] = [
  'DATABASE_URL',
  'REDIS_URL',
  'OPENAI_API_KEY',
  'UPLOADTHING_TOKEN',
  'NEXT_PUBLIC_APP_URL',
  'WORKER_CONCURRENCY',
]

const targetKeys: Record<EnvTarget, EnvKey[]> = {
  web: ['DATABASE_URL', 'REDIS_URL', 'UPLOADTHING_TOKEN'],
  worker: ['DATABASE_URL', 'REDIS_URL', 'OPENAI_API_KEY', 'WORKER_CONCURRENCY'],
  production: [
    'DATABASE_URL',
    'REDIS_URL',
    'OPENAI_API_KEY',
    'UPLOADTHING_TOKEN',
    'NEXT_PUBLIC_APP_URL',
    'WORKER_CONCURRENCY',
  ],
}

const envDescriptions: Record<EnvKey, string> = {
  DATABASE_URL: 'PostgreSQL connection string',
  REDIS_URL: 'Redis connection string',
  OPENAI_API_KEY: 'OpenAI API key',
  UPLOADTHING_TOKEN: 'UploadThing server token',
  NEXT_PUBLIC_APP_URL: 'Public base URL',
  WORKER_CONCURRENCY: 'Background worker concurrency',
}

export interface EnvStatus {
  present: boolean
  valid: boolean
  description: string
  issue?: string
}

export interface EnvAudit {
  ok: boolean
  target: EnvTarget
  keys: Record<EnvKey, EnvStatus>
  missing: EnvKey[]
  invalid: Array<{ key: EnvKey; issue: string }>
}

function getTargetSchema(target: EnvTarget) {
  switch (target) {
    case 'web':
      return webEnvSchema
    case 'worker':
      return workerEnvSchema
    case 'production':
      return productionEnvSchema
  }
}

function normalizeIssue(issue: string) {
  return issue.replace(/^Invalid input:\s*/i, '')
}

export function getEnvAudit(
  target: EnvTarget,
  env: NodeJS.ProcessEnv = process.env
): EnvAudit {
  const keys = {} as Record<EnvKey, EnvStatus>

  for (const key of allEnvKeys) {
    const value = env[key]
    keys[key] = {
      present: typeof value === 'string' && value.trim().length > 0,
      valid: !targetKeys[target].includes(key),
      description: envDescriptions[key],
    }
  }

  const schema = getTargetSchema(target)
  const subset = Object.fromEntries(targetKeys[target].map((key) => [key, env[key]]))
  const parsed = schema.safeParse(subset)

  if (parsed.success) {
    for (const key of targetKeys[target]) {
      keys[key].valid = true
    }

    return {
      ok: true,
      target,
      keys,
      missing: [],
      invalid: [],
    }
  }

  const invalid = parsed.error.issues
    .map((issue) => {
      const key = issue.path[0] as EnvKey
      const message =
        issue.code === 'invalid_type' && !keys[key].present
          ? 'is missing'
          : normalizeIssue(issue.message)

      keys[key].issue = message

      return { key, issue: message }
    })
    .filter((item, index, items) => items.findIndex((entry) => entry.key === item.key) === index)

  for (const key of targetKeys[target]) {
    if (!keys[key].issue) {
      keys[key].valid = true
    }
  }

  return {
    ok: invalid.length === 0,
    target,
    keys,
    missing: invalid.filter((item) => item.issue === 'is missing').map((item) => item.key),
    invalid,
  }
}

export function getRequiredEnvValue(key: EnvKey) {
  const value = process.env[key]

  if (!value || value.trim().length === 0) {
    throw new Error(`${key} is not configured.`)
  }

  return value
}

export function getWorkerConcurrency() {
  const parsed = workerConcurrencySchema.safeParse(process.env.WORKER_CONCURRENCY)

  if (!parsed.success) {
    return 2
  }

  return parsed.data ?? 2
}

export function assertEnvTarget(target: EnvTarget) {
  const audit = getEnvAudit(target)

  if (!audit.ok) {
    const details = audit.invalid.map(({ key, issue }) => `${key} ${issue}`).join(', ')
    throw new Error(`Environment validation failed for ${target}: ${details}.`)
  }
}
