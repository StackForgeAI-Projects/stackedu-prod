import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { courses, semesters } from './academic'
import { attendanceStatusEnum, liveSessionStatusEnum, recordingStatusEnum, registrationStatusEnum } from './enums'
import { users } from './people'
import { students } from './students'

/**
 * Teaching and learning.
 *
 * A course is the catalogue entry; a course offering is that course actually
 * being run in a given semester. Registrations, timetables and attendance all
 * hang off the offering, not the catalogue entry.
 */

export const courseOfferings = pgTable(
  'course_offerings',
  {
    id: primaryKeyColumn(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'cascade' }),
    /** Lets an institution run two streams of the same course. */
    section: text('section').notNull().default('A'),
    capacity: integer('capacity'),
    enrolledCount: integer('enrolled_count').notNull().default(0),
    isOpenForRegistration: boolean('is_open_for_registration').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('course_offerings_key').on(t.courseId, t.semesterId, t.section),
    index('course_offerings_semester_idx').on(t.semesterId),
  ],
)

export const lecturerAssignments = pgTable(
  'lecturer_assignments',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    lecturerId: uuid('lecturer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Lead lecturers can publish results; assistants cannot. */
    isLead: boolean('is_lead').notNull().default(true),
    assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('lecturer_assignments_key').on(t.courseOfferingId, t.lecturerId),
    index('lecturer_assignments_lecturer_idx').on(t.lecturerId),
  ],
)

export const courseRegistrations = pgTable(
  'course_registrations',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    status: registrationStatusEnum('status').notNull().default('Pending'),
    registeredAt: timestamp('registered_at', { withTimezone: true, mode: 'string' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
    droppedAt: timestamp('dropped_at', { withTimezone: true, mode: 'string' }),
    rejectionReason: text('rejection_reason'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('course_registrations_key').on(t.studentId, t.courseOfferingId),
    index('course_registrations_offering_idx').on(t.courseOfferingId, t.status),
  ],
)

export const rooms = pgTable(
  'rooms',
  {
    id: primaryKeyColumn(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    building: text('building'),
    capacity: integer('capacity'),
    /** e.g. Lecture Hall, Laboratory, Studio. */
    roomType: text('room_type'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('rooms_code_key').on(t.code)],
)

export const timetableSlots = pgTable(
  'timetable_slots',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    /** 1 = Monday through 7 = Sunday, matching ISO-8601. */
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    /** e.g. Lecture, Tutorial, Practical. */
    sessionType: text('session_type').notNull().default('Lecture'),
    ...timestamps(),
  },
  (t) => [
    index('timetable_slots_offering_idx').on(t.courseOfferingId),
    index('timetable_slots_room_day_idx').on(t.roomId, t.dayOfWeek),
  ],
)

export const timetableReminders = pgTable(
  'timetable_reminders',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    timetableSlotId: uuid('timetable_slot_id')
      .notNull()
      .references(() => timetableSlots.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    notes: text('notes'),
    minutesBefore: integer('minutes_before').notNull(),
    nextFireAt: timestamp('next_fire_at', { withTimezone: true, mode: 'string' }).notNull(),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true, mode: 'string' }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('timetable_reminders_student_slot_key').on(t.studentId, t.timetableSlotId),
    index('timetable_reminders_fire_idx').on(t.nextFireAt),
  ],
)

export const attendanceSessions = pgTable(
  'attendance_sessions',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    sessionDate: date('session_date').notNull(),
    startTime: time('start_time'),
    endTime: time('end_time'),
    topic: text('topic'),
    takenBy: uuid('taken_by').references(() => users.id, { onDelete: 'set null' }),
    /** Attendance can be edited until it is closed, then it is final. */
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('attendance_sessions_key').on(t.courseOfferingId, t.sessionDate, t.startTime),
    index('attendance_sessions_date_idx').on(t.sessionDate),
  ],
)

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: primaryKeyColumn(),
    attendanceSessionId: uuid('attendance_session_id')
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull().default('Absent'),
    note: text('note'),
    recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('attendance_records_key').on(t.attendanceSessionId, t.studentId),
    index('attendance_records_student_idx').on(t.studentId),
  ],
)

/**
 * A unit of a course, holding materials in a deliberate order.
 *
 * A module may name an earlier module as its prerequisite, which keeps the
 * later one shut until a student has worked through the earlier one. Unlike
 * Canvas, the prerequisite is enough on its own: the lecturer does not also
 * have to configure completion requirements on the earlier module for the
 * lock to take effect.
 */
