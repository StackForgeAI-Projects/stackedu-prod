import { and, asc, count, eq, inArray, sql } from 'drizzle-orm'
import type {
  CreateLecturerQuestionRequest,
  GenerateLecturerQuestionsRequest,
  LecturerAssessmentItem,
  LecturerAssessmentRow,
  LecturerQuestion,
  ReserveLecturerQuestionImportRequest,
  SaveLecturerAssessmentItemsRequest,
  StudentQuizQuestion,
  SubmitAssessmentRequest,
  UpdateLecturerQuestionRequest,
  UserRole,
} from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import {
  assessmentItems,
  assessments,
  grades,
  questions,
  questionVersions,
  submissionAnswers,
  submissionQuestionPicks,
  submissions,
} from '../db/institution/schema/assessment'
import { courses } from '../db/institution/schema/academic'
import { writeAudit } from '../lib/audit'
import { badRequest, conflict, notFound } from '../lib/errors'
import { completeQuestionDrafts, heuristicQuestions } from '../lib/ai-complete'
import { fetchPublicTextExcerpt } from '../lib/public-http'
import {
  buildQuestionImportFileKey,
  createUploadTarget,
  deleteStoredObject,
  readStoredObjectSample,
  type UploadTarget,
} from '../lib/storage'
import { extractTextSample } from '../lib/text-sample'
import { courseMaterials, courseOfferings, courseRegistrations } from '../db/institution/schema/teaching'
import { createLecturerAssessment, listLecturerAssessments, requireAssignedOffering, requireLecturer, syncDraftResultFromGrades } from './lecturer'

function asNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normaliseAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function assertQuestionPayload(input: {
  type: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer'
  options?: string[]
  correctAnswer: string
}): { options: string[] | null; correctAnswer: string } {
  if (input.type === 'ShortAnswer') {
    return { options: null, correctAnswer: input.correctAnswer.trim() }
  }
  const options = input.type === 'TrueFalse'
    ? ['True', 'False']
    : (input.options ?? []).map((option) => option.trim()).filter(Boolean)
  if (input.type === 'MultipleChoice' && options.length < 2) {
    throw badRequest('Add at least two options.')
  }
  const correct = input.correctAnswer.trim()
  if (!options.some((option) => option === correct)) {
    throw badRequest('The correct answer must match one of the options.')
  }
  return { options, correctAnswer: correct }
}

async function mapQuestion(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  questionId: string,
): Promise<LecturerQuestion> {
  const [row] = await db
    .select({
      id: questions.id,
      courseId: questions.courseId,
      courseCode: courses.code,
      topic: questions.topic,
      type: questions.type,
      version: questions.currentVersion,
      createdAt: questions.createdAt,
      stem: questionVersions.stem,
      options: questionVersions.options,
      correctAnswer: questionVersions.correctAnswer,
      marks: questionVersions.marks,
    })
    .from(questions)
    .innerJoin(
      questionVersions,
      and(
        eq(questionVersions.questionId, questions.id),
        eq(questionVersions.version, questions.currentVersion),
      ),
    )
    .leftJoin(courses, eq(courses.id, questions.courseId))
    .where(eq(questions.id, questionId))
    .limit(1)
  if (!row) throw notFound('That question')

  const [answered] = await db
    .select({ total: count(submissionAnswers.id) })
    .from(submissionAnswers)
    .innerJoin(questionVersions, eq(questionVersions.id, submissionAnswers.questionVersionId))
    .where(eq(questionVersions.questionId, questionId))

  return {
    id: row.id,
    courseId: row.courseId,
    courseCode: row.courseCode,
    topic: row.topic,
    type: row.type,
    version: row.version,
    stem: row.stem,
    options: row.options,
    correctAnswer: row.correctAnswer,
    marks: asNumber(row.marks) ?? 0,
    answeredCount: Number(answered?.total ?? 0),
    createdAt: row.createdAt,
  }
}

