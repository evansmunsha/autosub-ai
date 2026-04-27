import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { getRequiredEnvValue } from './env.ts'

declare global {
  var prisma: PrismaClient | undefined
}

export function getDb() {
  if (globalThis.prisma) {
    return globalThis.prisma
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getRequiredEnvValue('DATABASE_URL') }),
  })

  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client
  }

  return client
}
