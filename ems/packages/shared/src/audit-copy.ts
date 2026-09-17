import type { UserRole } from './enums'

export interface AuditCopyInput {
  action: string
  actorEmail?: string | null
  actorRole?: string | null
  targetType?: string | null
  targetId?: string | null
  createdAt?: string
  changes?: Record<string, { from?: unknown; to?: unknown }> | null
  metadata?: Record<string, unknown> | null
}

export interface AuditDetailSection {
  title: string
  rows: Array<{ label: string; value: string }>
}

export interface AuditDetailView {
  headline: string
  subheadline: string
  sections: AuditDetailSection[]
}

const ROLE_LABELS: Record<UserRole, string> = {
  Applicant: 'Applicant',
  Student: 'Student',
  Lecturer: 'Lecturer',
  Bursar: 'Bursar',
  AcademicAdmin: 'Academic Admin',
  Librarian: 'Librarian',
  ICTManager: 'ICT Manager',
}

const KNOWN_ROLES = Object.keys(ROLE_LABELS) as UserRole[]

/**
 * Plain-English name for every action the system records.
 *
 * This is the stable label: it never contains a person's name or a record
 * title, so it can be used to group and filter the log. `auditSummary` builds
 * the fuller sentence shown in the Action column.
 */
const ACTION_LABELS: Record<string, string> = {
  'session.login': 'Signed in',
  'session.logout': 'Signed out',
  'session.logout.inactivity': 'Signed out automatically after inactivity',

  'user.create': 'Created a user account',
  'user.update': 'Updated a user account',
  'user.resetPassword': 'Reset a user password',
  'user.revoke': 'Revoked access for a user',
  'user.restore': 'Restored access for a user',
  'role.permissions': 'Changed what a role can do',

  'settings.update': 'Updated institution settings',
  'settings.logo.upload': 'Changed the institution logo',
  'integration.check': 'Checked a connected service',
  'integration.update': 'Updated a connected service',
  'announcement.create': 'Published an announcement',
  'bursar.announcement.send': 'Sent a finance announcement',

  'fee_item.create': 'Added a fee item',
  'fee_item.delete': 'Removed a fee item',
  'fee_structure.issue_semester': 'Issued semester invoices',
  'payment.record_manual': 'Recorded a payment by hand',
  'fee_hold.place': 'Placed a finance hold on a student',
  'fee_hold.release': 'Lifted a finance hold on a student',
  'receipt.void': 'Cancelled a receipt',
  'reconciliation.resolve': 'Resolved a bank reconciliation item',

  'materials.write': 'Updated course materials',
  'modules.write': 'Updated a course module',
  'modules.delete': 'Deleted a course module',
  'course.announcement.publish': 'Posted a course announcement',
  'course.announcement.draft': 'Saved a course announcement as a draft',
  'course.announcement.update': 'Edited a course announcement',
  'course.announcement.delete': 'Deleted a course announcement',
  'questions.write': 'Updated the question bank',
  'questions.delete': 'Deleted a question',
  'classroom.schedule': 'Scheduled a live class',
  'classroom.start': 'Started a live class',
  'classroom.end': 'Ended a live class',
  'classroom.cancel': 'Cancelled a live class',
  'classroom.record.start': 'Started a class recording',
  'classroom.record.stop': 'Stopped a class recording',
  'classroom.summary.draft': 'Drafted a class summary',
  'classroom.summary.publish': 'Published a class summary',
  'attendance.record': 'Saved attendance as a draft',
  'attendance.submit': 'Submitted attendance',
  'attendance.delete': 'Deleted an attendance session',
  'grades.write': 'Saved draft grades',
  'results.submit': 'Submitted results for approval',
  'results.approve': 'Approved results',
  'results.reject': 'Sent results back for correction',
  'timetable.slot.create': 'Added a timetable slot',
  'timetable.slot.update': 'Changed a timetable slot',
  'timetable.slot.delete': 'Removed a timetable slot',

  'programme.create': 'Created a programme',
  'programme.update': 'Updated a programme',
  'course.create': 'Created a course',
  'course.update': 'Updated a course',
  'course.delete': 'Deleted a course',
  'course.bulk_import': 'Imported courses from a file',
  'calendar.create': 'Added a calendar event',
  'calendar.update': 'Updated a calendar event',
  'calendar.delete': 'Removed a calendar event',
  'student.transfer': 'Moved a student to another programme',
  'student.suspend': 'Suspended a student',
  'student.graduate': 'Marked a student as graduated',
  'student.withdraw': 'Withdrew a student',
}

