import { z } from 'zod'
import { userRoleSchema } from '../enums'
import { emailSchema, isoDateSchema, isoDateTimeSchema, phoneSchema, uuidSchema } from '../primitives'

export const accountProfileSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  fullName: z.string(),
  firstName: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  twoFactorEnabled: z.boolean(),
  emailVerifiedAt: isoDateTimeSchema.nullable(),
  phoneVerifiedAt: isoDateTimeSchema.nullable(),
  institutionName: z.string(),
  institutionShortName: z.string(),
  studentNumber: z.string().nullable(),
  programmeName: z.string().nullable(),
  yearOfStudy: z.number().int().nullable(),
  facultyName: z.string().nullable(),
  admittedAt: isoDateSchema.nullable(),
})

const phoneInputSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine((value) => value === '' || phoneSchema.safeParse(value).success, {
    message: 'Phone number must be in international format, e.g. +250788123456.',
  })
  .transform((value) => (value === '' ? null : value))

export const updateAccountProfileRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(200, 'Full name is too long.'),
  email: emailSchema,
  phone: z.union([z.null(), phoneInputSchema]).optional(),
})

export const requestPhoneVerificationRequestSchema = z.object({
  phone: phoneSchema,
})

export const verifyPhoneUpdateRequestSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit verification code.'),
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Enter your current password.')
    .max(200, 'Current password is too long.'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters.')
    .max(200, 'New password is too long.'),
})

export const updateAccountSecurityRequestSchema = z.object({
  twoFactorEnabled: z.boolean(),
})

export const accountNotificationSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  category: z.string(),
  actionUrl: z.string().nullable(),
  readAt: isoDateSchema.nullable(),
  createdAt: isoDateSchema,
})

export const accountNotificationsResponseSchema = z.object({
  notifications: z.array(accountNotificationSchema),
})

/** Cheap stamps the signed-in app polls so open screens update without a reload. */
export const accountLiveCursorSchema = z.object({
  notificationsAt: z.string().nullable(),
  admissionsAt: z.string().nullable(),
  timetableAt: z.string().nullable(),
})

export type AccountLiveCursor = z.infer<typeof accountLiveCursorSchema>

export const twoFactorSetupResponseSchema = z.object({
  secret: z.string(),
  otpauthUrl: z.string(),
  qrCodeDataUrl: z.string(),
})

const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app.')

export const enableTwoFactorRequestSchema = z.object({
  code: totpCodeSchema,
  secret: z.string().min(16),
})

export const disableTwoFactorRequestSchema = z.object({
  code: totpCodeSchema,
})

export const verifyTwoFactorRequestSchema = z.object({
  code: totpCodeSchema,
})

export const notificationPreferenceItemSchema = z.object({
  key: z.string().trim().min(1).max(64).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),
  email: z.boolean(),
  sms: z.boolean(),
  inapp: z.boolean(),
})

export const updateNotificationPreferencesRequestSchema = z.object({
  preferences: z.array(notificationPreferenceItemSchema).min(1).max(20),
})

export const notificationPreferencesResponseSchema = z.object({
  preferences: z.array(notificationPreferenceItemSchema),
})

export type AccountProfile = z.infer<typeof accountProfileSchema>
export type UpdateAccountProfileRequest = z.infer<typeof updateAccountProfileRequestSchema>
export type RequestPhoneVerificationRequest = z.infer<typeof requestPhoneVerificationRequestSchema>
export type VerifyPhoneUpdateRequest = z.infer<typeof verifyPhoneUpdateRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
export type UpdateAccountSecurityRequest = z.infer<typeof updateAccountSecurityRequestSchema>
export type AccountNotification = z.infer<typeof accountNotificationSchema>
export type TwoFactorSetupResponse = z.infer<typeof twoFactorSetupResponseSchema>
export type EnableTwoFactorRequest = z.infer<typeof enableTwoFactorRequestSchema>
export type DisableTwoFactorRequest = z.infer<typeof disableTwoFactorRequestSchema>
export type VerifyTwoFactorRequest = z.infer<typeof verifyTwoFactorRequestSchema>
export type NotificationPreferenceItem = z.infer<typeof notificationPreferenceItemSchema>
export type UpdateNotificationPreferencesRequest = z.infer<typeof updateNotificationPreferencesRequestSchema>
export type NotificationPreferencesResponse = z.infer<typeof notificationPreferencesResponseSchema>
