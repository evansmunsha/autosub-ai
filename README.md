# AutoSub AI

AutoSub AI is a Next.js 16 app for turning uploaded video into subtitle files.
The workflow is:

1. Upload a video with UploadThing.
2. Queue the task in Redis with BullMQ.
3. Process the video in a worker: download, extract audio, transcribe, translate, and save subtitle JSON.
4. Review and refine the subtitles in the browser.
5. Download the finished `.srt` file.

## Production baseline in this repo

- Next.js 16 App Router UI
- Prisma + PostgreSQL persistence
- BullMQ + Redis background processing
- Windows-safe worker temp storage
- Chunked Whisper transcription for long-form uploads
- Autosaving subtitle editor with AI polish route
- Liveness route at `/api/health`
- Readiness route at `/api/ready`
- Local environment and dependency audit via `npm run doctor`

## Required environment variables

Copy `.env.example` to `.env` and update the values.

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for Whisper and GPT-based translation/polish
- `UPLOADTHING_TOKEN`: UploadThing server token
- `NEXT_PUBLIC_APP_URL`: Public base URL used for metadata and sitemap
- `WORKER_CONCURRENCY`: Optional BullMQ worker concurrency

## Local development on Windows

You need two local services available before jobs can process:

- PostgreSQL reachable from `DATABASE_URL`
- Redis reachable from `REDIS_URL`

This machine currently has PostgreSQL working, but no Redis service is installed or running, so `/api/ready` and `npm run doctor` will stay red until Redis is available on `127.0.0.1:6379` or the env value is changed to a working Redis host.

Common Windows options for Redis are:

- Memurai running as a Windows service
- Redis inside WSL and exposed to Windows
- A hosted Redis instance with `REDIS_URL` pointed at it

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run db:generate
```

3. Create or update your database schema:

```bash
npm run db:migrate
```

4. Start the Next.js app:

```bash
npm run dev
```

5. Start the worker in a second terminal:

```bash
npm run worker
```

The worker now loads `.env` automatically, so the same local environment file is used by both the Next.js app and the background processor.

## Verification commands

```bash
npm run doctor
npm run lint
npm run build
```

## Routes

- `/`: product landing page
- `/subtitles`: upload flow
- `/subtitles/processing?id=...`: live job progress
- `/editor/[id]`: subtitle editor
- `/pricing`: pricing page
- `/api/task/create`: create a processing task
- `/api/task/progress`: poll task status
- `/api/task/rewrite`: AI polish subtitles and persist the result
- `/api/task/save`: save editor changes
- `/api/health`: liveness and environment summary
- `/api/ready`: strict readiness check for env, PostgreSQL, and Redis
