import '../../config/load-dotenv'
import { eq } from 'drizzle-orm'
import type { UserRole } from '@stackedu/shared'
import { env } from '../../config/env'
import { createLogger } from '../../lib/logger'
import { createUser } from '../../services/users'
import { closeAllConnections, getInstitutionDb, getPlatformDb } from '../connection'
import { migratePlatform } from '../migrate'
import { provisionInstitution } from '../provision'
import { institutions, userDirectory } from '../platform/schema'
import { departments, faculties, programmes } from '../institution/schema/academic'
import { students } from '../institution/schema/students'
import { seedStudentPortal } from './seed-student-portal'
import { seedAcademicPortal } from './seed-academic-portal'
import { seedInstitutionDefaults } from '../seed-defaults'

/**
 * Creates the institution, its academic structure, and one account per role.
 *
 * There are no sample students, applications, results or payments here on
 * purpose: the system starts empty and fills up through the application
 * itself. The faculty, department and programmes are different — an
 * institution cannot accept an application without something to apply to, so
 * they are setup rather than sample data.
 */

const INSTITUTION = {
  name: 'StackForgeAI University',
  slug: 'sfu',
  shortName: 'SFU',
  contactEmail: 'registrar@sfu.ac.rw',
  website: 'https://stackedu.rw',
} as const

const FACULTY = { code: 'FST', name: 'Faculty of Science and Technology' } as const
const DEPARTMENT = { code: 'DCS', name: 'Department of Computing' } as const

const PROGRAMMES = [
  { code: 'BSC-CS', name: 'Computer Science', level: 'Bachelor', durationYears: 4, credits: 480 },
  {
    code: 'BSC-IT',
    name: 'Information Technology',
    level: 'Bachelor',
    durationYears: 4,
    credits: 480,
  },
  { code: 'BSC-MAT', name: 'Mathematics', level: 'Bachelor', durationYears: 3, credits: 360 },
  {
    code: 'BBA',
    name: 'Business Administration',
    level: 'Bachelor',
    durationYears: 4,
    credits: 480,
  },
] as const

/** Issued when a student is admitted — also works as a sign-in identifier. */
const STUDENT_NUMBER = 'SFU-2026-0001'

const ACCOUNTS: Array<{
  email: string
  fullName: string
  role: UserRole
  password: string
  alternateIdentifier?: string
}> = [
  {
    email: 'student@sfu.ac.rw',
    fullName: 'Jean-Paul Mugisha',
    role: 'Student',
    password: 'Student#2026',
    alternateIdentifier: STUDENT_NUMBER,
  },
  {
    email: 'lecturer@sfu.ac.rw',
    fullName: 'Dr. Amina Uwase',
    role: 'Lecturer',
    password: 'Lecturer#2026',
  },
  {
    email: 'bursar@sfu.ac.rw',
    fullName: 'Marie-Claire Ingabire',
    role: 'Bursar',
    password: 'Bursar#2026',
  },
  {
    email: 'academic@sfu.ac.rw',
    fullName: 'Dr. Emmanuel Habimana',
    role: 'AcademicAdmin',
    password: 'Academic#2026',
  },
  {
    email: 'librarian@sfu.ac.rw',
    fullName: 'Grace Umutoni',
    role: 'Librarian',
    password: 'Librarian#2026',
  },
  {
    email: 'ict@sfu.ac.rw',
    fullName: 'Eric Nshimiyimana',
    role: 'ICTManager',
    password: 'ICT#2026',
  },
]

/** Creates the faculty, department and programmes an applicant can choose. */
async function seedAcademicStructure(institutionId: string): Promise<void> {
  const db = await getInstitutionDb(institutionId)

  const [faculty] = await db
    .insert(faculties)
    .values({ code: FACULTY.code, name: FACULTY.name })
    .onConflictDoNothing({ target: faculties.code })
    .returning({ id: faculties.id })

  const facultyId =
    faculty?.id ??
    (
      await db
        .select({ id: faculties.id })
        .from(faculties)
        .where(eq(faculties.code, FACULTY.code))
        .limit(1)
    )[0]!.id

  const [department] = await db
    .insert(departments)
    .values({ facultyId, code: DEPARTMENT.code, name: DEPARTMENT.name })
    .onConflictDoNothing({ target: departments.code })
    .returning({ id: departments.id })

  const departmentId =
    department?.id ??
    (
      await db
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.code, DEPARTMENT.code))
        .limit(1)
    )[0]!.id

  for (const programme of PROGRAMMES) {
    await db
      .insert(programmes)
      .values({
        departmentId,
        code: programme.code,
        name: programme.name,
        level: programme.level,
        durationYears: programme.durationYears,
        totalCreditsRequired: programme.credits,
      })
      .onConflictDoNothing({ target: programmes.code })
  }

  process.stdout.write(`Academic structure ready — ${PROGRAMMES.length} programmes\n`)
}