function humanizeKey(value: string): string {
  const words = value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[.\s]+/)
    .filter(Boolean)
    .map((part) => part.toLowerCase())
  if (!words.length) return 'Updated a record'
  return words.join(' ').replace(/^./, (letter) => letter.toUpperCase())
}

export function displayRole(role: string | null | undefined): string {
  if (!role) return 'System'
  if (KNOWN_ROLES.includes(role as UserRole)) return ROLE_LABELS[role as UserRole]
  return humanizeKey(role)
}

function looksLikeId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    || /^[0-9a-f]{20,}$/i.test(value)
}

function formatPlainValue(value: unknown): string {
  if (value == null || value === '') return 'not set'
  if (typeof value === 'boolean') return value ? 'on' : 'off'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    if (looksLikeId(value)) return 'a saved record'
    if (value === 'en') return 'English'
    if (value === 'fr') return 'French'
    if (value === 'rw') return 'Kinyarwanda'
    if (KNOWN_ROLES.includes(value as UserRole)) return ROLE_LABELS[value as UserRole]
    if (value.includes('.') && value.length < 80 && !value.includes(' ')) return humanizeKey(value)
    return value
  }
  if (Array.isArray(value)) {
    if (!value.length) return 'none'
    return value.map(formatPlainValue).join(', ')
  }
  return 'updated details'
}

function integrationName(input: AuditCopyInput): string | null {
  const name = input.metadata?.integrationName
  return typeof name === 'string' && name.trim() ? name : null
}

