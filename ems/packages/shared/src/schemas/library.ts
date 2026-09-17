import { z } from 'zod'
import { resourceTypeSchema, userRoleSchema } from '../enums'
import {
  LIBRARY_REQUEST_STATUSES,
  LIBRARY_RESOURCE_MAX_BYTES,
  LIBRARY_RESOURCE_MIME_TYPES,
} from '../library-resource'
import { isoDateTimeSchema, uuidSchema } from '../primitives'

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => (value ? value : undefined))

export const libraryFileSchema = z.object({
  id: uuidSchema,
  fileName: z.string(),
  format: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSizeBytes: z.number().int().nonnegative().nullable(),
  isPrimary: z.boolean(),
  createdAt: isoDateTimeSchema,
})

export const libraryAccessRuleSchema = z.object({
  programmeIds: z.array(uuidSchema),
  departmentIds: z.array(uuidSchema),
  yearGroups: z.array(z.number().int().min(1).max(8)),
  roles: z.array(userRoleSchema),
  requiresFeeClearance: z.boolean(),
})

export const libraryResourceSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  author: z.string().nullable(),
  publisher: z.string().nullable(),
  isbn: z.string().nullable(),
  type: resourceTypeSchema,
  description: z.string().nullable(),
  subjectTags: z.array(z.string()),
  publicationYear: z.number().int().nullable(),
  language: z.string(),
  isPublished: z.boolean(),
  downloadCount: z.number().int().nonnegative(),
  viewCount: z.number().int().nonnegative(),
  files: z.array(libraryFileSchema),
  access: libraryAccessRuleSchema,
  collectionIds: z.array(uuidSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const libraryCatalogueItemSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  author: z.string().nullable(),
  publisher: z.string().nullable(),
  type: resourceTypeSchema,
  description: z.string().nullable(),
  subjectTags: z.array(z.string()),
  publicationYear: z.number().int().nullable(),
  language: z.string(),
  files: z.array(libraryFileSchema),
})

export const libraryCollectionSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  resourceCount: z.number().int().nonnegative(),
  updatedAt: isoDateTimeSchema,
})

export const libraryCollectionDetailSchema = libraryCollectionSchema.extend({
  resources: z.array(libraryResourceSchema),
})

export const libraryRequestSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  author: z.string().nullable(),
  reason: z.string().nullable(),
  status: z.enum(LIBRARY_REQUEST_STATUSES),
  requesterName: z.string(),
  requesterRole: userRoleSchema,
  fulfilledResourceId: uuidSchema.nullable(),
  createdAt: isoDateTimeSchema,
  reviewedAt: isoDateTimeSchema.nullable(),
})

export const librarianProfileSchema = z.object({
  userId: uuidSchema,
  fullName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  institutionName: z.string(),
  institutionShortName: z.string(),
  unreadCount: z.number().int().nonnegative(),
})

export const librarianDashboardSchema = z.object({
  profile: librarianProfileSchema,
  totalResources: z.number().int().nonnegative(),
  publishedResources: z.number().int().nonnegative(),
  pendingRequests: z.number().int().nonnegative(),
  downloadsToday: z.number().int().nonnegative(),
  recentResources: z.array(libraryResourceSchema),
  pendingRequestRows: z.array(libraryRequestSchema),
})

export const librarianNotificationSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  category: z.string(),
  actionUrl: z.string().nullable(),
  readAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})

export const libraryAnalyticsSchema = z.object({
  totalResources: z.number().int().nonnegative(),
  publishedResources: z.number().int().nonnegative(),
  totalDownloads: z.number().int().nonnegative(),
  totalViews: z.number().int().nonnegative(),
  pendingRequests: z.number().int().nonnegative(),
  byType: z.array(z.object({ type: resourceTypeSchema, count: z.number().int().nonnegative() })),
  topResources: z.array(
    z.object({
      id: uuidSchema,
      title: z.string(),
      type: resourceTypeSchema,
      downloadCount: z.number().int().nonnegative(),
      viewCount: z.number().int().nonnegative(),
    }),
  ),
  daily: z.array(
    z.object({
      date: z.string(),
      downloads: z.number().int().nonnegative(),
      views: z.number().int().nonnegative(),
    }),
  ),
})

export const libraryAccessOptionsSchema = z.object({
  programmes: z.array(z.object({ id: uuidSchema, code: z.string(), name: z.string() })),
  departments: z.array(z.object({ id: uuidSchema, code: z.string(), name: z.string() })),
})

