import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { deliveryStatusEnum, notificationChannelEnum } from './enums'
import { courseOfferings } from './teaching'
import { assessments } from './assessment'
import { users } from './people'

/**
 * Notifications and messaging.
 *
 * A notification is the thing that happened; a delivery is one attempt to tell
 * somebody about it through one channel. Splitting them means an SMS failing
 * does not lose the in-app copy, and a retry does not duplicate the event.
 */

export const notifications = pgTable(
  'notifications',
  {
    id: primaryKeyColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** e.g. Fees, Results, Registration, System. */
    category: text('category').notNull(),
    /** Where tapping the notification should take the user. */
    actionUrl: text('action_url'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    index('notifications_user_idx').on(t.userId, t.createdAt),
    index('notifications_unread_idx').on(t.userId, t.readAt),
  ],
)

export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    id: primaryKeyColumn(),
    notificationId: uuid('notification_id')
      .notNull()
      .references(() => notifications.id, { onDelete: 'cascade' }),
    channel: notificationChannelEnum('channel').notNull(),
    /** Email address or phone number actually used, kept for support queries. */
    destination: text('destination'),
    status: deliveryStatusEnum('status').notNull().default('Queued'),
    providerMessageId: text('provider_message_id'),
    attemptCount: integer('attempt_count').notNull().default(0),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'string' }),
    failureReason: text('failure_reason'),
    ...timestamps(),
  },
  (t) => [
    index('notification_deliveries_notification_idx').on(t.notificationId),
    index('notification_deliveries_status_idx').on(t.status),
  ],
)

export const messageThreads = pgTable(
  'message_threads',
  {
    id: primaryKeyColumn(),
    subject: text('subject').notNull(),
    /** User ids taking part, so a thread can be found without scanning messages. */
    participantIds: uuid('participant_ids').array().notNull().default([]),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true, mode: 'string' }),
    isClosed: boolean('is_closed').notNull().default(false),
    ...timestamps(),
  },
  (t) => [index('message_threads_last_message_idx').on(t.lastMessageAt)],
)

export const messages = pgTable(
  'messages',
  {
    id: primaryKeyColumn(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => messageThreads.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    attachmentKeys: text('attachment_keys').array().notNull().default([]),
    readBy: uuid('read_by').array().notNull().default([]),
    ...timestamps(),
  },
  (t) => [index('messages_thread_idx').on(t.threadId, t.createdAt)],
)

/**
 * Per-course discussion boards. Separate from announcements (one-way) and from
 * private message threads. A graded discussion points at an assessment so marks
 * reuse the existing grade tables.
 */
export const discussionThreads = pgTable(
  'discussion_threads',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    assessmentId: uuid('assessment_id').references(() => assessments.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    prompt: text('prompt').notNull(),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('discussion_threads_offering_idx').on(t.courseOfferingId, t.createdAt),
    index('discussion_threads_assessment_idx').on(t.assessmentId),
  ],
)

export const discussionPosts = pgTable(
  'discussion_posts',
  {
    id: primaryKeyColumn(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => discussionThreads.id, { onDelete: 'cascade' }),
    parentPostId: uuid('parent_post_id'),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    ...timestamps(),
  },
  (t) => [
    index('discussion_posts_thread_idx').on(t.threadId, t.createdAt),
    index('discussion_posts_parent_idx').on(t.parentPostId),
  ],
)
