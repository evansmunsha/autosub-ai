import Link from 'next/link'
import { notFound } from 'next/navigation'
import SubtitleEditor from '@/components/SubtitleEditor'
import { getDb } from '@/lib/db'
import { parseSubtitleLines } from '@/lib/subtitles'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params

  const task = await getDb().subtitleTask.findUnique({
    where: { id },
    select: {
      id: true,
      fileName: true,
      status: true,
      subtitlesJson: true,
    },
  })

  if (!task) {
    notFound()
  }

  if (task.status !== 'done') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="text-center text-white">
          <p className="mb-4 text-xl">Still processing...</p>
          <Link
            href={`/subtitles/processing?id=${id}`}
            className="text-amber-400 underline"
          >
            Go back to the progress page
          </Link>
        </div>
      </main>
    )
  }

  const subtitles = parseSubtitleLines(task.subtitlesJson)

  return (
    <main className="min-h-screen bg-slate-950 py-12">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/20">
        <SubtitleEditor
          taskId={task.id}
          fileName={task.fileName}
          initialSubtitles={subtitles}
        />
      </div>
    </main>
  )
}
