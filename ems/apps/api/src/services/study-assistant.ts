import { and, asc, eq } from 'drizzle-orm'
import type { StudyAssistantRequest, StudyAssistantResponse, UserRole } from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import { courses } from '../db/institution/schema/academic'
import { assessments } from '../db/institution/schema/assessment'
import { libraryResources } from '../db/institution/schema/library'
import {
  courseMaterials,
  courseOfferings,
  courseRegistrations,
} from '../db/institution/schema/teaching'
import { completePlainText } from '../lib/ai-complete'
import { extractTextSample } from '../lib/text-sample'
import { forbidden } from '../lib/errors'
import { readStoredObjectSample } from '../lib/storage'
import { requireStudent } from './student'

const GRADED_WORK = /\b(answer\s+key|mark\s*scheme|exam\s+question|quiz\s+question|what\s+is\s+the\s+correct|write\s+my\s+(assignment|essay)|do\s+this\s+quiz)\b/i

export async function askStudyAssistant(
  institutionId: string,
  userId: string,
  _role: UserRole,
  input: StudyAssistantRequest,
): Promise<StudyAssistantResponse> {
  const profile = await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [enrolled] = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(courseRegistrations)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseRegistrations.courseOfferingId, input.offeringId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .limit(1)
  if (!enrolled) throw forbidden('You are not enrolled on that course.')

  const openAssessments = await db
    .select({ title: assessments.title })
    .from(assessments)
    .where(and(eq(assessments.courseOfferingId, input.offeringId), eq(assessments.isPublished, true)))
  if (GRADED_WORK.test(input.message) && openAssessments.length > 0) {
    return {
      reply: 'I can help you study the course materials, but I will not answer graded quizzes or write assignments for you. Open the published readings and try the questions yourself.',
      citations: [],
      refused: true,
    }
  }

  const materials = await db
    .select({
      title: courseMaterials.title,
      bodyText: courseMaterials.bodyText,
      fileKey: courseMaterials.fileKey,
      mimeType: courseMaterials.mimeType,
    })
    .from(courseMaterials)
    .where(and(eq(courseMaterials.courseOfferingId, input.offeringId), eq(courseMaterials.isPublished, true)))
    .orderBy(asc(courseMaterials.sequence))

  const citations: StudyAssistantResponse['citations'] = []
  const excerpts: string[] = []
  for (const material of materials.slice(0, 6)) {
    citations.push({ title: material.title, kind: 'material' })
    if (material.bodyText?.trim()) excerpts.push(`${material.title}: ${material.bodyText.slice(0, 400)}`)
    else if (material.fileKey) {
      try {
        const bytes = await readStoredObjectSample(material.fileKey, 12_000)
        excerpts.push(`${material.title}: ${extractTextSample(bytes, material.mimeType ?? '').slice(0, 400)}`)
      } catch {
        excerpts.push(material.title)
      }
    } else {
      excerpts.push(material.title)
    }
  }

  const library = await db
    .select({ title: libraryResources.title })
    .from(libraryResources)
    .where(eq(libraryResources.isPublished, true))
    .limit(5)
  for (const item of library) {
    citations.push({ title: item.title, kind: 'library' })
  }

  const fallback = excerpts[0]
    ? `From ${enrolled.courseCode}: ${excerpts[0].slice(0, 280)} Open the cited materials for the full reading.`
    : `I do not have published materials for ${enrolled.courseCode} yet. Ask your lecturer to publish a reading, or try the e-library catalogue.`

  const reply = await completePlainText({
    institutionId,
    userId,
    feature: 'study.assistant',
    system:
      'You are a study assistant for enrolled course materials and library titles. Cite those sources. Refuse to answer graded quizzes, exams, or to write assignments. Plain sentences. No markdown.',
    prompt: [
      `Course: ${enrolled.courseCode} ${enrolled.courseName}`,
      `Student question: ${input.message}`,
      excerpts.length ? `Materials:\n${excerpts.join('\n')}` : null,
      library.length ? `Library titles: ${library.map((item) => item.title).join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    fallback,
    maxTokens: 320,
  })

  return { reply, citations, refused: false }
}