export async function listLecturerQuestions(
  institutionId: string,
  userId: string,
  filter?: { courseId?: string; topic?: string },
): Promise<LecturerQuestion[]> {
  const { db } = await requireLecturer(institutionId, userId)
  const rows = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(
        filter?.courseId ? eq(questions.courseId, filter.courseId) : undefined,
        filter?.topic ? eq(questions.topic, filter.topic) : undefined,
      ),
    )
    .orderBy(asc(questions.topic), asc(questions.createdAt))
  return Promise.all(rows.map((row) => mapQuestion(db, row.id)))
}

export async function createLecturerQuestion(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateLecturerQuestionRequest,
): Promise<LecturerQuestion> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const payload = assertQuestionPayload(input)
  const [created] = await db
    .insert(questions)
    .values({
      courseId: input.courseId ?? null,
      topic: input.topic.trim(),
      type: input.type,
      currentVersion: 1,
      createdBy: actor.id,
    })
    .returning({ id: questions.id })

  await db.insert(questionVersions).values({
    questionId: created!.id,
    version: 1,
    stem: input.stem.trim(),
    options: payload.options,
    correctAnswer: payload.correctAnswer,
    marks: input.marks.toFixed(2),
    createdBy: actor.id,
  })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'questions.write',
    targetType: 'question',
    targetId: created!.id,
    metadata: { title: input.stem.trim() },
  })

  return mapQuestion(db, created!.id)
}

export async function updateLecturerQuestion(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  questionId: string,
  input: UpdateLecturerQuestionRequest,
): Promise<LecturerQuestion> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const current = await mapQuestion(db, questionId)
  const nextType = current.type
  const payload = assertQuestionPayload({
    type: nextType,
    options: input.options ?? current.options ?? undefined,
    correctAnswer: input.correctAnswer ?? current.correctAnswer,
  })

  const [answered] = await db
    .select({ total: count(submissionAnswers.id) })
    .from(submissionAnswers)
    .innerJoin(questionVersions, eq(questionVersions.id, submissionAnswers.questionVersionId))
    .where(eq(questionVersions.questionId, questionId))
  const hasAnswers = Number(answered?.total ?? 0) > 0

  if (hasAnswers) {
    const nextVersion = current.version + 1
    await db.insert(questionVersions).values({
      questionId,
      version: nextVersion,
      stem: (input.stem ?? current.stem).trim(),
      options: payload.options,
      correctAnswer: payload.correctAnswer,
      marks: (input.marks ?? current.marks).toFixed(2),
      createdBy: actor.id,
    })
    await db
      .update(questions)
      .set({
        courseId: input.courseId === undefined ? current.courseId : input.courseId,
        topic: input.topic?.trim() ?? current.topic,
        currentVersion: nextVersion,
      })
      .where(eq(questions.id, questionId))
  } else {
    const [versionRow] = await db
      .select({ id: questionVersions.id })
      .from(questionVersions)
      .where(and(eq(questionVersions.questionId, questionId), eq(questionVersions.version, current.version)))
      .limit(1)
    await db
      .update(questionVersions)
      .set({
        stem: (input.stem ?? current.stem).trim(),
        options: payload.options,
        correctAnswer: payload.correctAnswer,
        marks: (input.marks ?? current.marks).toFixed(2),
      })
      .where(eq(questionVersions.id, versionRow!.id))
    await db
      .update(questions)
      .set({
        courseId: input.courseId === undefined ? current.courseId : input.courseId,
        topic: input.topic?.trim() ?? current.topic,
      })
      .where(eq(questions.id, questionId))
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'questions.write',
    targetType: 'question',
    targetId: questionId,
    metadata: { title: (input.stem ?? current.stem).trim(), versioned: hasAnswers },
  })

  return mapQuestion(db, questionId)
}

export async function deleteLecturerQuestion(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  questionId: string,
): Promise<void> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const current = await mapQuestion(db, questionId)
  if (current.answeredCount > 0) {
    throw conflict('This question has been answered. Leave it in the bank so past papers stay intact.')
  }
  const [used] = await db
    .select({ id: assessmentItems.id })
    .from(assessmentItems)
    .where(eq(assessmentItems.questionId, questionId))
    .limit(1)
  if (used) throw conflict('Remove this question from quizzes before deleting it.')

  await db.delete(questions).where(eq(questions.id, questionId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'questions.delete',
    targetType: 'question',
    targetId: questionId,
    metadata: { title: current.stem },
  })
}

