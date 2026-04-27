// app/api/task/progress/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getErrorMessage } from '@/lib/errors'
import { parseSubtitleLines, type SubtitleLine } from '@/lib/subtitles'

export const runtime = 'nodejs'

interface ProgressResponse {
  id: string
  status: string
  progress: number
  fileName: string
  error?: string | null
  subtitles?: SubtitleLine[]
}

export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('id')

    if (!taskId) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 })
    }

    // Always fetch subtitlesJson — we decide below whether to send it
    // We can't reference 'task' inside the query that creates 'task'
    const task = await getDb().subtitleTask.findUnique({
      where: { id: taskId },
      select: {
        id:            true,
        status:        true,
        progress:      true,
        errorMsg:      true,
        fileName:      true,
        subtitlesJson: true,  // always fetch it, filter below
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const response: ProgressResponse = {
      id:       task.id,
      status:   task.status,
      progress: task.progress,
      fileName: task.fileName,
    }

    if (task.status === 'failed') {
      response.error = task.errorMsg
    }

    // Only include subtitles in the response when done
    if (task.status === 'done' && task.subtitlesJson) {
      response.subtitles = parseSubtitleLines(task.subtitlesJson)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Progress check error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Server error.') },
      { status: 500 }
    )
  }
}
