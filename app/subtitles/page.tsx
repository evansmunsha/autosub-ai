import UploadForm from '@/components/UploadForm'

export const metadata = {
  title: 'Upload Video - AutoSub AI',
  description: 'Upload your video and turn it into subtitle files.',
}

export default function SubtitlesPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold text-white">Upload your video</h1>
        <p className="text-slate-400">
          Supports MP4, MKV, AVI and more — up to 2GB
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/20">
        <UploadForm />
      </div>
    </main>
  )
}