export async function listLecturerAssessmentItems(
  institutionId: string,
  userId: string,
  assessmentId: string,
): Promise<LecturerAssessmentItem[]> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const [assessment] = await db
    .select({ offeringId: assessments.courseOfferingId })
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1)
  if (!assessment) throw notFound('That assignment')
  await requireAssignedOffering(db, user.id, assessment.offeringId)

  const rows = await db
    .select({
      id: assessmentItems.id,
      sequence: assessmentItems.sequence,
      questionId: assessmentItems.questionId,
      questionVersionId: assessmentItems.questionVersionId,
      drawTopic: assessmentItems.drawTopic,
      drawCourseId: assessmentItems.drawCourseId,
      drawCount: assessmentItems.drawCount,
      stem: questionVersions.stem,
      type: questions.type,
      marks: questionVersions.marks,
    })
    .from(assessmentItems)
    .leftJoin(questionVersions, eq(questionVersions.id, assessmentItems.questionVersionId))
    .leftJoin(questions, eq(questions.id, assessmentItems.questionId))
    .where(eq(assessmentItems.assessmentId, assessmentId))
    .orderBy(asc(assessmentItems.sequence), asc(assessmentItems.createdAt))

  return rows.map((row) => ({
    id: row.id,
    sequence: row.sequence,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    stem: row.stem,
    type: row.type,
    marks: asNumber(row.marks),
    drawTopic: row.drawTopic,
    drawCourseId: row.drawCourseId,
    drawCount: row.drawCount,
  }))
}

export async function saveLecturerAssessmentItems(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  assessmentId: string,
  input: SaveLecturerAssessmentItemsRequest,
): Promise<LecturerAssessmentItem[]> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const [assessment] = await db
    .select({ offeringId: assessments.courseOfferingId })
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1)
  if (!assessment) throw notFound('That assignment')
  await requireAssignedOffering(db, actor.id, assessment.offeringId)

  const questionIds = input.items.map((item) => item.questionId).filter(Boolean) as string[]
  const versionByQuestion = new Map<string, string>()
  if (questionIds.length > 0) {
    const versionRows = await db
      .select({
        questionId: questions.id,
        versionId: questionVersions.id,
        version: questions.currentVersion,
        current: questionVersions.version,
      })
      .from(questions)
      .innerJoin(
        questionVersions,
        and(eq(questionVersions.questionId, questions.id), eq(questionVersions.version, questions.currentVersion)),
      )
      .where(inArray(questions.id, questionIds))
    for (const row of versionRows) versionByQuestion.set(row.questionId, row.versionId)
  if (versionByQuestion.size !== new Set(questionIds).size) {
      throw badRequest('Choose questions from the institution bank.')
    }
  }

  await assertDrawPool(db, input)

  await db.delete(assessmentItems).where(eq(assessmentItems.assessmentId, assessmentId))
  if (input.items.length > 0) {
    await db.insert(assessmentItems).values(
      input.items.map((item, index) => ({
        assessmentId,
        sequence: index,
        questionId: item.questionId ?? null,
        questionVersionId: item.questionId ? versionByQuestion.get(item.questionId) ?? null : null,
        drawTopic: item.drawTopic?.trim() || null,
        drawCourseId: item.drawCourseId ?? null,
        drawCount: item.drawCount ?? null,
      })),
    )
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'questions.write',
    targetType: 'assessment',
    targetId: assessmentId,
    metadata: { itemCount: input.items.length },
  })

  return listLecturerAssessmentItems(institutionId, actor.id, assessmentId)
}

export async function countAssessmentItems(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  assessmentIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (assessmentIds.length === 0) return counts
  const rows = await db
    .select({
      assessmentId: assessmentItems.assessmentId,
      total: sql<number>`coalesce(sum(coalesce(${assessmentItems.drawCount}, 1)), 0)`,
    })
    .from(assessmentItems)
    .where(inArray(assessmentItems.assessmentId, assessmentIds))
    .groupBy(assessmentItems.assessmentId)
  for (const row of rows) counts.set(row.assessmentId, Number(row.total))
  return counts
}

