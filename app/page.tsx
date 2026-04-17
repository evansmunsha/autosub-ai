import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_28%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Long-form subtitle pipeline
          </p>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl">
            Upload video.
            <br />
            Leave with subtitle files that are ready to use.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            AutoSub AI handles transcription, translation, subtitle timing, AI
            polish, and manual cleanup in one workflow. Upload up to 2GB, keep
            editing in the browser, and download the final `.srt` when it looks
            right.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/subtitles"
              className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Generate subtitles
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              View pricing
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold text-amber-300">Upload</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Drag in MP4, MKV, AVI, or other video files up to 2GB.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold text-amber-300">Process</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              We extract speech, transcribe it, translate it, and build timed
              subtitle segments in the background.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold text-amber-300">Refine</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Polish lines with AI, make manual edits, and download a finished
              `.srt` file without losing your work on refresh.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
