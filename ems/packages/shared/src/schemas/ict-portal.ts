import { z } from 'zod'
import { userRoleSchema } from '../enums'
import { attendancePolicySchema } from '../attendance-policy'
import { recordingRetentionSchema } from '../recording-retention'
import { paymentPolicySchema } from '../payment-policy'
import { aiProviderSchema, ictAiSettingsSchema } from '../ai-provider'
import { emailSchema, isoDateTimeSchema, phoneSchema, uuidSchema } from '../primitives'

export const ictStaffRoleSchema = z.enum([
  'Student',
  'Lecturer',
  'Bursar',
  'AcademicAdmin',
  'Librarian',
  'ICTManager',
])

export const ictProfileSchema = z.object({
  userId: uuidSchema,
  fullName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  institutionName: z.string(),
  institutionShortName: z.string(),
  unreadCount: z.number().int().nonnegative(),
})

export const ictDashboardSchema = z.object({
  profile: ictProfileSchema,
  totalUsers: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  activeSessions: z.number().int().nonnegative(),
  pendingRevocations: z.number().int().nonnegative(),
  usersByRole: z.array(z.object({ role: userRoleSchema, count: z.number().int().nonnegative() })),
  recentAudit: z.array(
    z.object({
      id: uuidSchema,
      action: z.string(),
      summary: z.string(),
      actorEmail: z.string().nullable(),
      createdAt: isoDateTimeSchema,
    }),
  ),
})

export const ictAnalyticsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  activeSessions: z.number().int().nonnegative(),
  pendingRevocations: z.number().int().nonnegative(),
  usersByRole: z.array(z.object({ role: userRoleSchema, count: z.number().int().nonnegative() })),
  loginsLast7Days: z.number().int().nonnegative(),
  newUsersLast30Days: z.number().int().nonnegative(),
  auditEventsLast30Days: z.number().int().nonnegative(),
  integrationsEnabled: z.number().int().nonnegative(),
  integrationsTotal: z.number().int().nonnegative(),
})

export const ictUserRowSchema = z.object({
  id: uuidSchema,
  email: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  isActive: z.boolean(),
  lastLoginAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  studentNumber: z.string().nullable(),
})

export const ictUserDetailSchema = ictUserRowSchema.extend({
  deactivatedAt: isoDateTimeSchema.nullable(),
})

export const createIctUserRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: emailSchema,
  phone: phoneSchema.optional(),
  role: ictStaffRoleSchema,
  programmeId: uuidSchema.optional(),
  yearOfStudy: z.number().int().min(1).max(8).optional(),
})

export const updateIctUserRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  phone: phoneSchema.nullable().optional(),
  isActive: z.boolean().optional(),
})

export const revokeAccessRequestSchema = z.object({
  reason: z.string().trim().min(4).max(500),
})

export const ictRevocationSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  userName: z.string(),
  userEmail: z.string(),
  userRole: userRoleSchema,
  reason: z.string(),
  revokedByName: z.string().nullable(),
  effectiveAt: isoDateTimeSchema,
  restoredAt: isoDateTimeSchema.nullable(),
})

export const ictRoleSchema = z.object({
  key: userRoleSchema,
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  permissions: z.array(z.string()),
})

export const ictPermissionSchema = z.object({
  key: z.string(),
  module: z.string(),
  description: z.string().nullable(),
})

export const updateRolePermissionsRequestSchema = z.object({
  permissionKeys: z.array(z.string().trim().min(1).max(80)).max(80),
})

