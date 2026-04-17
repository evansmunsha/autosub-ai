export const metadata = {
  title: 'Pricing - AutoSub AI',
  description: 'Simple pricing for subtitle generation and editorial polish.',
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Start free, then scale when the workflow proves itself.
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-300">
            The core product is live today: upload, process, edit, polish, and
            download. If you need higher throughput or team usage, use a
            production plan while self-serve billing is still being wired in.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-4xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
              Free beta
            </p>
            <p className="mt-4 text-4xl font-black text-white">$0</p>
            <p className="mt-2 text-sm text-slate-400">
              Ideal for validating subtitle quality and workflow fit.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>Upload videos up to 2GB</li>
              <li>AI transcription and translation</li>
              <li>Browser editor with autosave</li>
              <li>AI polish and `.srt` download</li>
            </ul>
          </section>

          <section className="rounded-4xl border border-amber-400/30 bg-amber-400/10 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
              Production plan
            </p>
            <p className="mt-4 text-4xl font-black text-white">Custom</p>
            <p className="mt-2 text-sm text-slate-200">
              For teams processing large libraries or recurring long-form video.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-100">
              <li>Dedicated throughput planning</li>
              <li>Operational support for bulk usage</li>
              <li>Priority workflow tuning</li>
              <li>Manual onboarding while billing rolls out</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
