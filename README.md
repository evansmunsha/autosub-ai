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
- Health check route at `/api/health`

## Required environment variables

Copy `.env.example` to `.env` and update the values.

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for Whisper and GPT-based translation/polish
- `UPLOADTHING_TOKEN`: UploadThing server token
- `NEXT_PUBLIC_APP_URL`: Public base URL used for metadata and sitemap
- `WORKER_CONCURRENCY`: Optional BullMQ worker concurrency

## Local development on Windows

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run db:generate
```

3. Create or update your database schema:



git init
git add .
git commit -m "first commit"
git branch -M master
git remote add origin https://github.com/evansmunsha/autosub-ai.git
git push -u origin master




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

## Verification commands

```bash
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
- `/api/health`: health check for database and Redis
