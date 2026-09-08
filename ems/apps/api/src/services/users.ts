import { eq } from 'drizzle-orm'
import type { UserRole } from '@stackedu/shared'
import { formatDisplayName } from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { userDirectory } from '../db/platform/schema'
import { users } from '../db/institution/schema'
import { conflict } from '../lib/errors'
import { hashPassword } from '../lib/password'

export interface CreateUserInput {
  institutionId: string
  email: string
  fullName: string
  role: UserRole
  password: string
  phone?: string
  /** Application reference or registration number they may sign in with. */
  alternateIdentifier?: string
}

export interface CreatedUser {
  id: string
  email: string
  fullName: string
  role: UserRole
}

/**
 * Creates an account and registers it in the platform directory.
 *
 * Both steps are required: the row in the institution database holds the
 * account, and the directory entry is what lets a login find that database
 * from an email address alone. A user that exists in only one of the two is
 * unusable, so if the directory write fails the account row is removed again.
 *
 * The two writes cannot share a transaction because they are separate
 * databases, which is the trade-off that comes with keeping each institution's
 * data physically apart.
 */
export async function createUser(input: CreateUserInput): Promise<CreatedUser> {
  const email = input.email.trim().toLowerCase()
  const db = await getInstitutionDb(input.institutionId)
  const platform = getPlatformDb()

  const [taken] = await platform
    .select({ id: userDirectory.id })
    .from(userDirectory)
    .where(eq(userDirectory.email, email))
    .limit(1)

  if (taken) throw conflict('An account with that email address already exists.')

  const passwordHash = await hashPassword(input.password)

  const [created] = await db
    .insert(users)
    .values({
      email,
      fullName: formatDisplayName(input.fullName.trim()),
      role: input.role,
      passwordHash,
      phone: input.phone ?? null,
    })
    .returning({ id: users.id, email: users.email, fullName: users.fullName, role: users.role })

  if (!created) throw conflict('The account could not be created.')

  try {
    await platform.insert(userDirectory).values({
      email,
      institutionId: input.institutionId,
      institutionUserId: created.id,
      role: input.role,
      alternateIdentifier: input.alternateIdentifier?.toUpperCase() ?? null,
    })
  } catch (error) {
    await db.delete(users).where(eq(users.id, created.id))
    throw error
  }

  return created
}
