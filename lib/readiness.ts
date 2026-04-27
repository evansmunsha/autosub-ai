import IORedis from 'ioredis'
import { getDb } from './db.ts'
import { getErrorMessage } from './errors.ts'
import { getEnvAudit, getRequiredEnvValue } from './env.ts'

type ServiceState = 'up' | 'down' | 'skipped'

interface ServiceReport {
  status: ServiceState
  detail?: string
}

export interface ReadinessReport {
  ok: boolean
  checkedAt: string
  environment: {
    ok: boolean
    missing: string[]
    invalid: Array<{ key: string; issue: string }>
  }
  services: {
    database: ServiceReport
    redis: ServiceReport
  }
}

async function probeRedis() {
  const redis = new IORedis(getRequiredEnvValue('REDIS_URL'), {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  })

  redis.on('error', () => undefined)

  try {
    await redis.connect()
    await redis.ping()
  } finally {
    redis.disconnect()
  }
}

export async function getReadinessReport(): Promise<ReadinessReport> {
  const envAudit = getEnvAudit('production')
  const report: ReadinessReport = {
    ok: false,
    checkedAt: new Date().toISOString(),
    environment: {
      ok: envAudit.ok,
      missing: envAudit.missing,
      invalid: envAudit.invalid,
    },
    services: {
      database: { status: 'skipped' },
      redis: { status: 'skipped' },
    },
  }

  if (envAudit.keys.DATABASE_URL.present) {
    try {
      await getDb().$queryRaw`SELECT 1`
      report.services.database = { status: 'up' }
    } catch (error) {
      report.services.database = {
        status: 'down',
        detail: getErrorMessage(error, 'Database probe failed.'),
      }
    }
  }

  if (envAudit.keys.REDIS_URL.present) {
    try {
      await probeRedis()
      report.services.redis = { status: 'up' }
    } catch (error) {
      report.services.redis = {
        status: 'down',
        detail: getErrorMessage(error, 'Redis probe failed.'),
      }
    }
  }

  report.ok =
    report.environment.ok &&
    report.services.database.status === 'up' &&
    report.services.redis.status === 'up'

  return report
}
