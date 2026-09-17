import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { courses, semesters } from './academic'
import { assessmentTypeEnum, gradeEnum, questionTypeEnum, resultBatchStatusEnum, submissionStatusEnum } from './enums'
import { users } from './people'
import { students } from './students'
import { courseOfferings } from './teaching'

/**
 * Assessment.
 *
 * Marks are entered by lecturers, gathered into a batch, reviewed, and only
 * then published to students. Nothing becomes visible to a student until the
 * batch holding it reaches Published.
 */

export const assessments = pgTable(
  'assessments',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    type: assessmentTypeEnum('type').notNull(),
    /** Share of the final course grade, as a percentage. */
    weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
    totalMarks: numeric('total_marks', { precision: 6, scale: 2 }).notNull(),
    dueAt: timestamp('due_at', { withTimezone: true, mode: 'string' }),
    /** Whether students submit a file through the portal for this assessment. */
    acceptsSubmissions: boolean('accepts_submissions').notNull().default(false),
    allowLateSubmission: boolean('allow_late_submission').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [index('assessments_offering_idx').on(t.courseOfferingId)],
)

/** Lets one assessment be marked out of several parts, e.g. Q1, Q2, Q3. */
export const assessmentComponents = pgTable(
  'assessment_components',
  {
    id: primaryKeyColumn(),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    maxScore: numeric('max_score', { precision: 6, scale: 2 }).notNull(),
    sequence: integer('sequence').notNull().default(1),
    ...timestamps(),
  },
  (t) => [uniqueIndex('assessment_components_key').on(t.assessmentId, t.name)],
)

export const submissions = pgTable(
  'submissions',
  {
    id: primaryKeyColumn(),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    status: submissionStatusEnum('status').notNull().default('Draft'),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }),
    textResponse: text('text_response'),
    /** Recorded at submission time so a later deadline change cannot rewrite history. */
    isLate: boolean('is_late').notNull().default(false),
    attemptNumber: integer('attempt_number').notNull().default(1),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('submissions_key').on(t.assessmentId, t.studentId, t.attemptNumber),
    index('submissions_student_idx').on(t.studentId),
    index('submissions_status_idx').on(t.status),
  ],
)

export const submissionFiles = pgTable(
  'submission_files',
  {
    id: primaryKeyColumn(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileKey: text('file_key').notNull(),
    fileSizeBytes: integer('file_size_bytes'),
    mimeType: text('mime_type'),
    createdAt: timestamps().createdAt,
  },
  (t) => [index('submission_files_submission_idx').on(t.submissionId)],
)

/** A mark for one student on one assessment. */
export const grades = pgTable(
  'grades',
  {
    id: primaryKeyColumn(),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    submissionId: uuid('submission_id').references(() => submissions.id, { onDelete: 'set null' }),
    score: numeric('score', { precision: 6, scale: 2 }),
    /** Per-component breakdown, mirroring assessment_components. */
    componentScores: jsonb('component_scores').$type<Record<string, number>>(),
    feedback: text('feedback'),
    gradedBy: uuid('graded_by').references(() => users.id, { onDelete: 'set null' }),
    gradedAt: timestamp('graded_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('grades_key').on(t.assessmentId, t.studentId),
    index('grades_student_idx').on(t.studentId),
  ],
)

/**
 * A batch is the unit that gets reviewed and published — an academic admin
 * approves a whole course's results at once, never one student at a time.
 */
export const resultBatches = pgTable(
  'result_batches',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'restrict' }),
    status: resultBatchStatusEnum('status').notNull().default('Draft'),
    submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'set null' }),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
    publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    rejectionReason: text('rejection_reason'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('result_batches_offering_key').on(t.courseOfferingId),
    index('result_batches_status_idx').on(t.status),
  ],
)