export const courseModules = pgTable(
  'course_modules',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    summary: text('summary'),
    /** Display order within the course, lowest first. */
    sequence: integer('sequence').notNull().default(0),
    /**
     * Must be another module on the same offering. Self-referencing, so the
     * foreign key is declared in the migration rather than inline.
     */
    prerequisiteModuleId: uuid('prerequisite_module_id'),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('course_modules_offering_idx').on(t.courseOfferingId, t.sequence),
    index('course_modules_prerequisite_idx').on(t.prerequisiteModuleId),
  ],
)

export const courseMaterials = pgTable(
  'course_materials',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    /**
     * The module this material belongs to. Null means it is loose in the
     * course, which is how every material created before modules existed
     * behaves, and how a lecturer who does not want modules can carry on.
     */
    moduleId: uuid('module_id').references(() => courseModules.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    /** Free-text week or unit label, kept for materials with no module row. */
    moduleName: text('module_name'),
    /** Set when the material is a page written in the portal rather than a file or link. */
    bodyText: text('body_text'),
    /** Display order within the module, lowest first. */
    sequence: integer('sequence').notNull().default(0),
    fileKey: text('file_key'),
    externalUrl: text('external_url'),
    fileSizeBytes: integer('file_size_bytes'),
    mimeType: text('mime_type'),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    downloadCount: integer('download_count').notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    index('course_materials_offering_idx').on(t.courseOfferingId, t.isPublished),
    index('course_materials_module_idx').on(t.moduleId, t.sequence),
  ],
)

/**
 * Which materials a student has opened.
 *
 * This is what makes a module prerequisite mean something: a module counts as
 * done once the student has opened every published material in it. Only the
 * first open is recorded, because the question is whether the student got to
 * the material, not how often they came back.
 */
export const courseMaterialViews = pgTable(
  'course_material_views',
  {
    id: primaryKeyColumn(),
    materialId: uuid('material_id')
      .notNull()
      .references(() => courseMaterials.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    firstViewedAt: timestamp('first_viewed_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('course_material_views_key').on(t.materialId, t.studentId),
    index('course_material_views_student_idx').on(t.studentId),
  ],
)

export const announcements = pgTable(
  'announcements',
  {
    id: primaryKeyColumn(),
    /** Null means the announcement is institution-wide. */
    courseOfferingId: uuid('course_offering_id').references(() => courseOfferings.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** Roles this announcement is aimed at; empty means everyone. */
    audienceRoles: text('audience_roles').array().notNull().default([]),
    isPinned: boolean('is_pinned').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('announcements_offering_idx').on(t.courseOfferingId),
    index('announcements_published_idx').on(t.publishedAt),
  ],
)

export const liveSessions = pgTable(
  'live_sessions',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: liveSessionStatusEnum('status').notNull().default('Scheduled'),
    /** LiveKit room name. Generic so Cloud vs self-host is only an env change. */
    roomName: text('room_name').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'string' }),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'string' }),
    startedBy: uuid('started_by').references(() => users.id, { onDelete: 'set null' }),
    whiteboardFileKey: text('whiteboard_file_key'),
    summaryText: text('summary_text'),
    summaryPublishedAt: timestamp('summary_published_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('live_sessions_room_key').on(t.roomName),
    index('live_sessions_offering_idx').on(t.courseOfferingId, t.createdAt),
    index('live_sessions_status_idx').on(t.status),
  ],
)

export const liveSessionParticipants = pgTable(
  'live_session_participants',
  {
    id: primaryKeyColumn(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => liveSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('participant'),
    joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('live_session_participants_key').on(t.sessionId, t.userId),
    index('live_session_participants_user_idx').on(t.userId),
  ],
)

export const sessionRecordings = pgTable(
  'session_recordings',
  {
    id: primaryKeyColumn(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => liveSessions.id, { onDelete: 'cascade' }),
    fileKey: text('file_key'),
    fileName: text('file_name'),
    mimeType: text('mime_type'),
    byteSize: integer('byte_size'),
    durationSeconds: integer('duration_seconds'),
    /** Provider job id from the media server, not a Cloud-specific type. */
    jobId: text('job_id'),
    status: recordingStatusEnum('status').notNull().default('Pending'),
    ...timestamps(),
  },
  (t) => [index('session_recordings_session_idx').on(t.sessionId, t.createdAt)],
)
