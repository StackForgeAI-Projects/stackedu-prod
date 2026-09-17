import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { resetEnvCache } from '../src/config/env'
import {
  academicYears,
  courses,
  departments,
  faculties,
  programmes,
  semesters,
} from '../src/db/institution/schema/academic'
import { questionVersions } from '../src/db/institution/schema/assessment'
import { students } from '../src/db/institution/schema/students'
import {
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
} from '../src/db/institution/schema/teaching'
import { createLecturerAssessment, deleteLecturerAssessment, getLecturerAssessment, saveLecturerGrade, listLecturerAssessments } from '../src/services/lecturer'
import { describeLecturerMaterial } from '../src/services/material-describe'
import {
  createLecturerQuestion,
  deleteLecturerQuestion,
  listLecturerQuestions,
  saveLecturerAssessmentItems,
  updateLecturerQuestion,
  listLecturerAssessmentItems,
} from '../src/services/question-bank'
import { getStudentAssessmentDetail, submitStudentAssessment } from '../src/services/student'
import { createUser } from '../src/services/users'
import { heuristicMaterialDescription, heuristicQuestions } from '../src/lib/ai-complete'
import { drawShortageMessage, generateLecturerQuestions } from '../src/services/question-bank'
import { isBlockedHost } from '../src/lib/public-http'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('material description helpers', () => {
  it('drafts a student-facing note from a file name', () => {
    expect(heuristicMaterialDescription({ title: 'Week 1 notes', fileName: 'week-1.pdf' })).toContain(
      'Week 1 notes',
    )
  })

  it('refuses loopback hosts so describe cannot probe private networks', () => {
    expect(isBlockedHost('localhost')).toBe(true)
    expect(isBlockedHost('127.0.0.1')).toBe(true)
    expect(isBlockedHost('example.com')).toBe(false)
  })

  it('explains a short random draw in plain English', () => {
    expect(drawShortageMessage('Foundations', 1, 2)).toMatch(/only has 1 unused question/i)
    expect(drawShortageMessage('Foundations', 1, 2)).toMatch(/draw 2/)
  })

  it('drafts bank questions from the course without calling a vendor', () => {
    const drafts = heuristicQuestions({
      courseCode: 'CSC101',
      courseName: 'Introduction to Computer Science',
      topic: 'Foundations',
      count: 3,
    })
    expect(drafts).toHaveLength(3)
    expect(drafts.some((row) => row.type === 'MultipleChoice' && (row.options?.length ?? 0) >= 2)).toBe(true)
    expect(drafts.some((row) => row.type === 'TrueFalse')).toBe(true)
  })
})

