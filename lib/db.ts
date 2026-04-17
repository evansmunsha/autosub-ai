import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.')
  }

  return databaseUrl
}

declare global {
  var prisma: PrismaClient | undefined
}

export const db =
  globalThis.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}
