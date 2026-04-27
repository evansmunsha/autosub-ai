import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rewriteSubtitles } from '@/lib/aiRewrite'
import { getDb } from '@/lib/db'
import { getErrorMessage } from '@/lib/errors'
import {
  mergeSubtitleTextUpdates,
  parseSubtitleLines,
  type SubtitleTextUpdate,
} from '@/lib/subtitles'

const subtitleTextUpdateSchema = z.object({
  id: z.number().int().positive(),
  text: z.string().max(4000),
})

const rewriteRequestSchema = z.object({
  taskId: z.string().trim().min(1),
  subtitles: z.array(subtitleTextUpdateSchema).min(1),
})

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = rewriteRequestSchema.parse(await request.json())

    const task = await getDb().subtitleTask.findUnique({
      where: { id: body.taskId },
      select: { subtitlesJson: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 })
    }

    const rewritten = await rewriteSubtitles(body.subtitles as SubtitleTextUpdate[])
    const nextSubtitles = mergeSubtitleTextUpdates(
      parseSubtitleLines(task.subtitlesJson),
      rewritten
    )

    await getDb().subtitleTask.update({
      where: { id: body.taskId },
      data: {
        subtitlesJson: JSON.stringify(nextSubtitles),
      },
    })

    return NextResponse.json({
      rewritten,
      saved: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid rewrite payload.', issues: error.flatten() },
        { status: 400 }
      )
    }

    console.error('Rewrite request failed:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to polish subtitles.') },
      { status: 500 }
    )
  }
}
