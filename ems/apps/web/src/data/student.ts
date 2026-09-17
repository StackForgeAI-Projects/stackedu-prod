// ─────────────────────────────────────────────────────────────────────────────
// StackEDU — Student shared data
// ─────────────────────────────────────────────────────────────────────────────

import {
  LayoutDashboard, BookOpen, ClipboardList, Video, CalendarDays, BarChart2, CreditCard, Library, Bell,
} from 'lucide-react'

// ── Navigation ────────────────────────────────────────────────────────────────

export const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Register',      to: '/student/course-registration', icon: ClipboardList },
  { label: 'Classroom',     to: '/student/classroom',     icon: Video           },
  { label: 'Timetable',     to: '/student/timetable',     icon: CalendarDays    },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]
