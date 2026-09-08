import type { UserRole } from '@stackedu/shared'

/**
 * Which role owns which section of the app.
 *
 * One table drives three things that must never disagree: where a user lands
 * after signing in, which section a role is allowed to open, and which URLs
 * the route guard rejects.
 */
const PORTALS: ReadonlyArray<{ prefix: string; role: UserRole; home: string }> = [
  // An applicant has no dashboard; their home is their application.
  { prefix: '/apply', role: 'Applicant', home: '/apply/track' },
  { prefix: '/student', role: 'Student', home: '/student/dashboard' },
  { prefix: '/lecturer', role: 'Lecturer', home: '/lecturer/dashboard' },
  { prefix: '/bursar', role: 'Bursar', home: '/bursar/dashboard' },
  { prefix: '/academic', role: 'AcademicAdmin', home: '/academic/dashboard' },
  { prefix: '/librarian', role: 'Librarian', home: '/librarian/dashboard' },
  { prefix: '/ict', role: 'ICTManager', home: '/ict/dashboard' },
]

/** Where applicants sign in to track or continue an application. */
export const APPLICANT_SIGN_IN_PATH = '/apply/track'

/** Where this role starts, and where the logo returns them to. */
export function dashboardFor(role: UserRole): string {
  return PORTALS.find((portal) => portal.role === role)?.home ?? '/'
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

/** The role as a person would write it, for display in the interface. */
export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

/** The role required to open this path, or null if the path is not a portal. */
export function roleForPath(pathname: string): UserRole | null {
  const portal = PORTALS.find(
    (candidate) => pathname === candidate.prefix || pathname.startsWith(`${candidate.prefix}/`),
  )
  return portal?.role ?? null
}

/** Home dashboard for the portal section the user is currently in. */
export function dashboardHrefForPath(pathname: string): string {
  const portal = PORTALS.find(
    (candidate) => pathname === candidate.prefix || pathname.startsWith(`${candidate.prefix}/`),
  )
  return portal?.home ?? '/'
}

export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed || '/'
}
