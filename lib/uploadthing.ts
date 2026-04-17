// lib/uploadthing.ts

import { generateReactHelpers } from '@uploadthing/react'
import type { OurFileRouter } from '@/app/api/uploadthing/route'

// generateReactHelpers only gives us useUploadThing and uploadFiles
export const { useUploadThing } = generateReactHelpers<OurFileRouter>()

// UploadButton is a pre-built component — imported separately
export { UploadButton } from '@uploadthing/react'