export const ictAuditRowSchema = z.object({
  id: uuidSchema,
  actorEmail: z.string().nullable(),
  actorRole: z.string().nullable(),
  action: z.string(),
  /** Stable plain-English name of the action, used for grouping and filtering. */
  actionLabel: z.string(),
  /** The full sentence shown in the Action column, including record detail. */
  summary: z.string(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  createdAt: isoDateTimeSchema,
})

export const ictAuditDetailSchema = ictAuditRowSchema.extend({
  changes: z.record(z.object({ from: z.unknown(), to: z.unknown() })).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  requestId: z.string().nullable(),
})

/**
 * The one colour the whole system is themed from, as `#RRGGBB`.
 *
 * `null` means the institution uses the StackEDU default palette.
 */
export const brandColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Choose a colour in #RRGGBB format.')

export const ictSettingsSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  contactEmail: z.string(),
  timezone: z.string(),
  locale: z.enum(['en', 'fr', 'rw']),
  slug: z.string(),
  website: z.string().nullable(),
  location: z.string().nullable(),
  logoUrl: z.string().nullable(),
  brandColor: z.string().nullable(),
  attendancePolicy: attendancePolicySchema,
  recordingRetention: recordingRetentionSchema,
  paymentPolicy: paymentPolicySchema,
  ai: ictAiSettingsSchema,
})

export const updateIctSettingsRequestSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  shortName: z.string().trim().min(2).max(20).optional(),
  contactEmail: emailSchema.optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  locale: z.enum(['en', 'fr', 'rw']).optional(),
  website: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  brandColor: brandColorSchema.nullable().optional(),
  attendancePolicy: attendancePolicySchema.partial().optional(),
  recordingRetention: recordingRetentionSchema.optional(),
  paymentPolicy: paymentPolicySchema.partial().optional(),
  aiProvider: aiProviderSchema.optional(),
  aiModel: z.string().trim().max(80).nullable().optional(),
  aiApiKey: z.string().trim().min(8).max(500).optional(),
})

export const publicInstitutionBrandingSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  slug: z.string(),
  website: z.string().nullable(),
  location: z.string().nullable(),
  logoUrl: z.string().nullable(),
  brandColor: z.string().nullable(),
})

export const integrationCategorySchema = z.enum(['payments', 'email', 'sms', 'classroom', 'ai'])

export const integrationFieldSourceSchema = z.enum(['env', 'saved'])

export const ictIntegrationFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  hint: z.string().optional(),
  secret: z.boolean(),
  configured: z.boolean(),
  source: integrationFieldSourceSchema.nullable(),
  value: z.string().nullable(),
})

export const ictIntegrationSchema = z.object({
  id: uuidSchema,
  provider: z.string(),
  displayName: z.string(),
  category: integrationCategorySchema,
  description: z.string(),
  docsUrl: z.string().nullable(),
  setupSteps: z.array(z.string()),
  isEnabled: z.boolean(),
  lastStatus: z.string().nullable(),
  lastCheckedAt: isoDateTimeSchema.nullable(),
  /** Set on a connection-check response: whether the vendor API accepted the keys. */
  checkOk: z.boolean().optional(),
  fields: z.array(ictIntegrationFieldSchema),
})

export const updateIntegrationRequestSchema = z
  .object({
    isEnabled: z.boolean().optional(),
    credentials: z.record(z.string().trim().max(500)).optional(),
  })
  .refine((value) => value.isEnabled !== undefined || (value.credentials && Object.keys(value.credentials).length > 0), {
    message: 'Turn the service on or off, or save at least one field.',
  })

export const announcementAudienceSchema = z.object({
  everyone: z.boolean().optional(),
  roles: z.array(userRoleSchema).max(10).optional(),
  includeEnrolledStudents: z.boolean().optional(),
  includeApplicants: z.boolean().optional(),
  departmentIds: z.array(uuidSchema).max(40).optional(),
  yearsOfStudy: z.array(z.number().int().min(1).max(8)).max(8).optional(),
  studentIds: z.array(uuidSchema).max(200).optional(),
  courseOfferingIds: z.array(uuidSchema).max(80).optional(),
})

export const ictAnnouncementSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  audienceRoles: z.array(z.string()),
  audienceLabel: z.string(),
  recipientCount: z.number().int().nonnegative().optional(),
  isPinned: z.boolean(),
  publishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})

