'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUploadThing } from '@/lib/uploadthing'
import LanguageSelector from './LanguageSelector'
import ProgressBar from './ProgressBar'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Something went wrong.'
}

export default function UploadForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sourceLang, setSourceLang] = useState('hi')
  const [targetLang, setTargetLang] = useState('en')
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [error, setError] = useState('')

  const { startUpload } = useUploadThing('videoUploader', {
    onUploadProgress: (pct) => {
      setUploadPct(pct)
    },
  })

  function handleFileSelection(nextFile: File | null) {
    if (!nextFile) {
      setFile(null)
      return
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setError('Please choose a file smaller than 2GB.')
      return
    }

    setError('')
    setFile(nextFile)
  }

  async function handleSubmit() {
    if (!file) {
      setError('Please select a video file first.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const uploadResult = await startUpload([file])

      if (!uploadResult || uploadResult.length === 0) {
        throw new Error('Upload failed — no result returned.')
      }

      const serverData = uploadResult[0].serverData

      if (!serverData?.url) {
        throw new Error('Upload completed, but the file URL was missing.')
      }

      const response = await fetch('/api/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: serverData.url,
          fileName: serverData.name ?? file.name,
          sourceLang,
          targetLang,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create the subtitle task.')
      }

      router.push(`/subtitles/processing?id=${data.taskId}`)
    } catch (error) {
      setError(getErrorMessage(error))
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div
        className="mb-6 cursor-pointer rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center transition-colors hover:border-amber-500"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFileSelection(event.dataTransfer.files?.[0] ?? null)
        }}
      >
        <input
          ref={inputRef}
          id="fileInput"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
        />

        {file ? (
          <div>
            <p className="text-lg font-medium text-slate-950">{file.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-slate-950">Drop your video here</p>
            <p className="mt-1 text-sm text-slate-500">
              MP4, MKV, AVI and more — up to 2GB
            </p>
          </div>
        )}
      </div>

      <LanguageSelector
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={setSourceLang}
        onTargetChange={setTargetLang}
      />

      {uploading && (
        <div className="mb-4 mt-4">
          <ProgressBar value={uploadPct} label="Uploading video" />
        </div>
      )}

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={uploading || !file}
        className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {uploading ? 'Uploading and queueing…' : 'Generate subtitles'}
      </button>
    </div>
  )
}
