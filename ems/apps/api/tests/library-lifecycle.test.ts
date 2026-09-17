import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Hono } from 'hono'
import { createApp } from '../src/app'
import { getInstitutionDb, closeAllConnections } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import {
  academicYears,
  departments,
  faculties,
  programmes,
} from '../src/db/institution/schema/academic'
import { students } from '../src/db/institution/schema/students'
import { notifications } from '../src/db/institution/schema/communication'
import { writeLocalUpload } from '../src/lib/storage'
import { login } from '../src/services/auth'
import {
  addCollectionItem,
  attachLibraryFile,
  createLibraryCollection,
  createLibraryResource,
  createReaderLibraryRequest,
  declineLibraryRequest,
  deleteLibraryCollection,
  deleteLibraryFile,
  fulfilLibraryRequest,
  getLibraryAnalytics,
  getLibraryDownload,
  listLibraryCollections,
  listLibraryRequests,
  listLibraryResources,
  listMyLibraryRequests,
  listReadableLibrary,
  reserveLibraryUpload,
  updateLibraryAccess,
  updateLibraryCollection,
  updateLibraryResource,
} from '../src/services/library'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

const LIBRARIAN_PASSWORD = 'Librarian#2026'
const STUDENT_PASSWORD = 'Student#2026'

describe('e-library lifecycle', () => {
  let platform: TestPlatform
  let app: Hono<never>
  let institutionId: string
  let librarian: { id: string; email: string; role: 'Librarian' }
  let lecturer: { id: string; email: string; role: 'Lecturer' }
  let academic: { id: string; email: string; role: 'AcademicAdmin' }
  let studentUserId: string
  let otherStudentUserId: string
  let programmeId: string
  let otherProgrammeId: string
  let sessionCookie: string
  let studentCookie: string
  let lecturerCookie: string
  let academicCookie: string
  let ictCookie: string
  let bursarCookie: string

  async function cookieFor(email: string, password: string) {
    const signedIn = await login({ identifier: email, password })
    if (signedIn.status !== 'session') throw new Error(`Could not sign in ${email}`)
    return `stackedu_session=${signedIn.cookieValue}`
  }

  beforeAll(async () => {
    platform = await createTestPlatform()
    const institution = await provisionInstitution({
      name: 'Library University',
      slug: uniqueSlug('lib'),
      shortName: 'LIB',
      contactEmail: 'lib@lib.test',
    })
    institutionId = institution.institutionId

    const librarianUser = await createUser({
      institutionId,
      email: 'librarian@lib.test',
      fullName: 'Lina Librarian',
      role: 'Librarian',
      password: LIBRARIAN_PASSWORD,
    })
    librarian = { id: librarianUser.id, email: librarianUser.email, role: 'Librarian' }

    const lecturerUser = await createUser({
      institutionId,
      email: 'lecturer@lib.test',
      fullName: 'Leo Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    lecturer = { id: lecturerUser.id, email: lecturerUser.email, role: 'Lecturer' }

    const academicUser = await createUser({
      institutionId,
      email: 'academic@lib.test',
      fullName: 'Ada Academic',
      role: 'AcademicAdmin',
      password: 'Academic#2026',
    })
    academic = { id: academicUser.id, email: academicUser.email, role: 'AcademicAdmin' }

    await createUser({
      institutionId,
      email: 'ict@lib.test',
      fullName: 'Ian ICT',
      role: 'ICTManager',
      password: 'ICT#2026',
    })

    await createUser({
      institutionId,
      email: 'bursar@lib.test',
      fullName: 'Bea Bursar',
      role: 'Bursar',
      password: 'Bursar#2026',
    })

    const studentUser = await createUser({
      institutionId,
      email: 'student@lib.test',
      fullName: 'Sam Student',
      role: 'Student',
      password: STUDENT_PASSWORD,
    })
    studentUserId = studentUser.id

    const otherStudent = await createUser({
      institutionId,
      email: 'other@lib.test',
      fullName: 'Ora Other',
      role: 'Student',
      password: STUDENT_PASSWORD,
    })
    otherStudentUserId = otherStudent.id

    const db = await getInstitutionDb(institutionId)
    const [faculty] = await db.insert(faculties).values({ code: 'SCI', name: 'Science' }).returning()
    const [department] = await db
      .insert(departments)
      .values({ facultyId: faculty!.id, code: 'CS', name: 'Computer Science' })
      .returning()
    const [programme] = await db
      .insert(programmes)
      .values({
        departmentId: department!.id,
        code: 'BSC',
        name: 'Computer Science',
        level: 'Bachelor',
        durationYears: 3,
        totalCreditsRequired: 360,
      })
      .returning()
    const [otherProgramme] = await db
      .insert(programmes)
      .values({
        departmentId: department!.id,
        code: 'BA',
        name: 'Business',
        level: 'Bachelor',
        durationYears: 3,
        totalCreditsRequired: 360,
      })
      .returning()
    programmeId = programme!.id
    otherProgrammeId = otherProgramme!.id

    await db.insert(academicYears).values({
      name: '2026/2027',
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      isCurrent: true,
    })

    await db.insert(students).values([
      { userId: studentUserId, studentNumber: 'LIB-2026-001', programmeId, yearOfStudy: 1 },
      { userId: otherStudentUserId, studentNumber: 'LIB-2026-002', programmeId: otherProgrammeId, yearOfStudy: 1 },
    ])

    const signedIn = await login({ identifier: 'librarian@lib.test', password: LIBRARIAN_PASSWORD })
    if (signedIn.status !== 'session') throw new Error('The librarian could not sign in.')
    sessionCookie = `stackedu_session=${signedIn.cookieValue}`
    studentCookie = await cookieFor('student@lib.test', STUDENT_PASSWORD)
    lecturerCookie = await cookieFor('lecturer@lib.test', 'Lecturer#2026')
    academicCookie = await cookieFor('academic@lib.test', 'Academic#2026')
    ictCookie = await cookieFor('ict@lib.test', 'ICT#2026')
    bursarCookie = await cookieFor('bursar@lib.test', 'Bursar#2026')
    app = createApp().app as unknown as Hono<never>
  })

  afterAll(async () => {
    await closeAllConnections()
    await platform.cleanup()
  })

  it('creates, uploads PDF and DOCX, auto-describes, publishes, and serves downloads', async () => {
    const created = await createLibraryResource(institutionId, librarian, {
      title: 'Photosynthesis in Green Plants',
      author: 'Ada Botanist',
      type: 'Ebook',
      isbn: '978-1-111-11111-1',
    })
    expect(created.isPublished).toBe(false)
    expect(created.files).toEqual([])

    const pdfBytes = Buffer.from('%PDF-1.4 photosynthesis in green plants chlorophyll sunlight leaves')
    const pdfUpload = await reserveLibraryUpload(institutionId, librarian.id, created.id, {
      fileName: 'photosynthesis.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: pdfBytes.length,
    })
    const pdfToken = pdfUpload.uploadUrl.split('/').pop()
    await writeLocalUpload(pdfToken!, pdfBytes, pdfBytes.length)
    const withPdf = await attachLibraryFile(institutionId, librarian, created.id, {
      fileKey: pdfUpload.fileKey,
      fileName: 'photosynthesis.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: pdfBytes.length,
    })
    expect(withPdf.files).toHaveLength(1)
    expect(withPdf.files[0]?.format).toBe('pdf')
    expect(withPdf.description).toContain('Photosynthesis')
    expect(withPdf.subjectTags.length).toBeGreaterThan(0)

    const docxBytes = Buffer.from('PK linear algebra matrices eigenvectors dummy-docx-text')
    const docxUpload = await reserveLibraryUpload(institutionId, librarian.id, created.id, {
      fileName: 'notes.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSizeBytes: docxBytes.length,
    })
    await writeLocalUpload(docxUpload.uploadUrl.split('/').pop()!, docxBytes, docxBytes.length)
    const withDocx = await attachLibraryFile(institutionId, librarian, created.id, {
      fileKey: docxUpload.fileKey,
      fileName: 'notes.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSizeBytes: docxBytes.length,
    })
    expect(withDocx.files).toHaveLength(2)

    const published = await updateLibraryResource(institutionId, librarian, created.id, { isPublished: true })
    expect(published.isPublished).toBe(true)

    const studentList = await listReadableLibrary(institutionId, studentUserId)
    expect(studentList.some((item) => item.id === created.id)).toBe(true)
    expect(studentList.find((item) => item.id === created.id)?.files.length).toBe(2)

    const found = await listReadableLibrary(institutionId, studentUserId, 'photosynthesis')
    expect(found.some((item) => item.id === created.id)).toBe(true)

    const fromPdf = await listReadableLibrary(institutionId, studentUserId, 'chlorophyll')
    expect(fromPdf.some((item) => item.id === created.id)).toBe(true)
    const fromDocx = await listReadableLibrary(institutionId, studentUserId, 'eigenvectors')
    expect(fromDocx.some((item) => item.id === created.id)).toBe(true)

    const missed = await listReadableLibrary(institutionId, studentUserId, 'unpublished-never')
    expect(missed.some((item) => item.id === created.id)).toBe(false)

    const download = await getLibraryDownload(institutionId, studentUserId, created.id)
    expect(download.url).toBeTruthy()
    expect(download.fileName).toBe('photosynthesis.pdf')

    const lecturerList = await listReadableLibrary(institutionId, lecturer.id)
    expect(lecturerList.some((item) => item.id === created.id)).toBe(true)

    const analytics = await getLibraryAnalytics(institutionId, librarian.id)
    expect(analytics.publishedResources).toBeGreaterThanOrEqual(1)
    expect(analytics.totalDownloads).toBeGreaterThanOrEqual(1)
  })

  it('withholds a fee-cleared title from a student on hold and respects programme rules', async () => {
    const resource = await createLibraryResource(institutionId, librarian, {
      title: 'Restricted Finance Notes',
      type: 'CoursePack',
      publish: true,
    })
    await updateLibraryAccess(institutionId, librarian, resource.id, {
      programmeIds: [programmeId],
      departmentIds: [],
      yearGroups: [],
      roles: [],
      requiresFeeClearance: true,
    })

    const db = await getInstitutionDb(institutionId)
    await db.update(students).set({ feeHold: true }).where(eq(students.userId, studentUserId))

    const onHold = await listReadableLibrary(institutionId, studentUserId)
    expect(onHold.some((item) => item.id === resource.id)).toBe(false)

    await db.update(students).set({ feeHold: false }).where(eq(students.userId, studentUserId))
    const cleared = await listReadableLibrary(institutionId, studentUserId)
    expect(cleared.some((item) => item.id === resource.id)).toBe(true)

    const other = await listReadableLibrary(institutionId, otherStudentUserId)
    expect(other.some((item) => item.id === resource.id)).toBe(false)
  })

  it('runs collections and the request fulfil/decline cycle', async () => {
    const resource = await createLibraryResource(institutionId, librarian, {
      title: 'Calculus Pack',
      type: 'CoursePack',
      publish: true,
    })
    const collection = await createLibraryCollection(institutionId, librarian, {
      name: 'First year packs',
      description: 'Core reading',
    })
    await addCollectionItem(institutionId, librarian, collection.id, resource.id)
    const listed = await listLibraryCollections(institutionId, librarian.id)
    expect(listed.find((item) => item.id === collection.id)?.resourceCount).toBe(1)

    await createReaderLibraryRequest(institutionId, studentUserId, {
      title: 'Modern Operating Systems',
      author: 'Tanenbaum',
      reason: 'Needed for CSC 301',
    })
    const pending = await listLibraryRequests(institutionId, librarian.id)
    const request = pending.find((item) => item.title === 'Modern Operating Systems')
    if (!request) throw new Error('The request was not stored.')
    expect(request.status).toBe('Pending')

    const fulfilled = await fulfilLibraryRequest(institutionId, librarian, request.id, { resourceId: resource.id })
    expect(fulfilled.find((item) => item.id === request.id)?.status).toBe('Fulfilled')

    await createReaderLibraryRequest(institutionId, lecturer.id, {
      title: 'Obscure Journal',
      reason: 'Not in catalogue',
    })
    const second = (await listLibraryRequests(institutionId, librarian.id)).find((item) => item.title === 'Obscure Journal')
    if (!second) throw new Error('The second request was not stored.')
    const declined = await declineLibraryRequest(institutionId, librarian, second.id, {
      reason: 'Out of print and no digital licence.',
    })
    expect(declined.find((item) => item.id === second.id)?.status).toBe('Declined')

    const db = await getInstitutionDb(institutionId)
    const lecturerNotes = await db
      .select({ actionUrl: notifications.actionUrl })
      .from(notifications)
      .where(eq(notifications.userId, lecturer.id))
    expect(lecturerNotes.some((row) => row.actionUrl === '/lecturer/library')).toBe(true)

    const studentNotes = await db
      .select({ actionUrl: notifications.actionUrl })
      .from(notifications)
      .where(eq(notifications.userId, studentUserId))
    expect(studentNotes.some((row) => row.actionUrl === '/student/library')).toBe(true)
  })

  it('hides unpublished titles from students and never returns file keys over HTTP', async () => {
    const draft = await createLibraryResource(institutionId, librarian, {
      title: 'Draft only',
      type: 'Journal',
    })
    const studentList = await listReadableLibrary(institutionId, studentUserId)
    expect(studentList.some((item) => item.id === draft.id)).toBe(false)
    const librarianList = await listLibraryResources(institutionId, librarian.id)
    expect(librarianList.some((item) => item.id === draft.id)).toBe(true)

    const response = await app.request('/librarian/resources', { headers: { Cookie: sessionCookie } })
    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).not.toContain('institutions/')
    expect(body).toContain('Draft only')

    const me = await app.request('/librarian/me', { headers: { Cookie: sessionCookie } })
    expect(me.status).toBe(200)
  })

  it('updates and retires catalogue records, files, collections, year groups, and roles', async () => {
    const resource = await createLibraryResource(institutionId, librarian, {
      title: 'Draft Linear Notes',
      type: 'CoursePack',
      isbn: '978-2-222-22222-2',
    })
    const renamed = await updateLibraryResource(institutionId, librarian, resource.id, {
      title: 'Linear Algebra Notes',
      isPublished: true,
    })
    expect(renamed.title).toBe('Linear Algebra Notes')
    expect(renamed.isPublished).toBe(true)

    await expect(
      createLibraryResource(institutionId, librarian, {
        title: 'Duplicate ISBN',
        type: 'Ebook',
        isbn: '978-2-222-22222-2',
      }),
    ).rejects.toMatchObject({ status: 409 })

    const bytes = Buffer.from('%PDF-1.4 year-two-only dummy notes')
    const upload = await reserveLibraryUpload(institutionId, librarian.id, resource.id, {
      fileName: 'year-two.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: bytes.length,
    })
    await writeLocalUpload(upload.uploadUrl.split('/').pop()!, bytes, bytes.length)
    const withFile = await attachLibraryFile(institutionId, librarian, resource.id, {
      fileKey: upload.fileKey,
      fileName: 'year-two.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: bytes.length,
    })
    expect(withFile.files).toHaveLength(1)

    await updateLibraryAccess(institutionId, librarian, resource.id, {
      programmeIds: [],
      departmentIds: [],
      yearGroups: [2],
      roles: [],
      requiresFeeClearance: false,
    })
    const yearOne = await listReadableLibrary(institutionId, studentUserId)
    expect(yearOne.some((item) => item.id === resource.id)).toBe(false)

    await updateLibraryAccess(institutionId, librarian, resource.id, {
      programmeIds: [],
      departmentIds: [],
      yearGroups: [],
      roles: ['Lecturer'],
      requiresFeeClearance: false,
    })
    const studentView = await listReadableLibrary(institutionId, studentUserId)
    expect(studentView.some((item) => item.id === resource.id)).toBe(false)
    const lecturers = await listReadableLibrary(institutionId, lecturer.id)
    expect(lecturers.some((item) => item.id === resource.id)).toBe(true)
    const admins = await listReadableLibrary(institutionId, academic.id)
    expect(admins.some((item) => item.id === resource.id)).toBe(false)

    const remaining = await deleteLibraryFile(institutionId, librarian, resource.id, withFile.files[0]!.id)
    expect(remaining.files).toHaveLength(0)

    const collection = await createLibraryCollection(institutionId, librarian, { name: 'Scratch list' })
    const renamedCollection = await updateLibraryCollection(institutionId, librarian, collection.id, {
      name: 'Year two list',
    })
    expect(renamedCollection.name).toBe('Year two list')
    await deleteLibraryCollection(institutionId, librarian, collection.id)
    const listed = await listLibraryCollections(institutionId, librarian.id)
    expect(listed.some((item) => item.id === collection.id)).toBe(false)

    await updateLibraryResource(institutionId, librarian, resource.id, { isPublished: false })
    await expect(getLibraryDownload(institutionId, studentUserId, resource.id)).rejects.toMatchObject({ status: 404 })
  })

  it('serves reader HTTP for student, lecturer, and academic admin, and forbids writers and ICT', async () => {
    const title = await createLibraryResource(institutionId, librarian, {
      title: 'HTTP Catalogue Title',
      type: 'Journal',
      publish: true,
    })

    const studentList = await app.request('/student/library', { headers: { Cookie: studentCookie } })
    expect(studentList.status).toBe(200)
    expect(await studentList.text()).toContain('HTTP Catalogue Title')

    const lecturerList = await app.request('/lecturer/library', { headers: { Cookie: lecturerCookie } })
    expect(lecturerList.status).toBe(200)

    const academicList = await app.request('/academic/library', { headers: { Cookie: academicCookie } })
    expect(academicList.status).toBe(200)
    const academicBody = await academicList.text()
    expect(academicBody).toContain('HTTP Catalogue Title')
    expect(academicBody).not.toContain('institutions/')

    const academicRequest = await app.request('/academic/library/requests', {
      method: 'POST',
      headers: { Cookie: academicCookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Registrar reading list', reason: 'Curriculum review' }),
    })
    expect(academicRequest.status).toBe(201)
    const own = await listMyLibraryRequests(institutionId, academic.id)
    expect(own.some((item) => item.title === 'Registrar reading list' && item.status === 'Pending')).toBe(true)

    const studentWrite = await app.request('/librarian/resources', {
      method: 'POST',
      headers: { Cookie: studentCookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Should not create', type: 'Ebook' }),
    })
    expect(studentWrite.status).toBe(403)

    const lecturerWrite = await app.request('/librarian/resources', {
      method: 'POST',
      headers: { Cookie: lecturerCookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Should not create', type: 'Ebook' }),
    })
    expect(lecturerWrite.status).toBe(403)

    const ictRead = await app.request('/student/library', { headers: { Cookie: ictCookie } })
    expect(ictRead.status).toBe(403)

    const ictManage = await app.request('/librarian/resources', { headers: { Cookie: ictCookie } })
    expect(ictManage.status).toBe(403)

    const bursarRead = await app.request('/academic/library', { headers: { Cookie: bursarCookie } })
    expect(bursarRead.status).toBe(403)

    const studentDownload = await app.request(`/student/library/${title.id}/download`, {
      headers: { Cookie: studentCookie },
    })
    expect(studentDownload.status).toBe(404)
  })
})
