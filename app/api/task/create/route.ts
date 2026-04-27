// app/api/task/create/route.ts
// ─────────────────────────────────────────────
// Called after a file finishes uploading.
// Steps:
//   1. Receive the file URL + language settings from the browser
//   2. Create a new row in the SubtitleTask database table
//   3. Add it to the BullMQ queue for background processing
//   4. Return the task ID to the browser

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { getErrorMessage } from '@/lib/errors'
import { addToQueue } from '@/lib/queue'

const createTaskSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().trim().max(255).optional(),
  sourceLang: z.string().trim().min(2).max(12),
  targetLang: z.string().trim().min(2).max(12),
})

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let taskId: string | undefined

  try {
    const body = createTaskSchema.parse(await req.json())
    const { fileUrl, fileName, sourceLang, targetLang } = body
    
    // STEP 1: Create a record in the database
    // This is like opening a ticket — status starts as "waiting"
    const task = await getDb().subtitleTask.create({
      data: {
        fileUrl,
        fileName:   fileName || 'video',
        sourceLang,
        targetLang,
        status:     'waiting',  // will change as worker processes it
        progress:   0,          // 0% to start
      }
    })
    taskId = task.id
    
    console.log(`📋 Created task: ${task.id}`)
    
    // STEP 2: Add to the processing queue
    // The worker will pick this up and start processing
    await addToQueue({
      taskId:     task.id,
      fileUrl:    task.fileUrl,
      sourceLang: task.sourceLang,
      targetLang: task.targetLang,
    })
    
    console.log(`📬 Task ${task.id} added to queue`)
    
    // STEP 3: Return the task ID to the browser
    // The browser will use this ID to check progress
    return NextResponse.json({
      success: true,
      taskId:  task.id,
      message: 'Processing started'
    })
    
  } catch (error) {
    if (taskId) {
      await getDb().subtitleTask
        .update({
          where: { id: taskId },
          data: {
            status: 'failed',
            errorMsg: getErrorMessage(error),
          },
        })
        .catch(() => undefined)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid task payload.', issues: error.flatten() },
        { status: 400 }
      )
    }

    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to create task.') },
      { status: 500 }
    )
  }
}
