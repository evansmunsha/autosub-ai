'use client'

import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react'
import { buildSrtFromSubtitleLines, type SubtitleLine } from '@/lib/subtitles'

interface Props {
  taskId: string
  fileName: string
  initialSubtitles: SubtitleLine[]
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Something went wrong.'
}

async function saveSubtitleDraft(taskId: string, subtitles: SubtitleLine[]) {
  const response = await fetch('/api/task/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId,
      subtitles,
    }),
  })

  const data = await response.json()

  if (!response.ok || !data.saved) {
    throw new Error(data.error || 'Failed to save your subtitle edits.')
  }
}

export default function SubtitleEditor({
  taskId,
  fileName,
  initialSubtitles,
}: Props) {
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>(initialSubtitles)
  const [polishing, setPolishing] = useState(false)
  const [notice, setNotice] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved')
  const saveVersionRef = useRef(0)

  function createSnapshot(value: SubtitleLine[]) {
    return JSON.stringify(value)
  }

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    createSnapshot(initialSubtitles)
  )

  const isDirty = createSnapshot(subtitles) !== lastSavedSnapshot

  async function persistSubtitles(nextSubtitles: SubtitleLine[]) {
    const currentVersion = ++saveVersionRef.current
    setSaveState('saving')

    try {
      await saveSubtitleDraft(taskId, nextSubtitles)

      if (currentVersion === saveVersionRef.current) {
        setLastSavedSnapshot(createSnapshot(nextSubtitles))
        setSaveState('saved')
      }
    } catch (error) {
      setSaveState('error')
      setNotice(getErrorMessage(error))
    }
  }

  useEffect(() => {
    if (!isDirty) {
      return
    }

    setSaveState((current) => (current === 'error' ? 'error' : 'idle'))
    const timeout = window.setTimeout(() => {
      const currentVersion = ++saveVersionRef.current
      setSaveState('saving')

      void saveSubtitleDraft(taskId, subtitles)
        .then(() => {
          if (currentVersion === saveVersionRef.current) {
            setLastSavedSnapshot(createSnapshot(subtitles))
            setSaveState('saved')
          }
        })
        .catch((error) => {
          setSaveState('error')
          setNotice(getErrorMessage(error))
        })
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [isDirty, subtitles, taskId])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  function editLine(id: number, newText: string) {
    setSubtitles((previous) =>
      previous.map((subtitle) =>
        subtitle.id === id ? { ...subtitle, text: newText } : subtitle
      )
    )
  }

  async function handleAiPolish() {
    setPolishing(true)
    setNotice('')

    try {
      const response = await fetch('/api/task/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          subtitles: subtitles.map((subtitle) => ({
            id: subtitle.id,
            text: subtitle.text,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok || !Array.isArray(data.rewritten)) {
        throw new Error(data.error || 'Polish failed.')
      }

      const rewrittenMap = new Map<number, string>(
        data.rewritten.map((item: { id: number; text: string }) => [item.id, item.text])
      )

      const nextSubtitles = subtitles.map((subtitle) => {
        const text = rewrittenMap.get(subtitle.id)
        return text === undefined ? subtitle : { ...subtitle, text }
      })

      startTransition(() => {
        setSubtitles(nextSubtitles)
        setLastSavedSnapshot(createSnapshot(nextSubtitles))
        setSaveState('saved')
        setNotice('AI polish applied and saved.')
      })
    } catch (error) {
      setNotice(getErrorMessage(error))
      setSaveState('error')
    } finally {
      setPolishing(false)
    }
  }

  function downloadSrt() {
    const content = buildSrtFromSubtitleLines(subtitles)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `${fileName.replace(/\..+$/, '')}.srt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Subtitle editor</h2>
          <p className="text-sm text-slate-500">
            {subtitles.length} lines generated. Edits auto-save while you work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void persistSubtitles(subtitles)}
            disabled={saveState === 'saving'}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {saveState === 'saving'
              ? 'Saving…'
              : saveState === 'saved'
                ? 'Saved'
                : 'Save now'}
          </button>
          <button
            onClick={handleAiPolish}
            disabled={polishing}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {polishing ? 'Polishing…' : 'AI polish'}
          </button>
          <button
            onClick={downloadSrt}
            className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            Download SRT
          </button>
        </div>
      </div>

      {notice && (
        <p
          className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
            saveState === 'error'
              ? 'bg-rose-50 text-rose-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {notice}
        </p>
      )}

      <div className="space-y-2 pr-2">
        {subtitles.map((subtitle) => (
          <div
            key={subtitle.id}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="w-20 flex-shrink-0 pt-1 font-mono text-xs text-amber-600">
                {subtitle.start.substring(0, 8)}
              </div>
              <div className="flex-1">
                <textarea
                  value={subtitle.text}
                  onChange={(event) => editLine(subtitle.id, event.target.value)}
                  rows={2}
                  className="w-full resize-none border-none bg-transparent text-sm leading-relaxed outline-none"
                />
                {subtitle.original && (
                  <p className="mt-1 text-xs italic text-slate-400">
                    Original: {subtitle.original}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
