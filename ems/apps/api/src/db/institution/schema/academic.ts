import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { semesterStatusEnum } from './enums'
import { users } from './people'

/** The academic structure: who teaches what, and when the year runs. */

export const faculties = pgTable(
  'faculties',
  {
    id: primaryKeyColumn(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    deanId: uuid('dean_id').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('faculties_code_key').on(t.code)],
)

export const departments = pgTable(
  'departments',
  {
    id: primaryKeyColumn(),
    facultyId: uuid('faculty_id')
      .notNull()
      .references(() => faculties.id, { onDelete: 'restrict' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    headId: uuid('head_id').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('departments_code_key').on(t.code),
    index('departments_faculty_idx').on(t.facultyId),
  ],
)

export const programmes = pgTable(
  'programmes',
  {
    id: primaryKeyColumn(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    /** Award level, e.g. Certificate, Diploma, Bachelor, Master. */
    level: text('level').notNull(),
    durationYears: integer('duration_years').notNull(),
    totalCreditsRequired: integer('total_credits_required').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('programmes_code_key').on(t.code),
    index('programmes_department_idx').on(t.departmentId),
  ],
)

/** What a student must complete, per year of study, to progress. */
export const programmeRequirements = pgTable(
  'programme_requirements',
  {
    id: primaryKeyColumn(),
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programmes.id, { onDelete: 'cascade' }),
    yearOfStudy: integer('year_of_study').notNull(),
    minimumCredits: integer('minimum_credits').notNull(),
    /** Credits that must come from compulsory courses. */
    coreCredits: integer('core_credits').notNull().default(0),
    electiveCredits: integer('elective_credits').notNull().default(0),
    ...timestamps(),
  },
  (t) => [uniqueIndex('programme_requirements_key').on(t.programmeId, t.yearOfStudy)],
)

export const academicYears = pgTable(
  'academic_years',
  {
    id: primaryKeyColumn(),
    /** Label as printed on documents, e.g. 2025/2026. */
    name: text('name').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isCurrent: boolean('is_current').notNull().default(false),
    ...timestamps(),
  },
  (t) => [uniqueIndex('academic_years_name_key').on(t.name)],
)

export const semesters = pgTable(
  'semesters',
  {
    id: primaryKeyColumn(),
    academicYearId: uuid('academic_year_id')
      .notNull()
      .references(() => academicYears.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sequence: integer('sequence').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    registrationOpensAt: date('registration_opens_at'),
    registrationClosesAt: date('registration_closes_at'),
    /** Credit cap students may register this semester. Academic Admin can change it. */
    maxCredits: integer('max_credits').notNull().default(21),
    status: semesterStatusEnum('status').notNull().default('Planned'),
    isCurrent: boolean('is_current').notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('semesters_year_sequence_key').on(t.academicYearId, t.sequence),
    index('semesters_current_idx').on(t.isCurrent),
  ],
)

export const courses = pgTable(
  'courses',
  {
    id: primaryKeyColumn(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    credits: integer('credits').notNull(),
    /** Which year of a programme this course normally belongs to. */
    yearOfStudy: integer('year_of_study'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('courses_code_key').on(t.code),
    index('courses_department_idx').on(t.departmentId),
  ],
)

export const coursePrerequisites = pgTable(
  'course_prerequisites',
  {
    id: primaryKeyColumn(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    prerequisiteCourseId: uuid('prerequisite_course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    /** An advisory prerequisite warns the student; a hard one blocks registration. */
    isMandatory: boolean('is_mandatory').notNull().default(true),
    createdAt: timestamps().createdAt,
  },
  (t) => [uniqueIndex('course_prerequisites_key').on(t.courseId, t.prerequisiteCourseId)],
)

export const academicCalendarEvents = pgTable(
  'academic_calendar_events',
  {
    id: primaryKeyColumn(),
    semesterId: uuid('semester_id').references(() => semesters.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    /** e.g. Registration, Examination, Holiday, Deadline. */
    category: text('category').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    isPublished: boolean('is_published').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('academic_calendar_events_semester_idx').on(t.semesterId),
    index('academic_calendar_events_date_idx').on(t.startDate),
  ],
)
