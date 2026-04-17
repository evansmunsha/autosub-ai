import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getErrorMessage } from '@/lib/errors'
import { getRedis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    await getRedis().ping()

    return NextResponse.json({
      ok: true,
      services: {
        database: 'up',
        redis: 'up',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, 'Health check failed.'),
      },
      { status: 503 }
    )
  }
}
