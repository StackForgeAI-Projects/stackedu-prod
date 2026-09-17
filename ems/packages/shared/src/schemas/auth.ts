import { z } from 'zod'
import { userRoleSchema } from '../enums'
import { emailSchema, isoDateTimeSchema, slugSchema, uuidSchema } from '../primitives'

/**
 * Authentication contracts.
 *
 * The account type is never sent by the browser. The server works out who the
 * user is from the credentials alone, because a client-supplied role is a
 * claim we would have to verify anyway, and trusting it would let anyone ask
 * for a portal they have no right to.
 */

export const loginRequestSchema = z.object({
  /**
   * An email address, or the reference the institution gave them: an
   * application ID while applying, a registration number once admitted. One
   * field rather than three, because people do not reliably know which of
   * their identifiers is which.
   */
  identifier: z.string().min(1, 'Enter your email or ID.').max(320, 'Email or ID is too long.'),
  password: z.string().min(1, 'Enter your password.').max(200, 'Password is too long.'),
  /** Extends the session beyond the working day on a trusted device. */
  rememberMe: z.boolean().optional().default(false),
})

/**
 * Why the session ended. The browser is the only place that can tell a
 * deliberate sign-out from one the idle timer triggered, and the audit log
 * needs to show the difference.
 */
export const logoutRequestSchema = z.object({
  reason: z.enum(['manual', 'inactivity']).optional().default('manual'),
})

export const sessionInstitutionSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  shortName: z.string(),
  slug: slugSchema,
})

export const sessionUserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  fullName: z.string(),
  role: userRoleSchema,
  institution: sessionInstitutionSchema,
  /** Null until the applicant confirms the code sent to their email. */
  emailVerifiedAt: isoDateTimeSchema.nullable(),
})

export const sessionResponseSchema = z.object({
  user: sessionUserSchema,
})

export const twoFactorChallengeResponseSchema = z.object({
  requiresTwoFactor: z.literal(true),
})

export const loginResponseSchema = z.union([
  sessionResponseSchema,
  twoFactorChallengeResponseSchema,
])

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LogoutReason = z.infer<typeof logoutRequestSchema>['reason']
export type SessionInstitution = z.infer<typeof sessionInstitutionSchema>
export type SessionUser = z.infer<typeof sessionUserSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
export type TwoFactorChallengeResponse = z.infer<typeof twoFactorChallengeResponseSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
