// lib/redis.ts
// ─────────────────────────────────────────────
// Redis is an in-memory store — think of it as a very fast
// whiteboard that BullMQ writes task information on.

import IORedis from 'ioredis'

let redisClient: IORedis | null = null

function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    throw new Error('REDIS_URL is not configured.')
  }

  return redisUrl
}

export function getRedis() {
  if (redisClient) {
    return redisClient
  }

  redisClient = new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 10) return null
      return Math.min(times * 200, 2000)
    },
  })

  redisClient.on('connect', () => {
    console.log('Redis connected')
  })

  redisClient.on('error', (error) => {
    console.error('Redis error:', error.message)
  })

  return redisClient
}
