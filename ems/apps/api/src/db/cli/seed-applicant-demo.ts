import '../../config/load-dotenv'
import { eq } from 'drizzle-orm'
import { env } from '../../config/env'
import { closeAllConnections, getInstitutionDb, getPlatformDb } from '../connection'
import {
  applicationPayments,
  applications,
} from '../institution/schema/admissions'
import { programmes } from '../institution/schema/academic'
import { users } from '../institution/schema/people'
import { institutions, userDirectory } from '../platform/schema'
import { createUser } from '../../services/users'

/**
 * Local-only demo applicant for admissions testing.
 *
 *   bun run db:seed-applicant-demo
 *
 * Refuses to run in production. Does not run automatically on deploy.
 */
const DEMO = {
  email: 'applicant.demo@sfu.ac.rw',
  password: 'Applicant#2026',
  fullName: 'Emmanuel Mogola',
  reference: 'APP-DEMO-48238',
  phone: '+250788123456',
  nationalId: '1199880012345678',
  dateOfBirth: '2004-06-15',
  gender: 'Male' as const,
  previousInstitution: 'Lycee de Kigali',
  previousQualification: 'Advanced Level (Math, Physics, CS)',
} as const

async function main() {
  if (env().NODE_ENV === 'production') {
    process.stderr.write('Demo seed data stays local. Refusing to seed demo applicants in production.\n')
    process.exit(1)
  }

  const platform = getPlatformDb()
  const [institution] = await platform
    .select({ id: institutions.id, slug: institutions.slug })
    .from(institutions)
    .where(eq(institutions.slug, 'sfu'))
    .limit(1)

  if (!institution) {
    process.stderr.write('Institution "sfu" not found. Run bun run db:seed first.\n')
    await closeAllConnections()
    process.exit(1)
  }

  const db = await getInstitutionDb(institution.id)

  const [existingApp] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.reference, DEMO.reference))
    .limit(1)

  if (existingApp) {
    process.stdout.write(
      `\nDemo applicant already exists.\n\n` +
        `  Sign in (Track):  ${DEMO.email}  or  ${DEMO.reference}\n` +
        `  Password:         ${DEMO.password}\n\n` +
        `  Academic inbox:   /academic/applications\n\n`,
    )
    await closeAllConnections()
    process.exit(0)
  }

  const [programme] = await db
    .select({ id: programmes.id, name: programmes.name })
    .from(programmes)
    .where(eq(programmes.code, 'BSC-CS'))
    .limit(1)

  if (!programme) {
    process.stderr.write('Programme BSC-CS not found. Run bun run db:seed first.\n')
    await closeAllConnections()
    process.exit(1)
  }

  let accountId: string

  const [existingUser] = await platform
    .select({ institutionUserId: userDirectory.institutionUserId })
    .from(userDirectory)
    .where(eq(userDirectory.email, DEMO.email))
    .limit(1)

  if (existingUser) {
    accountId = existingUser.institutionUserId
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date().toISOString() })
      .where(eq(users.id, accountId))
  } else {
    const account = await createUser({
      institutionId: institution.id,
      email: DEMO.email,
      fullName: DEMO.fullName,
      role: 'Applicant',
      password: DEMO.password,
      phone: DEMO.phone,
      alternateIdentifier: DEMO.reference,
    })
    accountId = account.id

    await db
      .update(users)
      .set({ emailVerifiedAt: new Date().toISOString() })
      .where(eq(users.id, accountId))
  }

  const verifiedAt = new Date().toISOString()

  const [application] = await db
    .insert(applications)
    .values({
      reference: DEMO.reference,
      applicantUserId: accountId,
      programmeId: programme.id,
      firstName: 'Emmanuel',
      lastName: 'Mogola',
      email: DEMO.email,
      phone: DEMO.phone,
      status: 'Draft',
    })
    .returning({ id: applications.id })

  await db
    .update(applications)
    .set({
      dateOfBirth: DEMO.dateOfBirth,
      gender: DEMO.gender,
      nationalId: DEMO.nationalId,
      previousInstitution: DEMO.previousInstitution,
      previousQualification: DEMO.previousQualification,
      details: {
        guardianName: 'Grace Mogola',
        guardianPhone: '+250788000111',
        guardianRelationship: 'Parent',
        statement: 'I am passionate about computer science and software engineering.',
        emergencyName: 'Grace Mogola',
        emergencyPhone: '+250788000111',
        declared: true,
      },
      status: 'Submitted',
      submittedAt: verifiedAt,
    })
    .where(eq(applications.id, application!.id))

  await db.insert(applicationPayments).values({
    applicationId: application!.id,
    reference: `PAY-${DEMO.reference}-4823`,
    amount: env().APPLICATION_FEE_RWF ?? 10_000,
    method: 'MoMo',
    status: 'Completed',
    paidAt: verifiedAt,
  })

  process.stdout.write(
    `\nDemo applicant ready (local only).\n\n` +
      `  Applicant sign-in\n` +
      `    Email or ID:  ${DEMO.email}  /  ${DEMO.reference}\n` +
      `    Password:   ${DEMO.password}\n` +
      `    Track:      http://localhost:3000/apply/track\n\n` +
      `  Academic admin\n` +
      `    Inbox:      http://localhost:3000/academic/applications\n` +
      `    Login:      academic@sfu.ac.rw  (from db:seed)\n\n`,
  )

  await closeAllConnections()
  process.exit(0)
}

void main().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  await closeAllConnections()
  process.exit(1)
})
