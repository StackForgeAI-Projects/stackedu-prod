import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import postgres from 'postgres'
import { userRoleSchema, paymentStatusSchema, gradeSchema } from '@stackedu/shared/enums'
import { provisionInstitution } from '../src/db/provision'
import { getInstitutionDb } from '../src/db/connection'
import { students } from '../src/db/institution/schema/students'
import { payments } from '../src/db/institution/schema/finance'
import { users } from '../src/db/institution/schema/people'
import { programmes, departments, faculties } from '../src/db/institution/schema/academic'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

/**
 * Contract checks between the shared package, the database and the money rules.
 *
 * The shared Zod enums are meant to be the single source of truth for the whole
 * system. If the generated PostgreSQL types ever drift from them, these fail.
 */
describe('schema contracts', () => {
  let platform: TestPlatform
  let institutionId: string
  let connectionUrl: string

  beforeAll(async () => {
    platform = await createTestPlatform()
    const result = await provisionInstitution({
      name: 'Contract University',
      slug: uniqueSlug('contract'),
      shortName: 'CU',
      contactEmail: 'admin@contract.test',
    })
    institutionId = result.institutionId
    connectionUrl = result.connectionUrl
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  async function enumValues(typeName: string): Promise<string[]> {
    const sql = postgres(connectionUrl, { max: 1, onnotice: () => {} })
    try {
      const rows = await sql<{ label: string }[]>`
        SELECT e.enumlabel AS label
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = ${typeName}
        ORDER BY e.enumsortorder
      `
      return rows.map((row) => row.label)
    } finally {
      await sql.end({ timeout: 5 })
    }
  }

  it('generates PostgreSQL enums that match the shared Zod enums exactly', async () => {
    expect(await enumValues('user_role')).toEqual([...userRoleSchema.options])
    expect(await enumValues('payment_status')).toEqual([...paymentStatusSchema.options])
    expect(await enumValues('grade')).toEqual([...gradeSchema.options])
    expect(await enumValues('question_type')).toEqual(['MultipleChoice', 'TrueFalse', 'ShortAnswer'])
  })

  it('rejects a role the shared enum does not define', async () => {
    const sql = postgres(connectionUrl, { max: 1, onnotice: () => {} })
    try {
      await expect(
        sql`INSERT INTO users (email, full_name, role) VALUES ('x@y.test', 'X', 'Chancellor')`,
      ).rejects.toThrow()
    } finally {
      await sql.end({ timeout: 5 })
    }
  })

  it('stores fee amounts larger than a 32-bit integer can hold', async () => {
    const db = await getInstitutionDb(institutionId)

    const [faculty] = await db
      .insert(faculties)
      .values({ code: 'SCI', name: 'Science' })
      .returning({ id: faculties.id })
    const [department] = await db
      .insert(departments)
      .values({ facultyId: faculty!.id, code: 'CS', name: 'Computer Science' })
      .returning({ id: departments.id })
    const [programme] = await db
      .insert(programmes)
      .values({
        departmentId: department!.id,
        code: 'BSC-CS',
        name: 'BSc Computer Science',
        level: 'Bachelor',
        durationYears: 4,
        totalCreditsRequired: 480,
      })
      .returning({ id: programmes.id })
    const [user] = await db
      .insert(users)
      .values({ email: 'big@spender.test', fullName: 'Big Spender', role: 'Student' })
      .returning({ id: users.id })
    const [student] = await db
      .insert(students)
      .values({
        userId: user!.id,
        studentNumber: 'STU-2026-0001',
        programmeId: programme!.id,
      })
      .returning({ id: students.id })

    // An institution's annual fee income in Rwandan Francs comfortably exceeds
    // the 2.1 billion ceiling of a 32-bit integer, which is why money is bigint.
    const largeAmount = 5_000_000_000

    const [payment] = await db
      .insert(payments)
      .values({
        reference: 'PAY-BIG-0001',
        studentId: student!.id,
        amount: largeAmount,
        method: 'BankTransfer',
        status: 'Completed',
      })
      .returning({ amount: payments.amount })

    expect(payment?.amount).toBe(largeAmount)
  })

  it('enforces referential integrity between students and programmes', async () => {
    const db = await getInstitutionDb(institutionId)

    const [user] = await db
      .insert(users)
      .values({ email: 'orphan@test.test', fullName: 'Orphan', role: 'Student' })
      .returning({ id: users.id })

    await expect(
      db.insert(students).values({
        userId: user!.id,
        studentNumber: 'STU-2026-9999',
        programmeId: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toThrow()
  })
})
