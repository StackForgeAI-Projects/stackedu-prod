import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import {
  ATTENDANCE_POLICY_SETTING_KEY,
  attendancePolicySchema,
  DEFAULT_ATTENDANCE_POLICY,
} from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../src/db/connection'
import { deprovisionInstitution, provisionInstitution } from '../src/db/provision'
import { permissionsForRole } from '../src/db/seed-defaults'
import { institutionDatabases, institutions } from '../src/db/platform/schema'
import { adminConnectionUrl } from '../src/db/naming'
import { AppError } from '../src/lib/errors'
import { writeLocalUpload } from '../src/lib/storage'
import { readInstitutionSetting, upsertInstitutionSetting } from '../src/lib/institution-settings'
import {
  academicYears,
  courses,
  departments,
  faculties,
  programmes,
  semesters,
} from '../src/db/institution/schema/academic'
import { students } from '../src/db/institution/schema/students'
import {
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
} from '../src/db/institution/schema/teaching'
import {
  createLecturerMaterial,
  createLecturerModule,
  deleteLecturerAttendanceSession,
  deleteLecturerMaterial,
  getLecturerCourse,
  getLecturerMaterialDownloadUrl,
  listLecturerAttendance,
  reserveLecturerMaterialUpload,
  saveLecturerAttendance,
  updateLecturerMaterial,
} from '../src/services/lecturer'
import { createUser } from '../src/services/users'
import {
  createTestPlatform,
  TEST_SERVER_URL,
  uniqueSlug,
  type TestPlatform,
} from './helpers/test-database'

async function databaseExists(name: string): Promise<boolean> {
  const admin = postgres(adminConnectionUrl(TEST_SERVER_URL), { max: 1, onnotice: () => {} })
  try {
    const rows = await admin`SELECT 1 FROM pg_database WHERE datname = ${name}`
    return rows.length > 0
  } finally {
    await admin.end({ timeout: 5 })
  }
}