/** The final grade for one student in one course, once the batch is published. */
export const results = pgTable(
  'results',
  {
    id: primaryKeyColumn(),
    resultBatchId: uuid('result_batch_id')
      .notNull()
      .references(() => resultBatches.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    totalScore: numeric('total_score', { precision: 6, scale: 2 }),
    grade: gradeEnum('grade'),
    gradePoint: numeric('grade_point', { precision: 4, scale: 2 }),
    creditsEarned: integer('credits_earned').notNull().default(0),
    isPassed: boolean('is_passed').notNull().default(false),
    /** Set when a student sits a supplementary paper for this course. */
    isSupplementary: boolean('is_supplementary').notNull().default(false),
    remarks: text('remarks'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('results_key').on(t.studentId, t.courseOfferingId),
    index('results_batch_idx').on(t.resultBatchId),
  ],
)

/**
 * A generated transcript document. Stored rather than rebuilt on demand so the
 * copy a student was given can always be reproduced exactly.
 */
export const transcripts = pgTable(
  'transcripts',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    /** Official transcripts are signed and sealed; unofficial ones are watermarked. */
    isOfficial: boolean('is_official').notNull().default(false),
    fileKey: text('file_key'),
    /** Lets a third party confirm the document is genuine. */
    verificationCode: text('verification_code'),
    generatedBy: uuid('generated_by').references(() => users.id, { onDelete: 'set null' }),
    generatedAt: timestamp('generated_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    index('transcripts_student_idx').on(t.studentId),
    uniqueIndex('transcripts_verification_key').on(t.verificationCode),
  ],
)

/** Point-in-time GPA, so a student's progress can be charted over semesters. */
export const gpaSnapshots = pgTable(
  'gpa_snapshots',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'cascade' }),
    semesterGpa: numeric('semester_gpa', { precision: 4, scale: 2 }).notNull(),
    cgpa: numeric('cgpa', { precision: 4, scale: 2 }).notNull(),
    creditsEarned: integer('credits_earned').notNull().default(0),
    cumulativeCredits: integer('cumulative_credits').notNull().default(0),
    classRank: integer('class_rank'),
    createdAt: timestamps().createdAt,
  },
  (t) => [uniqueIndex('gpa_snapshots_key').on(t.studentId, t.semesterId)],
)

/**
 * Institution-owned question bank. Tagged by catalogue course and topic so a
 * quiz can draw a random subset without copying questions into the quiz row.
 * Versions exist because an edit after a student has answered must not rewrite
 * the paper they sat.
 */
export const questions = pgTable(
  'questions',
  {
    id: primaryKeyColumn(),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
    topic: text('topic').notNull().default(''),
    type: questionTypeEnum('type').notNull(),
    currentVersion: integer('current_version').notNull().default(1),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('questions_course_idx').on(t.courseId, t.topic),
    index('questions_topic_idx').on(t.topic),
  ],
)

export const questionVersions = pgTable(
  'question_versions',
  {
    id: primaryKeyColumn(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    stem: text('stem').notNull(),
    options: jsonb('options').$type<string[]>(),
    correctAnswer: text('correct_answer').notNull(),
    marks: numeric('marks', { precision: 6, scale: 2 }).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    uniqueIndex('question_versions_key').on(t.questionId, t.version),
    index('question_versions_question_idx').on(t.questionId),
  ],
)

export const assessmentItems = pgTable(
  'assessment_items',
  {
    id: primaryKeyColumn(),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull().default(0),
    questionId: uuid('question_id').references(() => questions.id, { onDelete: 'restrict' }),
    questionVersionId: uuid('question_version_id').references(() => questionVersions.id, {
      onDelete: 'restrict',
    }),
    drawTopic: text('draw_topic'),
    drawCourseId: uuid('draw_course_id').references(() => courses.id, { onDelete: 'set null' }),
    drawCount: integer('draw_count'),
    ...timestamps(),
  },
  (t) => [index('assessment_items_assessment_idx').on(t.assessmentId, t.sequence)],
)

export const submissionQuestionPicks = pgTable(
  'submission_question_picks',
  {
    id: primaryKeyColumn(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    questionVersionId: uuid('question_version_id')
      .notNull()
      .references(() => questionVersions.id, { onDelete: 'restrict' }),
    sequence: integer('sequence').notNull().default(0),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    uniqueIndex('submission_question_picks_key').on(t.submissionId, t.questionVersionId),
    index('submission_question_picks_submission_idx').on(t.submissionId),
  ],
)

export const submissionAnswers = pgTable(
  'submission_answers',
  {
    id: primaryKeyColumn(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    questionVersionId: uuid('question_version_id')
      .notNull()
      .references(() => questionVersions.id, { onDelete: 'restrict' }),
    response: text('response').notNull(),
    isCorrect: boolean('is_correct'),
    score: numeric('score', { precision: 6, scale: 2 }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('submission_answers_key').on(t.submissionId, t.questionVersionId),
    index('submission_answers_submission_idx').on(t.submissionId),
  ],
)
