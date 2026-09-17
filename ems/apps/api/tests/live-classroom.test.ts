import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import {
  academicYears,
  courses,
  departments,
  faculties,
  programmes,
  semesters,
} from '../src/db/institution/schema/academic'
import { assessments } from '../src/db/institution/schema/assessment'
import { students } from '../src/db/institution/schema/students'
import {
  courseMaterials,
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
} from '../src/db/institution/schema/teaching'
import { setMediaRoomAdapter } from '../src/lib/media-room'
import {
  cancelLecturerClassroomSession,
  createLecturerClassroomSession,
  draftClassroomSummary,
  endLecturerClassroomSession,
  joinStudentClassroomSession,
  listLecturerClassroomSessions,
  publishClassroomSummary,
  saveClassroomWhiteboard,
  startLecturerClassroomSession,
  startLecturerRecording,
  stopLecturerRecording,
} from '../src/services/live-sessions'
import { getLecturerCourseAnalytics } from '../src/services/course-analytics'
import { askStudyAssistant } from '../src/services/study-assistant'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('live classroom, analytics, and study assistant', () => {
  let platform: TestPlatform
  let institutionId: string
  let offeringId: string
  let lecturerActor: { id: string; email: string; role: 'Lecturer' }
  let otherLecturerActor: { id: string; email: string; role: 'Lecturer' }
  let studentUserId: string
  let unenrolledUserId: string

  beforeAll(async () => {
    platform = await createTestPlatform()
    setMediaRoomAdapter({
      isConfigured: () => true,
      canRecordToObjectStorage: () => true,
      participantToken: async (input) => ({
        url: 'wss://media.test.local',
        token: `tok-${input.identity}`,
        roomName: input.roomName,
      }),
      ensureRoom: async () => {},
      closeRoom: async () => {},
      startRecording: async () => ({ jobId: 'job-1' }),
      stopRecording: async () => {},
    })

    const result = await provisionInstitution({
      name: 'Classroom University',
      slug: uniqueSlug('classroom'),
      shortName: 'CLU',
      contactEmail: 'admin@clu.test',
    })
    institutionId = result.institutionId
    const db = await getInstitutionDb(institutionId)

    const lecturer = await createUser({
      institutionId,
      email: `lecturer-${result.slug}@clu.test`,
      fullName: 'Class Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const other = await createUser({
      institutionId,
      email: `other-${result.slug}@clu.test`,
      fullName: 'Other Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const student = await createUser({
      institutionId,
      email: `student-${result.slug}@clu.test`,
      fullName: 'Enrolled Student',
      role: 'Student',
      password: 'Student#2026',
    })
    const unenrolled = await createUser({
      institutionId,
      email: `open-${result.slug}@clu.test`,
      fullName: 'Open Student',
      role: 'Student',
      password: 'Student#2026',
    })
    lecturerActor = { id: lecturer.id, email: lecturer.email, role: 'Lecturer' }
    otherLecturerActor = { id: other.id, email: other.email, role: 'Lecturer' }
    studentUserId = student.id
    unenrolledUserId = unenrolled.id

    const [faculty] = await db.insert(faculties).values({ code: 'SCI', name: 'Science' }).returning()
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
        durationYears: 4,
        totalCreditsRequired: 480,
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
      .values({
        departmentId: department!.id,
        code: 'CSC199',
        name: 'Live Classroom Lab',
        credits: 3,
        yearOfStudy: 1,
      })
      .returning()
    const [offering] = await db
      .insert(courseOfferings)
      .values({ courseId: course!.id, semesterId: semester!.id, section: 'A' })
      .returning()
    offeringId = offering!.id
    await db.insert(lecturerAssignments).values({
      courseOfferingId: offeringId,
      lecturerId: lecturer.id,
      isLead: true,
    })
    const [studentRow] = await db
      .insert(students)
      .values({
        userId: student.id,
        studentNumber: `CLU-${result.slug.slice(-4)}`,
        programmeId: programme!.id,
        yearOfStudy: 1,
      })
      .returning()
    await db.insert(students).values({
      userId: unenrolled.id,
      studentNumber: `CLU-O-${result.slug.slice(-4)}`,
      programmeId: programme!.id,
      yearOfStudy: 1,
    })
    await db.insert(courseRegistrations).values({
      studentId: studentRow!.id,
      courseOfferingId: offeringId,
      status: 'Approved',
      registeredAt: new Date().toISOString(),
    })
    await db.insert(courseMaterials).values({
      courseOfferingId: offeringId,
      title: 'Week 1 notes',
      bodyText: 'An algorithm is a finite sequence of steps a machine can follow.',
      isPublished: true,
      publishedAt: new Date().toISOString(),
    })
    await db.insert(assessments).values({
      courseOfferingId: offeringId,
      title: 'Week 1 quiz',
      type: 'Quiz',
      weight: '10',
      totalMarks: '10',
      isPublished: true,
      createdBy: lecturer.id,
    })
  })

  afterAll(async () => {
    setMediaRoomAdapter(null)
    await platform.cleanup()
  })

  it('lets an assigned lecturer run a class that an enrolled student can join', async () => {
    const created = await createLecturerClassroomSession(institutionId, lecturerActor, {
      offeringId,
      title: 'Intro live class',
    })
    expect(created.status).toBe('Scheduled')

    await expect(
      createLecturerClassroomSession(institutionId, otherLecturerActor, {
        offeringId,
        title: 'Should fail',
      }),
    ).rejects.toThrow(/not assigned/)

    const live = await startLecturerClassroomSession(institutionId, lecturerActor, created.id)
    expect(live.status).toBe('Live')

    const join = await joinStudentClassroomSession(institutionId, studentUserId, created.id)
    expect(join.role).toBe('participant')
    expect(join.media?.token).toContain('tok-')

    await expect(joinStudentClassroomSession(institutionId, unenrolledUserId, created.id)).rejects.toThrow(
      /not enrolled/,
    )

    await startLecturerRecording(institutionId, lecturerActor, created.id)
    await stopLecturerRecording(institutionId, lecturerActor, created.id)
    const ended = await endLecturerClassroomSession(institutionId, lecturerActor, created.id)
    expect(ended.status).toBe('Ended')
    expect(ended.recordings.some((row) => row.status === 'Ready')).toBe(true)

    const drafted = await draftClassroomSummary(institutionId, lecturerActor, created.id)
    expect(drafted.summaryText?.length).toBeGreaterThan(10)
    const published = await publishClassroomSummary(institutionId, lecturerActor, created.id)
    expect(published.summaryPublished).toBe(true)

    const listed = await listLecturerClassroomSessions(institutionId, lecturerActor.id, offeringId)
    expect(listed.some((row) => row.id === created.id)).toBe(true)
  })

  it('cancels a scheduled class and saves a whiteboard scene', async () => {
    const created = await createLecturerClassroomSession(institutionId, lecturerActor, {
      offeringId,
      title: 'Spare class',
    })
    await saveClassroomWhiteboard(institutionId, lecturerActor.id, 'Lecturer', created.id, {
      elements: [{ id: 'a', type: 'rectangle' }],
    })
    await cancelLecturerClassroomSession(institutionId, lecturerActor, created.id)
    await expect(startLecturerClassroomSession(institutionId, lecturerActor, created.id)).rejects.toThrow(/finished/)
  })

  it('joins attendance, materials, fees and grades on one analytics view', async () => {
    const analytics = await getLecturerCourseAnalytics(institutionId, lecturerActor.id, offeringId)
    expect(analytics.courseCode).toBe('CSC199')
    expect(analytics.enrolled).toBe(1)
    expect(analytics.students[0]?.materialsTotal).toBe(1)
  })

  it('refuses to answer a graded quiz for the study assistant', async () => {
    const refused = await askStudyAssistant(institutionId, studentUserId, 'Student', {
      offeringId,
      message: 'What is the correct answer to the quiz question on algorithms?',
    })
    expect(refused.refused).toBe(true)

    const helped = await askStudyAssistant(institutionId, studentUserId, 'Student', {
      offeringId,
      message: 'Remind me what an algorithm is from the notes.',
    })
    expect(helped.refused).toBe(false)
    expect(helped.citations.some((item) => item.kind === 'material')).toBe(true)
  })
})