function metaText(input: AuditCopyInput, key: string): string | null {
  const value = input.metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function subjectName(input: AuditCopyInput): string {
  if (input.targetType === 'integration') {
    return integrationName(input) ?? 'Connected service'
  }
  if (input.targetType === 'role' && input.targetId) {
    return displayRole(input.targetId)
  }
  if (input.targetType === 'institution') return 'Institution settings'
  if (input.targetType === 'announcement') {
    const title = metaText(input, 'title')
    return title ? `"${title}"` : 'Announcement'
  }
  if (input.targetType === 'user') {
    return metaText(input, 'fullName') ?? metaText(input, 'email') ?? 'User account'
  }
  if (input.targetType === 'session') return 'Sign-in session'
  if (input.targetType === 'course') {
    const code = metaText(input, 'code')
    const name = metaText(input, 'name')
    if (code && name) return `${code} — ${name}`
    return code ?? name ?? 'Course'
  }
  if (input.targetType === 'programme') {
    const name = metaText(input, 'name')
    const code = metaText(input, 'code')
    return name ?? code ?? 'Programme'
  }
  if (input.targetType === 'fee_item') {
    return metaText(input, 'name') ?? 'Fee item'
  }
  if (input.targetType === 'course_module') {
    const title = metaText(input, 'title')
    return title ? `"${title}"` : 'Course module'
  }
  if (input.targetType === 'calendar_event') {
    const title = metaText(input, 'title')
    return title ? `"${title}"` : 'Calendar event'
  }
  if (input.targetType === 'student') {
    const number = metaText(input, 'studentNumber')
    return number ? `student ${number}` : 'a student'
  }
  if (input.targetType) return humanizeKey(input.targetType)
  return 'Record'
}

function integrationChangeLine(input: AuditCopyInput): string | null {
  const change = input.changes?.isEnabled
  if (!change || typeof change.to !== 'boolean') return null
  const name = integrationName(input) ?? 'The service'
  return change.to ? `${name} was turned on.` : `${name} was turned off.`
}

function changeLines(input: AuditCopyInput): string[] {
  const integrationLine = integrationChangeLine(input)
  if (integrationLine) return [integrationLine]

  const lines: string[] = []
  const changes = input.changes ?? {}

  for (const [key, change] of Object.entries(changes)) {
    if (key === 'isEnabled') continue
    if (key === 'isActive') {
      lines.push(typeof change.to === 'boolean' && change.to
        ? 'The account was marked as active again.'
        : 'The account was marked as inactive.')
      continue
    }
    if (key === 'fullName') {
      lines.push(`Name changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'name') {
      lines.push(`Institution name changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'shortName') {
      lines.push(`Short name changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'contactEmail') {
      lines.push(`Contact email changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'timezone') {
      lines.push(`Timezone changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'locale') {
      lines.push(`Language changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'brandColor') {
      const colour = (value: unknown) =>
        typeof value === 'string' && value.trim() ? value.toUpperCase() : 'the StackEDU default'
      lines.push(`System colour changed from ${colour(change.from)} to ${colour(change.to)}.`)
      continue
    }
    lines.push(`${humanizeKey(key)} changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
  }

  return lines
}

function metadataLines(input: AuditCopyInput): string[] {
  const lines: string[] = []
  const meta = input.metadata ?? {}

  if (input.action === 'user.create') {
    if (typeof meta.email === 'string') lines.push(`New login email: ${meta.email}.`)
    if (typeof meta.role === 'string') lines.push(`Role assigned: ${displayRole(meta.role)}.`)
  }

  if (input.action === 'user.resetPassword') {
    lines.push('A new temporary password was generated for this account.')
  }

  if (input.action === 'user.revoke') {
    if (typeof meta.reason === 'string' && meta.reason.trim()) {
      lines.push(`Reason recorded: ${meta.reason}.`)
    } else {
      lines.push('Access was withdrawn and active sessions were ended.')
    }
  }

  if (input.action === 'user.restore') {
    lines.push('Access was restored so the person can sign in again.')
  }

  if (input.action === 'role.permissions') {
    const count = Array.isArray(meta.permissionKeys) ? meta.permissionKeys.length : null
    if (count != null) {
      lines.push(`${count} ${count === 1 ? 'permission is' : 'permissions are'} now enabled for this role.`)
    } else {
      lines.push('The permissions for this role were updated.')
    }
  }

  if (input.action === 'announcement.create') {
    if (typeof meta.title === 'string') lines.push(`Title: ${meta.title}.`)
    if (typeof meta.recipientCount === 'number') {
      lines.push(`Sent to ${meta.recipientCount} ${meta.recipientCount === 1 ? 'person' : 'people'}.`)
    }
  }

  if (input.action === 'settings.update' && !lines.length) {
    lines.push('Institution contact details or regional settings were updated.')
  }

  if (input.action === 'settings.logo.upload') {
    lines.push('The new logo now appears on the sign-in, apply and portal screens.')
  }

  if (input.action === 'session.login') {
    lines.push(meta.method === 'two-factor'
      ? 'Signed in with a password and a code from their authenticator app.'
      : 'Signed in with an email address and password.')
  }

  if (input.action === 'session.logout') {
    lines.push('The person signed out themselves.')
  }

  if (input.action === 'session.logout.inactivity') {
    lines.push('The session ended on its own because the screen was left idle.')
  }

  return lines
}

/**
 * The plain-English name of an action, with no record-specific detail.
 *
 * Grouping and filtering key off this, so it must stay identical for every
 * entry that records the same kind of action.
 */
export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanizeKey(action)
}

export function auditSummary(input: AuditCopyInput): string {
  const integrationLine = integrationChangeLine(input)
  if (integrationLine) return integrationLine

  const subject = subjectName(input)
  const count = (key: string): number | null => {
    const value = input.metadata?.[key]
    return typeof value === 'number' ? value : null
  }
  const people = (value: number) => `${value} ${value === 1 ? 'person' : 'people'}`
  const titleText = metaText(input, 'title')

  switch (input.action) {
    case 'session.login':
      return input.metadata?.method === 'two-factor'
        ? 'Signed in with a password and an authenticator code'
        : 'Signed in with a password'
    case 'session.logout':
      return 'Signed out'
    case 'session.logout.inactivity':
      return 'Signed out automatically after being idle'

    case 'user.create':
      return `Created an account for ${subject}`
    case 'user.update':
      return `Updated the account details for ${subject}`
    case 'user.resetPassword':
      return `Reset the password for ${subject}`
    case 'user.revoke':
      return `Revoked ${subject}'s access and ended their sessions`
    case 'user.restore':
      return `Restored ${subject}'s access`
    case 'role.permissions':
      return `Changed what the ${subject} role can do`

    case 'settings.update':
      return 'Updated the institution settings'
    case 'settings.logo.upload':
      return 'Uploaded a new institution logo'
    case 'integration.check':
      return `Checked whether ${subject} is reachable`
    case 'integration.update':
      return `Updated the ${subject} connection`
    case 'announcement.create':
    case 'bursar.announcement.send': {
      const recipients = count('recipientCount')
      const prefix = input.action === 'announcement.create'
        ? `Published the announcement ${subject}`
        : `Sent the finance announcement ${subject}`
      return recipients == null ? prefix : `${prefix} to ${people(recipients)}`
    }

    case 'fee_item.create':
      return `Added the fee item ${subject}`
    case 'fee_item.delete':
      return `Removed the fee item ${subject}`
    case 'fee_structure.issue_semester': {
      const issued = count('issuedCount')
      return issued == null
        ? 'Issued invoices for a semester'
        : `Issued invoices for a semester to ${people(issued)}`
    }
    case 'payment.record_manual':
      return `Recorded a payment by hand for ${subject}`
    case 'fee_hold.place':
      return `Placed a finance hold on ${subject}`
    case 'fee_hold.release':
      return `Lifted the finance hold on ${subject}`
    case 'receipt.void':
      return 'Cancelled a receipt'
    case 'reconciliation.resolve':
      return 'Resolved a bank reconciliation item'

    case 'materials.write':
      return input.targetType === 'assessment'
        ? 'Updated an assessment'
        : 'Updated the materials for a course'

    case 'modules.write':
      return titleText ? `Updated the course module "${titleText}"` : 'Updated a course module'
    case 'modules.delete':
      return titleText ? `Deleted the course module "${titleText}"` : 'Deleted a course module'
    case 'course.announcement.publish':
      return titleText
        ? `Posted the course announcement "${titleText}" to enrolled students`
        : 'Posted a course announcement to enrolled students'
    case 'course.announcement.draft':
      return titleText
        ? `Saved the course announcement "${titleText}" as a draft`
        : 'Saved a course announcement as a draft'
    case 'course.announcement.update':
      return titleText
        ? `Edited the course announcement "${titleText}"`
        : 'Edited a course announcement'
    case 'course.announcement.delete':
      return titleText
        ? `Deleted the course announcement "${titleText}"`
        : 'Deleted a course announcement'
    case 'questions.write':
      return titleText ? `Updated the question "${titleText}"` : 'Updated the question bank'
    case 'questions.delete':
      return titleText ? `Deleted the question "${titleText}"` : 'Deleted a question'
    case 'attendance.record':
      return 'Saved an attendance register as a draft'
    case 'attendance.submit':
      return 'Submitted an attendance register'
    case 'attendance.delete':
      return 'Deleted an attendance register'
    case 'grades.write':
      return 'Saved draft grades for a course'
    case 'results.submit':
      return 'Submitted results for approval'
    case 'results.approve':
      return 'Approved a set of results'
    case 'results.reject':
      return 'Sent a set of results back for correction'
    case 'timetable.slot.create':
      return 'Added a class to the timetable'
    case 'timetable.slot.update':
      return 'Changed a class on the timetable'
    case 'timetable.slot.delete':
      return 'Removed a class from the timetable'

    case 'programme.create':
      return `Created the programme ${subject}`
    case 'programme.update':
      return `Updated the programme ${subject}`
    case 'course.create':
      return `Created the course ${subject}`
    case 'course.update':
      return `Updated the course ${subject}`
    case 'course.delete':
      return `Deleted the course ${subject}`
    case 'course.bulk_import': {
      const created = count('created')
      return created == null
        ? 'Imported courses from a file'
        : `Imported ${created} ${created === 1 ? 'course' : 'courses'} from a file`
    }
    case 'calendar.create':
      return `Added the calendar event ${subject}`
    case 'calendar.update':
      return `Updated the calendar event ${subject}`
    case 'calendar.delete':
      return `Removed the calendar event ${subject}`
    case 'student.transfer':
      return `Moved ${subject} to another programme`
    case 'student.suspend':
      return `Suspended ${subject}`
    case 'student.graduate':
      return `Marked ${subject} as graduated`
    case 'student.withdraw':
      return `Withdrew ${subject}`

    default:
      return auditActionLabel(input.action)
  }
}

export function buildAuditDetail(input: AuditCopyInput): AuditDetailView {
  const subject = subjectName(input)
  const actor = input.actorEmail ?? 'System'
  const role = input.actorRole ? displayRole(input.actorRole) : 'System'
  const when = input.createdAt ? new Date(input.createdAt).toLocaleString() : 'Unknown time'
  const whatHappened = [...changeLines(input), ...metadataLines(input)]

  return {
    headline: auditSummary(input),
    subheadline: `${actor} · ${role} · ${when}`,
    sections: [
      {
        title: 'Who did this',
        rows: [
          { label: 'Person', value: actor },
          { label: 'Role', value: role },
          { label: 'When', value: when },
        ],
      },
      {
        title: 'What changed',
        rows: [
          { label: 'Action', value: auditActionLabel(input.action) },
          { label: 'Area', value: subject },
          {
            label: 'Details',
            value: whatHappened.length
              ? whatHappened.join('\n')
              : 'No extra details were recorded for this action.',
          },
        ],
      },
    ],
  }
}
