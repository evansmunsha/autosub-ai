import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-4xl border border-white/10 bg-white p-8 text-center shadow-2xl shadow-black/20">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-500">
          404
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">
          That page is not here.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          The link may be old, or the resource may still be processing.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          Back home
        </Link>
      </div>
    </main>
  )
}
