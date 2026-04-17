import { createRouteHandler, createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const runtime = 'nodejs'

export const ourFileRouter = {
  videoUploader: f({
    video: {
      maxFileSize: '2GB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return { uploadedAt: new Date().toISOString() }
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Upload complete:', file.ufsUrl)
      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})
