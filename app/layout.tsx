import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'AutoSub AI',
  description:
    'Upload long-form video and turn it into timed subtitles with AI transcription, translation, and editing.',
  applicationName: 'AutoSub AI',
  manifest: '/manifest.json',
  openGraph: {
    title: 'AutoSub AI',
    description:
      'Timed subtitles for long-form video, with AI polishing and an editor that keeps your work saved.',
    url: baseUrl,
    siteName: 'AutoSub AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'AutoSub AI',
    description:
      'Turn uploaded video into subtitle files with AI transcription, translation, and editing.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AutoSub AI',
  },
}

export const viewport: Viewport = {
  themeColor: '#09090b',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-950 text-white">
          <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                Auto<span className="text-amber-400">Sub</span> AI
              </Link>
              <div className="flex items-center gap-6 text-sm text-slate-300">
                <Link href="/subtitles" className="transition hover:text-white">
                  Start
                </Link>
                <Link href="/pricing" className="transition hover:text-white">
                  Pricing
                </Link>
              </div>
            </div>
          </nav>
          <div className="pt-16">{children}</div>
        </div>
      </body>
    </html>
  )
}