export const createLibraryResourceRequestSchema = z.object({
  title: z.string().trim().min(1).max(300),
  author: optionalText(300),
  publisher: optionalText(300),
  isbn: optionalText(20),
  type: resourceTypeSchema,
  description: optionalText(4000),
  subjectTags: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  publicationYear: z.number().int().min(1000).max(2100).nullable().optional(),
  language: z.string().trim().min(2).max(12).optional(),
  publish: z.boolean().optional(),
})

export const updateLibraryResourceRequestSchema = createLibraryResourceRequestSchema
  .partial()
  .extend({
    isPublished: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update.' })

export const reserveLibraryUploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120).refine((value) => LIBRARY_RESOURCE_MIME_TYPES.has(value), {
    message: 'Upload a PDF, Word, EPUB, office, text or video file.',
  }),
  fileSizeBytes: z.number().int().positive().max(LIBRARY_RESOURCE_MAX_BYTES),
})

export const attachLibraryFileRequestSchema = z.object({
  fileKey: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120).refine((value) => LIBRARY_RESOURCE_MIME_TYPES.has(value), {
    message: 'Upload a PDF, Word, EPUB, office, text or video file.',
  }),
  fileSizeBytes: z.number().int().positive().max(LIBRARY_RESOURCE_MAX_BYTES),
  isPrimary: z.boolean().optional(),
})

export const describeLibraryResourceRequestSchema = z.object({
  title: z.string().trim().max(300).optional(),
  fileKey: z.string().trim().max(500).optional(),
  fileName: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(120).optional(),
})

export const updateLibraryAccessRequestSchema = libraryAccessRuleSchema

export const createLibraryCollectionRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  isPublic: z.boolean().optional(),
})

export const updateLibraryCollectionRequestSchema = createLibraryCollectionRequestSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Nothing to update.' },
)

export const addCollectionItemRequestSchema = z.object({
  resourceId: uuidSchema,
})

export const createLibraryRequestSchema = z.object({
  title: z.string().trim().min(1).max(300),
  author: optionalText(300),
  reason: optionalText(2000),
})

export const fulfilLibraryRequestSchema = z.object({
  resourceId: uuidSchema.optional(),
})

export const declineLibraryRequestSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
})

export type LibraryFile = z.infer<typeof libraryFileSchema>
export type LibraryAccessRule = z.infer<typeof libraryAccessRuleSchema>
export type LibraryResource = z.infer<typeof libraryResourceSchema>
export type LibraryCatalogueItem = z.infer<typeof libraryCatalogueItemSchema>
export type LibraryCollection = z.infer<typeof libraryCollectionSchema>
export type LibraryCollectionDetail = z.infer<typeof libraryCollectionDetailSchema>
export type LibraryRequest = z.infer<typeof libraryRequestSchema>
export type LibrarianProfile = z.infer<typeof librarianProfileSchema>
export type LibrarianDashboard = z.infer<typeof librarianDashboardSchema>
export type LibrarianNotification = z.infer<typeof librarianNotificationSchema>
export type LibraryAnalytics = z.infer<typeof libraryAnalyticsSchema>
export type LibraryAccessOptions = z.infer<typeof libraryAccessOptionsSchema>
export type CreateLibraryResourceRequest = z.infer<typeof createLibraryResourceRequestSchema>
export type UpdateLibraryResourceRequest = z.infer<typeof updateLibraryResourceRequestSchema>
export type ReserveLibraryUploadRequest = z.infer<typeof reserveLibraryUploadRequestSchema>
export type AttachLibraryFileRequest = z.infer<typeof attachLibraryFileRequestSchema>
export type DescribeLibraryResourceRequest = z.infer<typeof describeLibraryResourceRequestSchema>
export type UpdateLibraryAccessRequest = z.infer<typeof updateLibraryAccessRequestSchema>
export type CreateLibraryCollectionRequest = z.infer<typeof createLibraryCollectionRequestSchema>
export type UpdateLibraryCollectionRequest = z.infer<typeof updateLibraryCollectionRequestSchema>
export type CreateLibraryRequest = z.infer<typeof createLibraryRequestSchema>
export type FulfilLibraryRequest = z.infer<typeof fulfilLibraryRequestSchema>
export type DeclineLibraryRequest = z.infer<typeof declineLibraryRequestSchema>

/** @deprecated Empty arrays mean no restriction. Kept so older imports compile. */
export const accessScopeSchema = z.object({
  programmes: z.array(z.string().trim()),
  departments: z.array(z.string().trim()),
  yearGroups: z.array(z.number().int().min(1).max(8)),
})
export type AccessScope = z.infer<typeof accessScopeSchema>
