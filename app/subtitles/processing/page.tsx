'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Waiting in line...',
  downloading: 'Downloading video...',
  extracting: 'Extracting audio...',
  transcribing: 'Transcribing speech...',
  translating: 'Translating subtitles...',
  finalizing: 'Building subtitle file...',
  done: 'Done!',
  failed: 'Something went wrong',
}

export default function ProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const taskId = searchParams.get('id')

  const [status, setStatus] = useState('waiting')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!taskId) {
      return
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/task/progress?id=${taskId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Progress lookup failed.')
        }

        setStatus(data.status)
        setProgress(data.progress)

        if (data.status === 'done') {
          window.clearInterval(interval)
          router.replace(`/editor/${taskId}`)
        }

        if (data.status === 'failed') {
          window.clearInterval(interval)
          setError(data.error || 'Processing failed.')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)

    return () => window.clearInterval(interval)
  }, [router, taskId])

  if (!taskId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-8 text-center shadow-2xl shadow-black/20">
          <h2 className="text-xl font-semibold text-slate-950">Missing task ID</h2>
          <p className="mt-3 text-sm text-slate-500">
            Start from the upload page so we can track progress for your video.
          </p>
          <Link
            href="/subtitles"
            className="mt-6 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Back to upload
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-10 shadow-2xl shadow-black/20">
        <h2 className="mb-6 text-xl font-semibold text-slate-950">
          Processing your video
        </h2>

        <p className="mb-4 text-sm text-slate-600">
          {STATUS_LABELS[status] || status}
        </p>

        <ProgressBar value={progress} label="Pipeline progress" />

        {error && (
          <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            Error: {error}
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Most uploads finish in a few minutes. Keep this page open and we will
          move you into the editor automatically.
        </p>
      </div>
    </main>
  )
}
