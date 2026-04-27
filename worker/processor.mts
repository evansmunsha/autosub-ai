import 'dotenv/config'
import { Worker } from 'bullmq'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import type { ReadableStream as WebReadableStream } from 'stream/web'
import { getDb } from '../lib/db.ts'
import { assertEnvTarget, getWorkerConcurrency } from '../lib/env.ts'
import { getErrorMessage } from '../lib/errors.ts'
import { extractAudio, splitAudioForTranscription } from '../lib/ffmpeg.ts'
import { SubtitleTaskData } from '../lib/queue.ts'
import { getRedis } from '../lib/redis.ts'
import { segmentsToJson } from '../lib/srt.ts'
import { buildSrtFromSubtitleLines, parseSubtitleLines } from '../lib/subtitles.ts'
import { translateSegments } from '../lib/translate.ts'
import { transcribeAudio } from '../lib/whisper.ts'

async function downloadFile(url: string, destPath: string) {
  const response = await fetch(url)

  if (!response.ok || !response.body) {
    throw new Error(`Could not download source video (${response.status}).`)
  }

  await pipeline(
    Readable.fromWeb(response.body as WebReadableStream),
    fs.createWriteStream(destPath)
  )
}

async function createTaskWorkspace(taskId: string) {
  const baseDir = path.join(os.tmpdir(), 'autosubs-ai')
  await fs.promises.mkdir(baseDir, { recursive: true })
  return fs.promises.mkdtemp(path.join(baseDir, `${taskId}-`))
}

async function updateTask(
  taskId: string,
  status: string,
  progress: number,
  extra?: Record<string, string | number | null>
) {
  await getDb().subtitleTask.update({
    where: { id: taskId },
    data: { status, progress, ...extra },
  })

  console.log(`Task ${taskId}: ${status} (${progress}%)`)
}

assertEnvTarget('worker')

const worker = new Worker<SubtitleTaskData>(
  'subtitle-processing',
  async (job) => {
    const { taskId, fileUrl, sourceLang, targetLang } = job.data
    const workDir = await createTaskWorkspace(taskId)

    try {
      await updateTask(taskId, 'downloading', 10)

      const videoPath = path.join(workDir, `${taskId}.mp4`)
      await downloadFile(fileUrl, videoPath)

      await updateTask(taskId, 'extracting', 25)

      const audioPath = await extractAudio(videoPath, workDir)
      await fs.promises.unlink(videoPath).catch(() => undefined)

      await updateTask(taskId, 'transcribing', 45)

      const audioChunks = await splitAudioForTranscription(audioPath, workDir)
      const segments = await transcribeAudio(audioChunks, sourceLang)

      await fs.promises.unlink(audioPath).catch(() => undefined)
      await Promise.all(
        audioChunks
          .map((chunk) => chunk.path)
          .filter((chunkPath) => chunkPath !== audioPath)
          .map((chunkPath) => fs.promises.unlink(chunkPath).catch(() => undefined))
      )

      await updateTask(taskId, 'translating', 65)

      const translated = await translateSegments(segments, sourceLang, targetLang)

      await updateTask(taskId, 'finalizing', 85)

      const subtitleJson = segmentsToJson(translated)
      const editableSubtitles = parseSubtitleLines(subtitleJson)
      const srtContent = buildSrtFromSubtitleLines(editableSubtitles)

      await fs.promises.writeFile(
        path.join(workDir, `${taskId}.srt`),
        srtContent,
        'utf8'
      )

      await updateTask(taskId, 'done', 100, {
        subtitlesJson: subtitleJson,
        errorMsg: null,
      })
    } catch (error) {
      const message = getErrorMessage(error, 'Unknown worker failure.')
      console.error(`Task ${taskId} failed:`, message)

      await updateTask(taskId, 'failed', 0, {
        errorMsg: message,
      })

      throw error
    } finally {
      await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => undefined)
    }
  },
  {
    connection: getRedis(),
    concurrency: getWorkerConcurrency(),
  }
)

worker.on('ready', () => console.log('Worker is ready and watching the queue'))
worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed: ${error.message}`)
})