describe('question bank', () => {
  let platform: TestPlatform
  let institutionId: string
  let offeringId: string
  let courseId: string
  let studentUserId: string
  let lecturerActor: { id: string; email: string; role: 'Lecturer' }
  let otherLecturerActor: { id: string; email: string; role: 'Lecturer' }

  beforeAll(async () => {
    platform = await createTestPlatform()
    const result = await provisionInstitution({
      name: 'Question Bank University',
      slug: uniqueSlug('qbank'),
      shortName: 'QBU',
      contactEmail: 'admin@qbu.test',
    })
    institutionId = result.institutionId
    const db = await getInstitutionDb(institutionId)

    const lecturer = await createUser({
      institutionId,
      email: `lecturer-${result.slug}@qbu.test`,
      fullName: 'Bank Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const otherLecturer = await createUser({
      institutionId,
      email: `other-${result.slug}@qbu.test`,
      fullName: 'Other Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const student = await createUser({
      institutionId,
      email: `student-${result.slug}@qbu.test`,
      fullName: 'Quiz Student',
      role: 'Student',
      password: 'Student#2026',
    })
    lecturerActor = { id: lecturer.id, email: lecturer.email, role: 'Lecturer' }
    otherLecturerActor = { id: otherLecturer.id, email: otherLecturer.email, role: 'Lecturer' }
    studentUserId = student.id

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
      .values({ departmentId: department!.id, code: 'CS101', name: 'Programming Basics', credits: 6 })
      .returning()
    const [offering] = await db
      .insert(courseOfferings)
      .values({ courseId: course!.id, semesterId: semester!.id, section: 'A' })
      .returning()
    courseId = course!.id
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
        studentNumber: `QBU-${result.slug.slice(-4)}`,
        programmeId: programme!.id,
        yearOfStudy: 1,
      })
      .returning()
    await db.insert(courseRegistrations).values({
      studentId: studentRow!.id,
      courseOfferingId: offeringId,
      status: 'Approved',
      registeredAt: new Date().toISOString(),
    })
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('refuses a private link when drafting a description', async () => {
    await expect(
      describeLecturerMaterial(institutionId, lecturerActor, { externalUrl: 'http://127.0.0.1/secret' }),
    ).rejects.toThrow(/cannot be fetched/i)
  })

  it('drafts a description from a file name without calling a model', async () => {
    const previous = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    resetEnvCache()
    try {
      const { description } = await describeLecturerMaterial(institutionId, lecturerActor, {
        fileName: 'lab-notes.pdf',
      })
      expect(description).toMatch(/lab-notes\.pdf/)
    } finally {
      if (previous) process.env.OPENAI_API_KEY = previous
      else delete process.env.OPENAI_API_KEY
      resetEnvCache()
    }
  })

  it('lets any lecturer in the institution add to the bank', async () => {
    const question = await createLecturerQuestion(institutionId, otherLecturerActor, {
      courseId,
      topic: 'Shared',
      type: 'TrueFalse',
      stem: 'An algorithm is a set of steps.',
      correctAnswer: 'True',
      marks: 1,
    })
    const listed = await listLecturerQuestions(institutionId, lecturerActor.id)
    expect(listed.some((row) => row.id === question.id)).toBe(true)
  })

  it('edits in place until a student has answered, then versions', async () => {
    const question = await createLecturerQuestion(institutionId, lecturerActor, {
      courseId,
      topic: 'Versioning',
      type: 'MultipleChoice',
      stem: 'What is a variable?',
      options: ['A named store for a value', 'A printer', 'A timetable', 'A fee'],
      correctAnswer: 'A named store for a value',
      marks: 2,
    })
    const edited = await updateLecturerQuestion(institutionId, lecturerActor, question.id, {
      stem: 'What is a variable in a program?',
    })
    expect(edited.version).toBe(1)
    expect(edited.stem).toBe('What is a variable in a program?')

    const quiz = await createLecturerAssessment(institutionId, lecturerActor, {
      offeringId,
      title: 'Versioning quiz',
      type: 'Quiz',
      weight: 5,
      totalMarks: 2,
      publish: true,
    })
    await saveLecturerAssessmentItems(institutionId, lecturerActor, quiz.id, {
      items: [{ questionId: question.id }],
    })

    const paper = await getStudentAssessmentDetail(institutionId, studentUserId, quiz.id)
    await submitStudentAssessment(institutionId, studentUserId, quiz.id, {
      answers: [
        {
          questionVersionId: paper.questions[0]!.questionVersionId,
          response: 'A named store for a value',
        },
      ],
    })

    const versioned = await updateLecturerQuestion(institutionId, lecturerActor, question.id, {
      stem: 'Rewritten after the sitting',
    })
    expect(versioned.version).toBe(2)
    expect(versioned.stem).toBe('Rewritten after the sitting')

    const db = await getInstitutionDb(institutionId)
    const versions = await db
      .select({ version: questionVersions.version, stem: questionVersions.stem })
      .from(questionVersions)
      .where(eq(questionVersions.questionId, question.id))
    expect(versions).toEqual(
      expect.arrayContaining([
        { version: 1, stem: 'What is a variable in a program?' },
        { version: 2, stem: 'Rewritten after the sitting' },
      ]),
    )

    const after = await getStudentAssessmentDetail(institutionId, studentUserId, quiz.id)
    expect(after.questions[0]?.stem).toBe('What is a variable in a program?')
    expect(after.score).toBe(2)

    await expect(
      deleteLecturerQuestion(institutionId, lecturerActor, question.id),
    ).rejects.toThrow(/been answered/i)
  })

  it('persists a random topic draw and auto-marks the sitting', async () => {
    const pool = await Promise.all(
      ['for', 'while', 'repeat'].map((word) =>
        createLecturerQuestion(institutionId, lecturerActor, {
          courseId,
          topic: 'Loops',
          type: 'MultipleChoice',
          stem: `Which word starts a ${word} loop?`,
          options: [word, 'print', 'class', 'fee'],
          correctAnswer: word,
          marks: 1,
        }),
      ),
    )
    const quiz = await createLecturerAssessment(institutionId, lecturerActor, {
      offeringId,
      title: 'Loops quiz',
      type: 'Quiz',
      weight: 5,
      totalMarks: 2,
      publish: true,
    })
    await saveLecturerAssessmentItems(institutionId, lecturerActor, quiz.id, {
      items: [{ drawTopic: 'Loops', drawCourseId: courseId, drawCount: 2 }],
    })

    await expect(
      saveLecturerAssessmentItems(institutionId, otherLecturerActor, quiz.id, {
        items: [{ questionId: pool[0]!.id }],
      }),
    ).rejects.toThrow(/not assigned/i)

    const first = await getStudentAssessmentDetail(institutionId, studentUserId, quiz.id)
    const second = await getStudentAssessmentDetail(institutionId, studentUserId, quiz.id)
    expect(first.questions).toHaveLength(2)
    expect(second.questions.map((row) => row.questionVersionId)).toEqual(
      first.questions.map((row) => row.questionVersionId),
    )

    const answers = first.questions.map((row, index) => ({
      questionVersionId: row.questionVersionId,
      response: index === 0 ? row.options![0]! : 'print',
    }))
    await submitStudentAssessment(institutionId, studentUserId, quiz.id, { answers })
    const marked = await getStudentAssessmentDetail(institutionId, studentUserId, quiz.id)
    expect(marked.submitted).toBe(true)
    expect(marked.score).toBe(1)
  })

  it('generates course questions with the in-built model', async () => {
    const previous = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    resetEnvCache()
    try {
      const { questions: generated } = await generateLecturerQuestions(institutionId, lecturerActor, {
        offeringId,
        topic: 'Generated',
        count: 3,
        types: ['MultipleChoice', 'TrueFalse', 'ShortAnswer'],
      })
      expect(generated).toHaveLength(3)
      expect(generated.every((row) => row.topic === 'Generated' && row.courseId === courseId)).toBe(true)
    } finally {
      if (previous) process.env.OPENAI_API_KEY = previous
      else delete process.env.OPENAI_API_KEY
      resetEnvCache()
    }
  })

  it('rejects a random draw that uses more questions than the topic still has', async () => {
    const first = await createLecturerQuestion(institutionId, lecturerActor, {
      courseId,
      topic: 'ShortPool',
      type: 'TrueFalse',
      stem: 'A compiler turns source into machine code.',
      correctAnswer: 'True',
      marks: 1,
    })
    await createLecturerQuestion(institutionId, lecturerActor, {
      courseId,
      topic: 'ShortPool',
      type: 'TrueFalse',
      stem: 'A flowchart can show the order of steps.',
      correctAnswer: 'True',
      marks: 1,
    })
    const quiz = await createLecturerAssessment(institutionId, lecturerActor, {
      offeringId,
      title: 'Short pool quiz',
      type: 'Quiz',
      weight: 5,
      totalMarks: 3,
      publish: true,
    })
    await expect(
      saveLecturerAssessmentItems(institutionId, lecturerActor, quiz.id, {
        items: [
          { questionId: first.id },
          { drawTopic: 'ShortPool', drawCourseId: courseId, drawCount: 2 },
        ],
      }),
    ).rejects.toThrow(/only has 1 unused question/i)
  })

  it('saves a grade that always counts and writes a draft result batch', async () => {
    const work = await createLecturerAssessment(institutionId, lecturerActor, {
      offeringId,
      title: 'Lab write-up',
      type: 'Coursework',
      weight: 20,
      totalMarks: 10,
      publish: true,
    })
    const detail = await getLecturerAssessment(institutionId, lecturerActor.id, work.id)
    expect(detail.components).toEqual([])
    expect(detail.submissions[0]?.isLate).toBe(false)
    const graded = await saveLecturerGrade(institutionId, lecturerActor, work.id, {
      studentId: detail.submissions[0]!.studentId,
      score: 8,
      feedback: 'Clear steps.',
    })
    expect(graded.submissions[0]?.score).toBe(8)
    expect(graded.submissions[0]?.status).toBe('Graded')
  })

  it('deletes an empty assessment and refuses one that already has marks', async () => {
    const empty = await createLecturerAssessment(institutionId, lecturerActor, {
      offeringId,
      title: 'Spare quiz',
      type: 'Quiz',
      weight: 5,
      totalMarks: 10,
      publish: true,
    })
    await deleteLecturerAssessment(institutionId, lecturerActor, empty.id)
    const remaining = await listLecturerAssessments(institutionId, lecturerActor.id, offeringId)
    expect(remaining.some((row) => row.id === empty.id)).toBe(false)

    const marked = await createLecturerAssessment(institutionId, lecturerActor, {
      offeringId,
      title: 'Marked quiz',
      type: 'Quiz',
      weight: 5,
      totalMarks: 10,
      publish: true,
    })
    const detail = await getLecturerAssessment(institutionId, lecturerActor.id, marked.id)
    await saveLecturerGrade(institutionId, lecturerActor, marked.id, {
      studentId: detail.submissions[0]!.studentId,
      score: 4,
    })
    await expect(deleteLecturerAssessment(institutionId, lecturerActor, marked.id)).rejects.toThrow(/already has marks/i)
  })

  it('pins generated questions onto an existing assessment for that course', async () => {
    const previous = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    resetEnvCache()
    try {
      const paper = await createLecturerAssessment(institutionId, lecturerActor, {
        offeringId,
        title: 'AI paper',
        type: 'Quiz',
        weight: 5,
        totalMarks: 10,
        publish: true,
      })
      const result = await generateLecturerQuestions(institutionId, lecturerActor, {
        offeringId,
        topic: 'PinnedGen',
        count: 2,
        types: ['TrueFalse'],
        assessmentId: paper.id,
      })
      expect(result.assessment?.id).toBe(paper.id)
      expect(result.questions.length).toBe(2)
      const items = await listLecturerAssessmentItems(institutionId, lecturerActor.id, paper.id)
      expect(items.filter((row) => row.questionId).length).toBeGreaterThanOrEqual(2)
    } finally {
      if (previous) process.env.OPENAI_API_KEY = previous
      else delete process.env.OPENAI_API_KEY
      resetEnvCache()
    }
  })
})
