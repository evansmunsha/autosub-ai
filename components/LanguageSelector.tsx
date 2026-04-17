'use client'

const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese (Mandarin)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'sw', label: 'Swahili' },
  { code: 'bem', label: 'Bemba' },
  { code: 'ny', label: 'Chichewa' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'zu', label: 'Zulu' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
]

interface Props {
  sourceLang: string
  targetLang: string
  onSourceChange: (code: string) => void
  onTargetChange: (code: string) => void
}

export default function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
}: Props) {
  return (
    <div className="my-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
          Video language
        </label>
        <select
          value={sourceLang}
          onChange={(event) => onSourceChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden pb-2 text-center text-lg text-slate-400 md:block">
        to
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
          Translate to
        </label>
        <select
          value={targetLang}
          onChange={(event) => onTargetChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="en">English</option>
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
