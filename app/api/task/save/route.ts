import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getErrorMessage } from '@/lib/errors'

const subtitleLineSchema = z.object({
  id: z.number().int().positive(),
  start: z.string().min(1),
  end: z.string().min(1),
  original: z.string(),
  text: z.string().max(4000),
})

const saveRequestSchema = z.object({
  taskId: z.string().trim().min(1),
  subtitles: z.array(subtitleLineSchema),
})

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = saveRequestSchema.parse(await request.json())

    const task = await db.subtitleTask.findUnique({
      where: { id: body.taskId },
      select: { id: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 })
    }

    await db.subtitleTask.update({
      where: { id: body.taskId },
      data: {
        subtitlesJson: JSON.stringify(body.subtitles),
      },
    })

    return NextResponse.json({ saved: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subtitle payload.', issues: error.flatten() },
        { status: 400 }
      )
    }

    console.error('Save request failed:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to save subtitles.') },
      { status: 500 }
    )
  }
}
