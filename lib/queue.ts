// lib/queue.ts
// ─────────────────────────────────────────────
// BullMQ creates a queue — a waiting line for video processing tasks.
// When someone uploads a video, we add it to this line.
// The worker (worker/processor.ts) picks it up and processes it.

import { Queue, type JobsOptions } from 'bullmq'
import { getRedis } from './redis'

let subtitleQueue: Queue<SubtitleTaskData> | null = null

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
}

// Type definition for what data we pass to each task
// TypeScript uses this to catch mistakes before they happen
export interface SubtitleTaskData {
  taskId: string    // the database ID of the SubtitleTask row
  fileUrl: string   // where the video file is stored
  sourceLang: string // e.g. "hi" for Hindi
  targetLang: string // e.g. "en" for English
}

function getSubtitleQueue() {
  if (subtitleQueue) {
    return subtitleQueue
  }

  subtitleQueue = new Queue<SubtitleTaskData>('subtitle-processing', {
    connection: getRedis(),
    defaultJobOptions,
  })

  return subtitleQueue
}

// Helper function — adds a new task to the queue
// Call this after someone uploads a video
export async function addToQueue(data: SubtitleTaskData) {
  const task = await getSubtitleQueue().add(
    'process-video',  // name of this type of task
    data,             // the data the worker will receive
  )
  
  console.log(`📬 Added task ${data.taskId} to queue (queue id: ${task.id})`)
  return task
}