async function enrolledAssessment(
  institutionId: string,
  studentId: string,
  assessmentId: string,
) {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      offeringId: assessments.courseOfferingId,
      title: assessments.title,
      description: assessments.description,
      dueAt: assessments.dueAt,
      acceptsSubmissions: assessments.acceptsSubmissions,
      isPublished: assessments.isPublished,
      courseCode: courses.code,
      courseName: courses.name,
      registrationId: courseRegistrations.id,
    })
    .from(assessments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(
      courseRegistrations,
      and(
        eq(courseRegistrations.courseOfferingId, courseOfferings.id),
        eq(courseRegistrations.studentId, studentId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .where(eq(assessments.id, assessmentId))
    .limit(1)
  if (!row || !row.isPublished) throw notFound('That assignment')
  return { db, ...row }
}

async function resolvePicks(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  assessmentId: string,
  submissionId: string,
): Promise<Array<{ questionVersionId: string; sequence: number }>> {
  const existing = await db
    .select({
      questionVersionId: submissionQuestionPicks.questionVersionId,
      sequence: submissionQuestionPicks.sequence,
    })
    .from(submissionQuestionPicks)
    .where(eq(submissionQuestionPicks.submissionId, submissionId))
    .orderBy(asc(submissionQuestionPicks.sequence))
  if (existing.length > 0) return existing

  const items = await db
    .select()
    .from(assessmentItems)
    .where(eq(assessmentItems.assessmentId, assessmentId))
    .orderBy(asc(assessmentItems.sequence))

  const picks: Array<{ questionVersionId: string; sequence: number }> = []
  const used = new Set<string>()
  let sequence = 0

  for (const item of items) {
    if (item.questionVersionId) {
      if (used.has(item.questionVersionId)) continue
      used.add(item.questionVersionId)
      picks.push({ questionVersionId: item.questionVersionId, sequence: sequence++ })
      continue
    }
    if (!item.drawTopic || !item.drawCount) continue
    const pool = await db
      .select({ versionId: questionVersions.id })
      .from(questions)
      .innerJoin(
        questionVersions,
        and(eq(questionVersions.questionId, questions.id), eq(questionVersions.version, questions.currentVersion)),
      )
      .where(
        and(
          eq(questions.topic, item.drawTopic),
          item.drawCourseId ? eq(questions.courseId, item.drawCourseId) : undefined,
        ),
      )
    const unused = pool.filter((row) => !used.has(row.versionId))
    const shuffled = unused.sort(() => Math.random() - 0.5).slice(0, item.drawCount)
    if (shuffled.length < item.drawCount) {
      throw badRequest(
        drawShortageMessage(item.drawTopic, unused.length, item.drawCount),
      )
    }
    for (const row of shuffled) {
      used.add(row.versionId)
      picks.push({ questionVersionId: row.versionId, sequence: sequence++ })
    }
  }

  if (picks.length > 0) {
    await db.insert(submissionQuestionPicks).values(
      picks.map((pick) => ({
        submissionId,
        questionVersionId: pick.questionVersionId,
        sequence: pick.sequence,
      })),
    )
  }
  return picks
}

async function ensureDraftSubmission(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  assessmentId: string,
  studentId: string,
): Promise<{ id: string; status: string }> {
  const [existing] = await db
    .select({ id: submissions.id, status: submissions.status })
    .from(submissions)
    .where(and(eq(submissions.assessmentId, assessmentId), eq(submissions.studentId, studentId)))
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(submissions)
    .values({
      assessmentId,
      studentId,
      status: 'Draft',
      attemptNumber: 1,
    })
    .returning({ id: submissions.id, status: submissions.status })
  return created!
}

export async function getStudentQuiz(
  institutionId: string,
  studentId: string,
  assessmentId: string,
): Promise<{ questions: StudentQuizQuestion[]; submitted: boolean; score: number | null }> {
  const { db } = await enrolledAssessment(institutionId, studentId, assessmentId)
  const submission = await ensureDraftSubmission(db, assessmentId, studentId)
  const submitted = submission.status !== 'Draft'
  const picks = await resolvePicks(db, assessmentId, submission.id)
  if (picks.length === 0) {
    return { questions: [], submitted, score: null }
  }

  const versionRows = await db
    .select({
      id: questionVersions.id,
      stem: questionVersions.stem,
      options: questionVersions.options,
      marks: questionVersions.marks,
      type: questions.type,
    })
    .from(questionVersions)
    .innerJoin(questions, eq(questions.id, questionVersions.questionId))
    .where(inArray(questionVersions.id, picks.map((pick) => pick.questionVersionId)))
  const byId = new Map(versionRows.map((row) => [row.id, row]))

  const answerRows = await db
    .select({
      questionVersionId: submissionAnswers.questionVersionId,
      response: submissionAnswers.response,
    })
    .from(submissionAnswers)
    .where(eq(submissionAnswers.submissionId, submission.id))
  const answerById = new Map(answerRows.map((row) => [row.questionVersionId, row.response]))

  const [grade] = submitted
    ? await db
        .select({ score: grades.score })
        .from(grades)
        .where(and(eq(grades.assessmentId, assessmentId), eq(grades.studentId, studentId)))
        .limit(1)
    : []

  return {
    submitted,
    score: asNumber(grade?.score ?? null),
    questions: picks.map((pick) => {
      const version = byId.get(pick.questionVersionId)
      if (!version) throw notFound('That question')
      return {
        questionVersionId: pick.questionVersionId,
        sequence: pick.sequence,
        type: version.type,
        stem: version.stem,
        options: version.options,
        marks: asNumber(version.marks) ?? 0,
        response: answerById.get(pick.questionVersionId) ?? null,
      }
    }),
  }
}

export async function submitStudentQuiz(
  institutionId: string,
  studentId: string,
  assessmentId: string,
  input: SubmitAssessmentRequest,
): Promise<{ score: number }> {
  const { db, offeringId } = await enrolledAssessment(institutionId, studentId, assessmentId)
  const submission = await ensureDraftSubmission(db, assessmentId, studentId)
  if (submission.status !== 'Draft') throw conflict('You have already submitted this assignment.')

  const picks = await resolvePicks(db, assessmentId, submission.id)
  if (picks.length === 0) throw badRequest('This assignment has no quiz questions.')
  const answers = new Map((input.answers ?? []).map((row) => [row.questionVersionId, row.response]))
  for (const pick of picks) {
    if (!answers.get(pick.questionVersionId)?.trim()) {
      throw badRequest('Answer every question before submitting.')
    }
  }

  const versionRows = await db
    .select({
      id: questionVersions.id,
      correctAnswer: questionVersions.correctAnswer,
      marks: questionVersions.marks,
    })
    .from(questionVersions)
    .where(inArray(questionVersions.id, picks.map((pick) => pick.questionVersionId)))
  const byId = new Map(versionRows.map((row) => [row.id, row]))

  let total = 0
  await db.delete(submissionAnswers).where(eq(submissionAnswers.submissionId, submission.id))
  await db.insert(submissionAnswers).values(
    picks.map((pick) => {
      const version = byId.get(pick.questionVersionId)!
      const response = answers.get(pick.questionVersionId)!.trim()
      const isCorrect = normaliseAnswer(response) === normaliseAnswer(version.correctAnswer)
      const score = isCorrect ? asNumber(version.marks) ?? 0 : 0
      total += score
      return {
        submissionId: submission.id,
        questionVersionId: pick.questionVersionId,
        response,
        isCorrect,
        score: score.toFixed(2),
      }
    }),
  )

  await db
    .update(submissions)
    .set({
      status: 'Graded',
      submittedAt: new Date().toISOString(),
      textResponse: input.textResponse?.trim() || null,
    })
    .where(eq(submissions.id, submission.id))

  await db
    .insert(grades)
    .values({
      assessmentId,
      studentId,
      submissionId: submission.id,
      score: total.toFixed(2),
      feedback: 'Auto-marked from the question bank.',
      gradedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [grades.assessmentId, grades.studentId],
      set: {
        submissionId: submission.id,
        score: total.toFixed(2),
        feedback: 'Auto-marked from the question bank.',
        gradedAt: new Date().toISOString(),
      },
    })

  await syncDraftResultFromGrades(db, institutionId, offeringId, studentId)

  return { score: total }
}

export function drawShortageMessage(topic: string, unused: number, wanted: number): string {
  const available = unused === 1 ? '1 unused question' : `${unused} unused questions`
  return `“${topic}” only has ${available}. You asked to draw ${wanted}. Pin fewer of those questions, or lower the random draw.`
}

async function assertDrawPool(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  input: SaveLecturerAssessmentItemsRequest,
): Promise<void> {
  const draws = input.items.filter((item) => item.drawTopic && item.drawCount)
  if (draws.length === 0) return

  const pinnedIds = input.items.map((item) => item.questionId).filter(Boolean) as string[]
  const remaining = new Map<string, number>()

  for (const item of draws) {
    const topic = item.drawTopic!.trim()
    const key = `${topic}::${item.drawCourseId ?? ''}`
    if (!remaining.has(key)) {
      const pool = await db
        .select({ id: questions.id })
        .from(questions)
        .where(
          and(
            eq(questions.topic, topic),
            item.drawCourseId ? eq(questions.courseId, item.drawCourseId) : undefined,
          ),
        )
      const unused = pool.filter((row) => !pinnedIds.includes(row.id)).length
      remaining.set(key, unused)
    }
    const unused = remaining.get(key) ?? 0
    const wanted = item.drawCount ?? 0
    if (unused < wanted) {
      throw badRequest(drawShortageMessage(topic, unused, wanted))
    }
    remaining.set(key, unused - wanted)
  }
}

export async function reserveLecturerQuestionImport(
  institutionId: string,
  userId: string,
  input: ReserveLecturerQuestionImportRequest,
): Promise<{ fileKey: string } & UploadTarget> {
  await requireLecturer(institutionId, userId)
  const fileKey = buildQuestionImportFileKey({ institutionId, fileName: input.fileName })
  const target = await createUploadTarget({
    fileKey,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
  })
  return { fileKey, ...target }
}

async function excerptFromCourseMaterials(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  offeringId: string,
): Promise<string> {
  const rows = await db
    .select({
      title: courseMaterials.title,
      bodyText: courseMaterials.bodyText,
      fileKey: courseMaterials.fileKey,
      mimeType: courseMaterials.mimeType,
    })
    .from(courseMaterials)
    .where(and(eq(courseMaterials.courseOfferingId, offeringId), eq(courseMaterials.isPublished, true)))
    .orderBy(asc(courseMaterials.sequence))
    .limit(6)
  const parts: string[] = []
  for (const row of rows) {
    if (row.bodyText?.trim()) {
      parts.push(`${row.title}: ${row.bodyText.slice(0, 500)}`)
      continue
    }
    if (row.fileKey) {
      try {
        const bytes = await readStoredObjectSample(row.fileKey, 12_000)
        parts.push(`${row.title}: ${extractTextSample(bytes, row.mimeType ?? '').slice(0, 500)}`)
      } catch {
        parts.push(row.title)
      }
    }
  }
  return parts.join('\n')
}

export async function generateLecturerQuestions(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: GenerateLecturerQuestionsRequest,
): Promise<{ questions: LecturerQuestion[]; assessment: LecturerAssessmentRow | null }> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, input.offeringId)

  const [course] = await db
    .select({
      courseId: courses.id,
      code: courses.code,
      name: courses.name,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, input.offeringId))
    .limit(1)
  if (!course) throw notFound('That course')

  const fileKey = input.fileKey?.trim()
  if (fileKey && !fileKey.startsWith(`institutions/${institutionId}/`)) {
    throw badRequest('That file does not belong to this institution.')
  }

  let excerpt = ''
  let url = input.externalUrl?.trim() || undefined
  try {
    if (fileKey) {
      const bytes = await readStoredObjectSample(fileKey)
      excerpt = extractTextSample(bytes, input.mimeType ?? '')
    } else if (url) {
      const fetched = await fetchPublicTextExcerpt(url)
      url = fetched.url
      excerpt = fetched.excerpt
    } else if (input.useCourseMaterials) {
      excerpt = await excerptFromCourseMaterials(db, input.offeringId)
    }
  } finally {
    if (fileKey) await deleteStoredObject(fileKey).catch(() => undefined)
  }

  const count = input.count ?? 4
  const fallback = heuristicQuestions({
    courseCode: course.code,
    courseName: course.name,
    topic: input.topic.trim(),
    types: input.types,
    count,
    excerpt,
  })
  const drafts = await completeQuestionDrafts({
    institutionId,
    userId: actor.id,
    fallback,
    prompt: [
      `Course: ${course.code} ${course.name}`,
      `Topic: ${input.topic.trim()}`,
      input.types?.length ? `Types: ${input.types.join(', ')}` : null,
      `Count: ${count}`,
      excerpt ? `Source:\n${excerpt.slice(0, 2500)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  })

  const created: LecturerQuestion[] = []
  for (const draft of drafts.slice(0, count)) {
    try {
      created.push(
        await createLecturerQuestion(institutionId, actor, {
          courseId: course.courseId,
          topic: input.topic.trim(),
          type: draft.type,
          stem: draft.stem,
          options: draft.options,
          correctAnswer: draft.correctAnswer,
          marks: draft.marks,
        }),
      )
    } catch {
      // A vendor draft that fails the bank rules is skipped; the in-built set is used if none land.
    }
  }
  if (created.length === 0) {
    for (const draft of fallback) {
      created.push(
        await createLecturerQuestion(institutionId, actor, {
          courseId: course.courseId,
          topic: input.topic.trim(),
          type: draft.type,
          stem: draft.stem,
          options: draft.options,
          correctAnswer: draft.correctAnswer,
          marks: draft.marks,
        }),
      )
    }
  }

  let assessment: LecturerAssessmentRow | null = null
  if (input.assessmentId && created.length > 0) {
    const paper = await listLecturerAssessments(institutionId, actor.id)
    const current = paper.find((row) => row.id === input.assessmentId)
    if (!current) throw notFound('That assessment')
    if (current.offeringId !== input.offeringId) {
      throw badRequest('Generate questions for the same course as this assessment.')
    }
    if (current.submittedCount > 0) {
      throw conflict('Students have already sat this assessment, so new questions cannot be added with AI.')
    }
    const existing = await listLecturerAssessmentItems(institutionId, actor.id, input.assessmentId)
    await saveLecturerAssessmentItems(institutionId, actor, input.assessmentId, {
      items: [
        ...existing.map((row) =>
          row.questionId
            ? { questionId: row.questionId }
            : { drawTopic: row.drawTopic ?? undefined, drawCourseId: row.drawCourseId, drawCount: row.drawCount ?? undefined },
        ),
        ...created.map((row) => ({ questionId: row.id })),
      ],
    })
    assessment = (await listLecturerAssessments(institutionId, actor.id, current.offeringId)).find((row) => row.id === input.assessmentId) ?? current
  } else if (input.createAssessment && created.length > 0) {
    const totalMarks = created.reduce((sum, row) => sum + row.marks, 0)
    assessment = await createLecturerAssessment(institutionId, actor, {
      offeringId: input.offeringId,
      title: input.createAssessment.title,
      type: input.createAssessment.type,
      weight: input.createAssessment.weight ?? 10,
      totalMarks: input.createAssessment.totalMarks ?? totalMarks,
      dueAt: input.createAssessment.dueAt,
      acceptsSubmissions: true,
      publish: true,
    })
    await saveLecturerAssessmentItems(institutionId, actor, assessment.id, {
      items: created.map((row) => ({ questionId: row.id })),
    })
  }

  return { questions: created, assessment }
}