export const previewAnnouncementRequestSchema = z.object({
  audience: announcementAudienceSchema.optional(),
  audienceRoles: z.array(z.string().trim().min(1).max(80)).max(80).optional(),
})

export const createAnnouncementRequestSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(8_000),
  audience: announcementAudienceSchema.optional(),
  audienceRoles: z.array(z.string().trim().min(1).max(80)).max(80).optional(),
  isPinned: z.boolean().optional(),
  publish: z.boolean().optional(),
})

export const ictAudienceOptionsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  enrolledStudentCount: z.number().int().nonnegative(),
  applicantCount: z.number().int().nonnegative(),
  roles: z.array(z.object({
    key: userRoleSchema,
    label: z.string(),
    userCount: z.number().int().nonnegative(),
  })),
  departments: z.array(z.object({
    id: uuidSchema,
    name: z.string(),
    studentCount: z.number().int().nonnegative(),
  })),
  years: z.array(z.object({
    year: z.number().int(),
    studentCount: z.number().int().nonnegative(),
  })),
})

export const announcementPreviewSchema = z.object({
  recipientCount: z.number().int().nonnegative(),
  sample: z.array(z.object({
    id: uuidSchema,
    fullName: z.string(),
    email: z.string(),
    role: userRoleSchema,
  })),
})

export const ictNotificationSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  category: z.string(),
  actionUrl: z.string().nullable(),
  readAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})

export const ictProgrammeOptionSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
})

export const ictCreatedUserSchema = z.object({
  user: ictUserRowSchema,
  temporaryPassword: z.string(),
})

export type IctProfile = z.infer<typeof ictProfileSchema>
export type IctDashboard = z.infer<typeof ictDashboardSchema>
export type IctAnalytics = z.infer<typeof ictAnalyticsSchema>
export type IctUserRow = z.infer<typeof ictUserRowSchema>
export type IctUserDetail = z.infer<typeof ictUserDetailSchema>
export type CreateIctUserRequest = z.infer<typeof createIctUserRequestSchema>
export type UpdateIctUserRequest = z.infer<typeof updateIctUserRequestSchema>
export type RevokeAccessRequest = z.infer<typeof revokeAccessRequestSchema>
export type IctRevocation = z.infer<typeof ictRevocationSchema>
export type IctRole = z.infer<typeof ictRoleSchema>
export type IctPermission = z.infer<typeof ictPermissionSchema>
export type UpdateRolePermissionsRequest = z.infer<typeof updateRolePermissionsRequestSchema>
export type IctAuditRow = z.infer<typeof ictAuditRowSchema>
export type IctAuditDetail = z.infer<typeof ictAuditDetailSchema>
export type IctSettings = z.infer<typeof ictSettingsSchema>
export type PublicInstitutionBranding = z.infer<typeof publicInstitutionBrandingSchema>
export type UpdateIctSettingsRequest = z.infer<typeof updateIctSettingsRequestSchema>
export type IctIntegration = z.infer<typeof ictIntegrationSchema>
export type IctIntegrationField = z.infer<typeof ictIntegrationFieldSchema>
export type UpdateIntegrationRequest = z.infer<typeof updateIntegrationRequestSchema>
export type AnnouncementAudience = z.infer<typeof announcementAudienceSchema>
export type IctAnnouncement = z.infer<typeof ictAnnouncementSchema>
export type CreateAnnouncementRequest = z.infer<typeof createAnnouncementRequestSchema>
export type PreviewAnnouncementRequest = z.infer<typeof previewAnnouncementRequestSchema>
export type IctAudienceOptions = z.infer<typeof ictAudienceOptionsSchema>
export type AnnouncementPreview = z.infer<typeof announcementPreviewSchema>
export type IctNotification = z.infer<typeof ictNotificationSchema>
export type IctProgrammeOption = z.infer<typeof ictProgrammeOptionSchema>
export type IctCreatedUser = z.infer<typeof ictCreatedUserSchema>
