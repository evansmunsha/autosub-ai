import 'dotenv/config'
import fs from 'fs/promises'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { getEnvAudit } from '../lib/env.ts'
import { getReadinessReport } from '../lib/readiness.ts'

function printSection(title: string) {
  console.log(`\n${title}`)
}

function printLine(label: string, value: string) {
  console.log(`- ${label}: ${value}`)
}

async function main() {
  const envAudit = getEnvAudit('production')

  printSection('AutoSub AI Doctor')
  printLine('Node', process.version)
  printLine('Platform', `${process.platform} ${process.arch}`)

  printSection('Environment')
  printLine('Status', envAudit.ok ? 'ready' : 'incomplete')

  for (const item of envAudit.invalid) {
    printLine(item.key, item.issue)
  }

  printSection('Worker Prerequisites')

  try {
    await fs.access(ffmpegInstaller.path)
    printLine('FFmpeg binary', ffmpegInstaller.path)
  } catch {
    printLine('FFmpeg binary', 'missing')
  }

  printSection('Service Readiness')
  const readiness = await getReadinessReport()
  printLine('Overall', readiness.ok ? 'ready' : 'not ready')
  printLine('Database', readiness.services.database.status)

  if (readiness.services.database.detail) {
    printLine('Database detail', readiness.services.database.detail)
  }

  printLine('Redis', readiness.services.redis.status)

  if (readiness.services.redis.detail) {
    printLine('Redis detail', readiness.services.redis.detail)
  }

  if (!readiness.ok) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('\nDoctor failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
