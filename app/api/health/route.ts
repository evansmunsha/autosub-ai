import { NextResponse } from 'next/server'
import { getEnvAudit } from '@/lib/env'

export const runtime = 'nodejs'

export async function GET() {
  const envAudit = getEnvAudit('production')

  return NextResponse.json({
    ok: true,
    status: 'live',
    checkedAt: new Date().toISOString(),
    environment: {
      ok: envAudit.ok,
      missing: envAudit.missing,
      invalid: envAudit.invalid,
    },
  })
}