/**
 * Links the seeded student account to a registration number so they can sign
 * in with either their email or that number — the same choice a real admitted
 * student will have.
 */
async function ensureStudentRecord(institutionId: string, userId: string): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const platform = getPlatformDb()

  await platform
    .update(userDirectory)
    .set({ alternateIdentifier: STUDENT_NUMBER })
    .where(eq(userDirectory.institutionUserId, userId))

  const [existing] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1)

  if (existing) return

  const [programme] = await db
    .select({ id: programmes.id })
    .from(programmes)
    .where(eq(programmes.code, 'BSC-CS'))
    .limit(1)

  if (!programme) {
    process.stderr.write('Could not attach a student record — Computer Science is missing.\n')
    return
  }

  await db.insert(students).values({
    userId,
    studentNumber: STUDENT_NUMBER,
    programmeId: programme.id,
    yearOfStudy: 1,
    enrolmentStatus: 'Active',
  })
}

async function main() {
  const logger = createLogger(env().LOG_LEVEL, { command: 'db:seed' })

  if (env().NODE_ENV === 'production') {
    process.stderr.write('Demo seed data stays local. Refusing to seed in production.\n')
    process.exit(1)
  }

  const platform = await migratePlatform(logger)
  if (!platform.succeeded) {
    process.stderr.write('Could not migrate the platform database.\n')
    await closeAllConnections()
    process.exit(1)
  }

  const db = getPlatformDb()

  let [institution] = await db
    .select({ id: institutions.id })
    .from(institutions)
    .where(eq(institutions.slug, INSTITUTION.slug))
    .limit(1)

  if (!institution) {
    const result = await provisionInstitution({ ...INSTITUTION }, { logger })
    institution = { id: result.institutionId }
    process.stdout.write(`Created institution ${result.slug} → ${result.databaseName}\n`)
  } else {
    process.stdout.write(`Institution ${INSTITUTION.slug} already present\n`)
  }

  await db
    .update(institutions)
    .set({ website: INSTITUTION.website })
    .where(eq(institutions.id, institution.id))

  await seedAcademicStructure(institution.id)
  await seedInstitutionDefaults(await getInstitutionDb(institution.id))

  process.stdout.write('\nAccounts\n')

  let academicAdminUserId: string | undefined
  let lecturerUserId: string | undefined

  for (const account of ACCOUNTS) {
    const [existing] = await db
      .select({
        id: userDirectory.id,
        institutionUserId: userDirectory.institutionUserId,
      })
      .from(userDirectory)
      .where(eq(userDirectory.email, account.email))
      .limit(1)

    let userId = existing?.institutionUserId

    if (!existing) {
      const created = await createUser({
        institutionId: institution.id,
        email: account.email,
        fullName: account.fullName,
        role: account.role,
        password: account.password,
        alternateIdentifier: account.alternateIdentifier,
      })
      userId = created.id
      process.stdout.write(
        `  ${account.role.padEnd(14)} ${account.email.padEnd(22)} ${account.password}\n`,
      )
    } else {
      process.stdout.write(`  ${account.role.padEnd(14)} ${account.email}  (already exists)\n`)
    }

    if (account.role === 'Student' && userId) {
      await ensureStudentRecord(institution.id, userId)
      await seedStudentPortal(institution.id, userId)
      process.stdout.write(`                 student number     ${STUDENT_NUMBER}\n`)
    }

    if (account.role === 'AcademicAdmin' && userId) {
      academicAdminUserId = userId
    }
    if (account.role === 'Lecturer' && userId) {
      lecturerUserId = userId
    }
  }

  if (academicAdminUserId && lecturerUserId) {
    await seedAcademicPortal(institution.id, academicAdminUserId, lecturerUserId)
  }

  await closeAllConnections()
  process.exit(0)
}

void main()
