export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 py-12">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
        <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </main>
  )
}
