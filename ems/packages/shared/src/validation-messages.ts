/**
 * User-facing validation copy — one place so alerts name the field or issue.
 */

/** Shown when a student tries to edit name or email — only ICT can change those fields. */
export const STUDENT_IDENTITY_CONTACT_MESSAGE = 'Contact ICT to change your name and email.'

export const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full name',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email address',
  phone: 'Phone number',
  payerPhone: 'Payer phone number',
  programmeId: 'Programme',
  password: 'Password',
  confirmPassword: 'Confirm password',
  currentPassword: 'Current password',
  newPassword: 'New password',
  identifier: 'Email or ID',
  code: 'Verification code',
  nationalId: 'National ID',
  documentType: 'Document type',
  fileName: 'File name',
  mimeType: 'File type',
  fileSizeBytes: 'File size',
  name: 'Name',
  shortName: 'Short name',
  website: 'Website URL',
  location: 'Location',
  timezone: 'Timezone',
  title: 'Title',
  minutesBefore: 'Reminder time',
  slotId: 'Class',
  notes: 'Notes',
  body: 'Message',
  reason: 'Reason',
  credits: 'Credits',
  departmentName: 'Department',
  durationYears: 'Duration',
  totalCredits: 'Total credits',
  level: 'Level',
  description: 'Description',
  comments: 'Comments',
  decision: 'Decision',
  method: 'Payment method',
  guardianPhone: 'Guardian phone number',
  emergencyPhone: 'Emergency contact phone number',
  guardianEmail: 'Guardian email address',
  statement: 'Personal statement',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  nationality: 'Nationality',
  programme: 'Programme',
  entryYear: 'Entry year',
  studyMode: 'Study mode',
}

const MESSAGE_REWRITES: Record<string, (label: string) => string> = {
  'Use at least 8 characters': (label) => `${label} must be at least 8 characters.`,
  'Include at least one number': (label) => `${label} must include at least one number.`,
  'Include at least one letter': (label) => `${label} must include at least one letter.`,
  'This field is required': (label) => `${label} is required.`,
  Required: (label) => `${label} is required.`,
  'Invalid email': () => 'Email address is not valid.',
  'Invalid uuid': (label) => `${label} is not valid.`,
  'Phone must be in international format, e.g. +250788123456': () =>
    'Phone number must be in international format, e.g. +250788123456.',
  'Use international format, e.g. +250788123456': () =>
    'Phone number must be in international format, e.g. +250788123456.',
  'Some fields need your attention.': () => 'Please check the form and fix the highlighted fields.',
  'Enter a valid file type': () => 'Choose a supported file type (PDF, JPG, or PNG).',
}

function humanizeFieldName(field: string): string {
  return field
    .replace(/Id$/, ' ID')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim()
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? humanizeFieldName(field)
}

function ensurePeriod(message: string): string {
  return message.endsWith('.') ? message : `${message}.`
}

function rewriteZodDefault(message: string, label: string): string | undefined {
  const minChars = message.match(/^String must contain at least (\d+) character\(s\)$/)
  if (minChars) return `${label} must be at least ${minChars[1]} characters.`

  const maxChars = message.match(/^String must contain at most (\d+) character\(s\)$/)
  if (maxChars) return `${label} is too long (maximum ${maxChars[1]} characters).`

  const minNumber = message.match(/^Number must be greater than or equal to (\d+)$/)
  if (minNumber) return `${label} must be at least ${minNumber[1]}.`

  const maxNumber = message.match(/^Number must be less than or equal to (\d+)$/)
  if (maxNumber) return `${label} must be at most ${maxNumber[1]}.`

  if (message === 'Required') return `${label} is required.`

  return undefined
}

/** Turn a field key + raw validator message into plain English for alerts. */
export function formatFieldValidationMessage(field: string, message: string): string {
  const trimmed = message.trim()
  if (!trimmed) return 'Please check this field and try again.'

  const label = fieldLabel(field)
  const rewrite = MESSAGE_REWRITES[trimmed]
  if (rewrite) return rewrite(label)

  const zodRewrite = rewriteZodDefault(trimmed, label)
  if (zodRewrite) return zodRewrite

  if (trimmed.toLowerCase().startsWith(label.toLowerCase())) {
    return ensurePeriod(trimmed)
  }

  if (/^Enter /i.test(trimmed) || /^Select /i.test(trimmed) || /^Choose /i.test(trimmed)) {
    return ensurePeriod(trimmed)
  }

  if (!trimmed.toLowerCase().includes(label.toLowerCase())) {
    const rest = trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
    return `${label}: ${ensurePeriod(rest)}`
  }

  return ensurePeriod(trimmed)
}

/** First formatted validation message from API field errors. */
export function firstValidationDetail(
  details: Record<string, string[]> | undefined,
): string | undefined {
  if (!details) return undefined

  for (const [field, messages] of Object.entries(details)) {
    const first = messages?.[0]
    if (first) return formatFieldValidationMessage(field, first)
  }

  return undefined
}