describe('institution provisioning', () => {
  let platform: TestPlatform

  beforeAll(async () => {
    platform = await createTestPlatform()
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('creates the database, applies the schema and marks the institution active', async () => {
    const slug = uniqueSlug('prov')
    const result = await provisionInstitution({
      name: 'Provisioning Test University',
      slug,
      shortName: 'PTU',
      contactEmail: 'admin@ptu.test',
    })

    expect(result.databaseName).toBe(`stackedu_inst_${slug}`)
    expect(await databaseExists(result.databaseName)).toBe(true)

    const [row] = await getPlatformDb()
      .select({ status: institutions.status })
      .from(institutions)
      .where(eq(institutions.id, result.institutionId))

    expect(row?.status).toBe('Active')
  })

  it('seeds the six roles with their default permissions', async () => {
    const result = await provisionInstitution({
      name: 'Seeded University',
      slug: uniqueSlug('seed'),
      shortName: 'SU',
      contactEmail: 'admin@su.test',
    })

    const db = await getInstitutionDb(result.institutionId)

    const bursar = await permissionsForRole(db, 'Bursar')
    const student = await permissionsForRole(db, 'Student')
    const lecturer = await permissionsForRole(db, 'Lecturer')

    expect(bursar).toContain('payments.record')
    expect(bursar).toContain('refunds.approve')

    expect(lecturer).toContain('attendance.record')
    expect(lecturer).toContain('grades.write')
    expect(lecturer).toContain('results.submit')
    expect(lecturer).toContain('timetable.write')
    expect(lecturer).not.toContain('results.publish')

    // A student must never be able to touch money or publish results.
    expect(student).not.toContain('payments.record')
    expect(student).not.toContain('results.publish')
    expect(student).toContain('library.read')
  })

  it('enables pgvector, which semantic library search depends on', async () => {
    const result = await provisionInstitution({
      name: 'Vector University',
      slug: uniqueSlug('vec'),
      shortName: 'VU',
      contactEmail: 'admin@vu.test',
    })

    const sql = postgres(result.connectionUrl, { max: 1, onnotice: () => {} })
    try {
      const rows = await sql`SELECT extname FROM pg_extension WHERE extname = 'vector'`
      expect(rows).toHaveLength(1)
    } finally {
      await sql.end({ timeout: 5 })
    }
  })

  it('refuses a duplicate slug rather than creating a second database', async () => {
    const slug = uniqueSlug('dup')
    await provisionInstitution({
      name: 'First University',
      slug,
      shortName: 'FU',
      contactEmail: 'admin@fu.test',
    })

    await expect(
      provisionInstitution({
        name: 'Second University',
        slug,
        shortName: 'SU2',
        contactEmail: 'admin@su2.test',
      }),
    ).rejects.toThrow(AppError)
  })

  it('rejects a slug that could be used to inject SQL into CREATE DATABASE', async () => {
    await expect(
      provisionInstitution({
        name: 'Injection Attempt',
        slug: 'evil"; DROP DATABASE postgres; --',
        shortName: 'EVIL',
        contactEmail: 'admin@evil.test',
      }),
    ).rejects.toThrow()

    // The server is still standing.
    expect(await databaseExists('postgres')).toBe(true)
  })

  it('leaves nothing behind when provisioning fails part-way', async () => {
    const slug = uniqueSlug('rollback')
    const databaseName = `stackedu_inst_${slug}`

    // Create the database first so provisioning hits a conflict after it has
    // already written the registry row.
    const admin = postgres(adminConnectionUrl(TEST_SERVER_URL), { max: 1, onnotice: () => {} })
    await admin.unsafe(`CREATE DATABASE "${databaseName}"`)
    await admin.end({ timeout: 5 })

    await expect(
      provisionInstitution({
        name: 'Rollback University',
        slug,
        shortName: 'RU',
        contactEmail: 'admin@ru.test',
      }),
    ).rejects.toThrow()

    // A half-provisioned institution would appear in the registry while being
    // unusable, so the registry must be clean.
    const rows = await getPlatformDb()
      .select({ id: institutions.id })
      .from(institutions)
      .where(eq(institutions.slug, slug))

    expect(rows).toHaveLength(0)
  })

  it('removes the database and registry entries on deprovision', async () => {
    const result = await provisionInstitution({
      name: 'Temporary College',
      slug: uniqueSlug('temp'),
      shortName: 'TC',
      contactEmail: 'admin@tc.test',
    })

    await deprovisionInstitution(result.institutionId)

    expect(await databaseExists(result.databaseName)).toBe(false)

    const registry = await getPlatformDb()
      .select({ id: institutionDatabases.id })
      .from(institutionDatabases)
      .where(eq(institutionDatabases.institutionId, result.institutionId))

    expect(registry).toHaveLength(0)
  })

  it('seeds the default attendance editing policy', async () => {
    const result = await provisionInstitution({
      name: 'Attendance Policy University',
      slug: uniqueSlug('attpol'),
      shortName: 'APU',
      contactEmail: 'admin@apu.test',
    })

    const db = await getInstitutionDb(result.institutionId)
    const policy = await readInstitutionSetting(
      db,
      ATTENDANCE_POLICY_SETTING_KEY,
      attendancePolicySchema,
      DEFAULT_ATTENDANCE_POLICY,
    )
    expect(policy).toEqual(DEFAULT_ATTENDANCE_POLICY)
  })

  it('supports draft, submit, edit and delete flows for lecturer attendance', async () => {
    const result = await provisionInstitution({
      name: 'Attendance Flow University',
      slug: uniqueSlug('attflow'),
      shortName: 'AFU',
      contactEmail: 'admin@afu.test',
    })
    const db = await getInstitutionDb(result.institutionId)

    const lecturer = await createUser({
      institutionId: result.institutionId,
      email: 'lecturer@afu.test',
      fullName: 'Flow Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const studentUser = await createUser({
      institutionId: result.institutionId,
      email: 'student@afu.test',
      fullName: 'Flow Student',
      role: 'Student',
      password: 'Student#2026',
    })

    const [faculty] = await db.insert(faculties).values({ code: 'CSE', name: 'Computing' }).returning()
    const [department] = await db
      .insert(departments)
      .values({ facultyId: faculty!.id, code: 'CS', name: 'Computer Science' })
      .returning()
    const [programme] = await db
      .insert(programmes)
      .values({
        departmentId: department!.id,
        code: 'BSC-CS',
        name: 'BSc Computer Science',
        level: 'Bachelor',
        durationYears: 3,
        totalCreditsRequired: 360,
      })
      .returning()
    const [year] = await db
      .insert(academicYears)
      .values({ name: '2026/2027', startDate: '2026-09-01', endDate: '2027-08-31', isCurrent: true })
      .returning()
    const [semester] = await db
      .insert(semesters)
      .values({
        academicYearId: year!.id,
        name: 'Semester 1',
        sequence: 1,
        startDate: '2026-09-01',
        endDate: '2027-01-31',
        isCurrent: true,
      })
      .returning()
    const [course] = await db
      .insert(courses)
      .values({ departmentId: department!.id, code: 'CS101', name: 'Intro Computing', credits: 3 })
      .returning()
    const [offering] = await db
      .insert(courseOfferings)
      .values({ courseId: course!.id, semesterId: semester!.id, section: 'A' })
      .returning()
    await db.insert(lecturerAssignments).values({
      courseOfferingId: offering!.id,
      lecturerId: lecturer.id,
      isLead: true,
    })
    const [student] = await db
      .insert(students)
      .values({
        userId: studentUser.id,
        studentNumber: 'AFU-0001',
        programmeId: programme!.id,
        yearOfStudy: 1,
      })
      .returning()
    await db.insert(courseRegistrations).values({
      studentId: student!.id,
      courseOfferingId: offering!.id,
      status: 'Approved',
      registeredAt: new Date().toISOString(),
    })

    const actor = { id: lecturer.id, email: lecturer.email, role: lecturer.role as 'Lecturer' }

    const draft = await saveLecturerAttendance(result.institutionId, actor, {
      offeringId: offering!.id,
      sessionDate: '2026-09-02',
      topic: 'Session 1',
      close: false,
      records: [{ studentId: student!.id, status: 'Present' }],
    })
    expect(draft.status).toBe('Draft')
    expect(draft.editable).toBe(true)

    let listed = await listLecturerAttendance(result.institutionId, lecturer.id, offering!.id)
    expect(listed.some((row) => row.id === draft.id && row.status === 'Draft')).toBe(true)

    const submitted = await saveLecturerAttendance(result.institutionId, actor, {
      sessionId: draft.id,
      offeringId: offering!.id,
      sessionDate: '2026-09-02',
      close: true,
      records: [{ studentId: student!.id, status: 'Absent' }],
    })
    expect(submitted.status).toBe('Submitted')
    expect(submitted.absent).toBe(1)

    const edited = await saveLecturerAttendance(result.institutionId, actor, {
      sessionId: submitted.id,
      offeringId: offering!.id,
      sessionDate: '2026-09-02',
      close: false,
      records: [{ studentId: student!.id, status: 'Late' }],
    })
    expect(edited.status).toBe('Submitted')
    expect(edited.late).toBe(1)

    await upsertInstitutionSetting(
      db,
      ATTENDANCE_POLICY_SETTING_KEY,
      { allowEditAfterSubmit: false, editWindowMinutes: 60 },
      { category: 'Teaching', description: 'test lock' },
    )

    await expect(
      saveLecturerAttendance(result.institutionId, actor, {
        sessionId: submitted.id,
        offeringId: offering!.id,
        sessionDate: '2026-09-02',
        records: [{ studentId: student!.id, status: 'Present' }],
      }),
    ).rejects.toThrow(/no longer be edited/)

    await upsertInstitutionSetting(
      db,
      ATTENDANCE_POLICY_SETTING_KEY,
      DEFAULT_ATTENDANCE_POLICY,
      { category: 'Teaching', description: 'restore default' },
    )

    const draftForDelete = await saveLecturerAttendance(result.institutionId, actor, {
      offeringId: offering!.id,
      sessionDate: '2026-09-04',
      topic: 'Delete me',
      close: false,
      records: [{ studentId: student!.id, status: 'Present' }],
    })

    listed = await deleteLecturerAttendanceSession(result.institutionId, actor, draftForDelete.id)
    expect(listed.some((row) => row.id === draftForDelete.id)).toBe(false)
    expect(listed.some((row) => row.id === submitted.id)).toBe(true)
  })

  it('lets an assigned lecturer publish course materials for their offering', async () => {
    const result = await provisionInstitution({
      name: 'Material Flow University',
      slug: uniqueSlug('matflow'),
      shortName: 'MFU',
      contactEmail: 'admin@mfu.test',
    })
    const db = await getInstitutionDb(result.institutionId)

    const lecturer = await createUser({
      institutionId: result.institutionId,
      email: 'lecturer@mfu.test',
      fullName: 'Material Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })

    const [faculty] = await db.insert(faculties).values({ code: 'NUR', name: 'Nursing' }).returning()
    const [department] = await db
      .insert(departments)
      .values({ facultyId: faculty!.id, code: 'NUR', name: 'Nursing Science' })
      .returning()
    const [year] = await db
      .insert(academicYears)
      .values({ name: '2026/2027', startDate: '2026-09-01', endDate: '2027-08-31', isCurrent: true })
      .returning()
    const [semester] = await db
      .insert(semesters)
      .values({
        academicYearId: year!.id,
        name: 'Semester 1',
        sequence: 1,
        startDate: '2026-09-01',
        endDate: '2027-01-31',
        isCurrent: true,
      })
      .returning()
    const [course] = await db
      .insert(courses)
      .values({ departmentId: department!.id, code: 'NURS101', name: 'Intro to Nursing Science', credits: 6 })
      .returning()
    const [offering] = await db
      .insert(courseOfferings)
      .values({ courseId: course!.id, semesterId: semester!.id, section: 'A' })
      .returning()
    await db.insert(lecturerAssignments).values({
      courseOfferingId: offering!.id,
      lecturerId: lecturer.id,
      isLead: true,
    })

    const actor = { id: lecturer.id, email: lecturer.email, role: lecturer.role as 'Lecturer' }
    const module = await createLecturerModule(result.institutionId, actor, {
      offeringId: offering!.id,
      title: 'Week 1',
      publish: true,
    })
    const material = await createLecturerMaterial(result.institutionId, actor, {
      offeringId: offering!.id,
      moduleId: module.id,
      title: 'Week 1 lecture notes',
      moduleName: 'Week 1',
      description: 'Introduction to nursing practice',
      externalUrl: 'https://example.com/week-1',
      publish: true,
    })

    expect(material.title).toBe('Week 1 lecture notes')

    const detail = await getLecturerCourse(result.institutionId, lecturer.id, offering!.id)
    expect(detail.materials.some((row) => row.id === material.id)).toBe(true)

    const fileBytes = Buffer.from('%PDF-1.4 week-one')
    const upload = await reserveLecturerMaterialUpload(result.institutionId, lecturer.id, {
      offeringId: offering!.id,
      fileName: 'week-1.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: fileBytes.length,
    })
    const uploadToken = upload.uploadUrl.split('/').pop()
    expect(uploadToken).toBeTruthy()
    await writeLocalUpload(uploadToken!, fileBytes, fileBytes.length)

    const materialWithFile = await createLecturerMaterial(result.institutionId, actor, {
      offeringId: offering!.id,
      moduleId: module.id,
      title: 'Week 1 slides',
      moduleName: 'Week 1',
      fileKey: upload.fileKey,
      mimeType: 'application/pdf',
      fileSizeBytes: fileBytes.length,
      publish: true,
    })
    expect(materialWithFile.fileKey).toBe(upload.fileKey)
    expect(materialWithFile.fileName).toContain('week-1.pdf')

    const download = await getLecturerMaterialDownloadUrl(
      result.institutionId,
      lecturer.id,
      materialWithFile.id,
    )
    expect(download.url).toBeTruthy()
    expect(download.fileName).toContain('week-1.pdf')

    const updated = await updateLecturerMaterial(result.institutionId, actor, materialWithFile.id, {
      title: 'Week 1 slides (updated)',
      description: 'Revised lecture slides',
    })
    expect(updated.title).toBe('Week 1 slides (updated)')

    await deleteLecturerMaterial(result.institutionId, actor, materialWithFile.id)
    const detailAfterDelete = await getLecturerCourse(result.institutionId, lecturer.id, offering!.id)
    expect(detailAfterDelete.materials.some((row) => row.id === materialWithFile.id)).toBe(false)
    expect(detailAfterDelete.materials.some((row) => row.id === material.id)).toBe(true)
  })
})
