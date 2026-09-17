// ─────────────────────────────────────────────────────────────────────────────
// StackEDU — Lecturer mock data
// ─────────────────────────────────────────────────────────────────────────────

import {
  LayoutDashboard, BookOpen, Layers, Video, Library, CalendarDays, ClipboardList, BarChart2, FileText, ListChecks, TrendingUp, Bell,
} from 'lucide-react'

export const LECTURER = {
  fullName:    'Dr. Amina Uwase',
  firstName:   'Amina',
  id:          'LEC-2024-0012',
  initials:    'AU',
  department:  'Computer Science',
  institution: 'StackForgeAI University',
}

// ── Navigation ────────────────────────────────────────────────────────────────

export const LECTURER_NAV = [
  { label: 'Dashboard',     to: '/lecturer/dashboard',           icon: LayoutDashboard },
  { label: 'My Courses',    to: '/lecturer/courses',             icon: BookOpen        },
  { label: 'Course Management', to: '/lecturer/course-management', icon: Layers       },
  { label: 'Classroom',     to: '/lecturer/classroom',           icon: Video          },
  { label: 'E-Library',     to: '/lecturer/library',             icon: Library        },
  { label: 'Timetable',     to: '/lecturer/timetable',           icon: CalendarDays    },
  { label: 'Attendance',    to: '/lecturer/attendance',    icon: ClipboardList   },
  { label: 'Results',       to: '/lecturer/results',       icon: BarChart2       },
  { label: 'Assignments',   to: '/lecturer/assignments',   icon: FileText        },
  { label: 'Assessment Builder', to: '/lecturer/assessment-builder', icon: ListChecks },
  { label: 'Analytics',     to: '/lecturer/analytics',     icon: TrendingUp      },
  { label: 'Notifications', to: '/lecturer/notifications', icon: Bell            },
]

// ── Courses ───────────────────────────────────────────────────────────────────

export interface LecturerCourse {
  id:           string
  code:         string
  name:         string
  credits:      number
  enrolledCount: number
  color:        string
  schedule:     { day: string; time: string; room: string; type: 'Lecture' | 'Lab' | 'Tutorial' }[]
  nextClass:    string
  nextClassShort: string
}

export const LECTURER_COURSES: LecturerCourse[] = [
  {
    id: 'csc-201', code: 'CSC 201', name: 'Data Structures & Algorithms',
    credits: 3, enrolledCount: 45, color: '#0D9488',
    schedule: [
      { day: 'Monday',    time: '08:00 – 10:00', room: 'Lab 3',    type: 'Lecture'  },
      { day: 'Wednesday', time: '10:00 – 12:00', room: 'Lab 3',    type: 'Tutorial' },
    ],
    nextClass: 'Monday · 08:00 · Lab 3', nextClassShort: 'Mon 08:00',
  },
  {
    id: 'csc-301', code: 'CSC 301', name: 'Operating Systems',
    credits: 3, enrolledCount: 38, color: '#7C3AED',
    schedule: [
      { day: 'Tuesday',  time: '14:00 – 16:00', room: 'Room 201', type: 'Lecture' },
      { day: 'Thursday', time: '10:00 – 12:00', room: 'Lab 2',    type: 'Lab'     },
    ],
    nextClass: 'Tuesday · 14:00 · Room 201', nextClassShort: 'Tue 14:00',
  },
  {
    id: 'csc-202', code: 'CSC 202', name: 'Object-Oriented Programming',
    credits: 3, enrolledCount: 52, color: '#D97706',
    schedule: [
      { day: 'Wednesday', time: '08:00 – 10:00', room: 'Lab 1', type: 'Lecture' },
      { day: 'Friday',    time: '14:00 – 16:00', room: 'Lab 1', type: 'Lab'     },
    ],
    nextClass: 'Wednesday · 08:00 · Lab 1', nextClassShort: 'Wed 08:00',
  },
  {
    id: 'csc-401', code: 'CSC 401', name: 'Software Engineering',
    credits: 3, enrolledCount: 31, color: '#2563EB',
    schedule: [
      { day: 'Thursday', time: '14:00 – 16:00', room: 'Room 301', type: 'Lecture'  },
      { day: 'Friday',   time: '10:00 – 12:00', room: 'Room 301', type: 'Tutorial' },
    ],
    nextClass: 'Thursday · 14:00 · Room 301', nextClassShort: 'Thu 14:00',
  },
]

// ── Students ──────────────────────────────────────────────────────────────────

export interface CourseStudent {
  id:           string
  name:         string
  attendanceRate: number
  lastGrade?:   string
  avgGrade?:    string
  riskLevel?:   'High' | 'Medium' | 'Low' | null
}

export const COURSE_STUDENTS: Record<string, CourseStudent[]> = {
  'csc-201': [
    { id: 'SFE-2024-0042', name: 'Jean-Paul Mugisha',    attendanceRate: 87, lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0017', name: 'Diane Umutoniwase',    attendanceRate: 65, lastGrade: 'C',  avgGrade: 'C+', riskLevel: 'Medium' },
    { id: 'SFE-2024-0033', name: 'Patrick Habimana',     attendanceRate: 92, lastGrade: 'B+', avgGrade: 'B+' },
    { id: 'SFE-2024-0058', name: 'Claudine Mukamana',    attendanceRate: 45, lastGrade: 'D',  avgGrade: 'D',  riskLevel: 'High' },
    { id: 'SFE-2024-0071', name: 'Eric Nzeyimana',       attendanceRate: 78, lastGrade: 'B',  avgGrade: 'B'  },
    { id: 'SFE-2024-0089', name: 'Aline Ingabire',       attendanceRate: 100,lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0104', name: 'Samuel Bizimana',      attendanceRate: 55, lastGrade: 'C',  avgGrade: 'D+', riskLevel: 'High' },
    { id: 'SFE-2024-0116', name: 'Clarisse Uwimana',     attendanceRate: 83, lastGrade: 'B+', avgGrade: 'B'  },
  ],
  'csc-301': [
    { id: 'SFE-2024-0042', name: 'Jean-Paul Mugisha',    attendanceRate: 87, lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0023', name: 'Alice Mukeshimana',    attendanceRate: 72, lastGrade: 'B',  avgGrade: 'B+' },
    { id: 'SFE-2024-0039', name: 'Robert Uwera',         attendanceRate: 58, lastGrade: 'C+', avgGrade: 'C',  riskLevel: 'Medium' },
    { id: 'SFE-2024-0055', name: 'Solange Mutesi',       attendanceRate: 95, lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0068', name: 'Fred Nkurunziza',      attendanceRate: 40, lastGrade: 'F',  avgGrade: 'D',  riskLevel: 'High' },
    { id: 'SFE-2024-0082', name: 'Grace Uwineza',        attendanceRate: 88, lastGrade: 'B+', avgGrade: 'B+' },
  ],
  'csc-202': [
    { id: 'SFE-2024-0011', name: 'Emmanuel Habineza',    attendanceRate: 90, lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0027', name: 'Marie Uwantege',       attendanceRate: 76, lastGrade: 'B',  avgGrade: 'B'  },
    { id: 'SFE-2024-0043', name: 'Pierre Niyomugabo',    attendanceRate: 62, lastGrade: 'C+', avgGrade: 'C+', riskLevel: 'Low' },
    { id: 'SFE-2024-0059', name: 'Rose Mukamugema',      attendanceRate: 85, lastGrade: 'B+', avgGrade: 'A'  },
    { id: 'SFE-2024-0074', name: 'Alex Habimana',        attendanceRate: 50, lastGrade: 'D',  avgGrade: 'D+', riskLevel: 'High' },
    { id: 'SFE-2024-0091', name: 'Josiane Uwimana',      attendanceRate: 93, lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0107', name: 'David Nkurunziza',     attendanceRate: 70, lastGrade: 'B',  avgGrade: 'B'  },
  ],
  'csc-401': [
    { id: 'SFE-2024-0015', name: 'Christine Ishimwe',    attendanceRate: 96, lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0031', name: 'Bruno Ineza',          attendanceRate: 80, lastGrade: 'B+', avgGrade: 'B+' },
    { id: 'SFE-2024-0047', name: 'Jeanne Uwase',         attendanceRate: 68, lastGrade: 'C',  avgGrade: 'C+', riskLevel: 'Low' },
    { id: 'SFE-2024-0063', name: 'Joseph Mugabo',        attendanceRate: 88, lastGrade: 'A',  avgGrade: 'A'  },
    { id: 'SFE-2024-0079', name: 'Laetitia Niyonsaba',   attendanceRate: 42, lastGrade: 'D',  avgGrade: 'D',  riskLevel: 'High' },
    { id: 'SFE-2024-0095', name: 'Mark Habimana',        attendanceRate: 77, lastGrade: 'B',  avgGrade: 'B'  },
  ],
}

// ── Attendance sessions ───────────────────────────────────────────────────────

export interface AttendanceSession {
  id:            number
  courseId:      string
  date:          string
  topic:         string
  present:       number
  total:         number
  sessionNumber: number
}

export const ATTENDANCE_SESSIONS: AttendanceSession[] = [
  { id: 1, courseId: 'csc-201', date: '20 Jan 2025', topic: 'Introduction to Trees',        present: 41, total: 45, sessionNumber: 10 },
  { id: 2, courseId: 'csc-301', date: '21 Jan 2025', topic: 'Memory Management',            present: 32, total: 38, sessionNumber: 8  },
  { id: 3, courseId: 'csc-202', date: '22 Jan 2025', topic: 'Inheritance & Polymorphism',   present: 48, total: 52, sessionNumber: 12 },
  { id: 4, courseId: 'csc-201', date: '15 Jan 2025', topic: 'Binary Search Trees',          present: 38, total: 45, sessionNumber: 9  },
  { id: 5, courseId: 'csc-401', date: '16 Jan 2025', topic: 'Agile Methodologies',          present: 29, total: 31, sessionNumber: 7  },
  { id: 6, courseId: 'csc-301', date: '14 Jan 2025', topic: 'Process Scheduling',           present: 35, total: 38, sessionNumber: 7  },
  { id: 7, courseId: 'csc-202', date: '15 Jan 2025', topic: 'Abstract Classes',             present: 45, total: 52, sessionNumber: 11 },
  { id: 8, courseId: 'csc-401', date: '09 Jan 2025', topic: 'Requirements Engineering',     present: 28, total: 31, sessionNumber: 6  },
]

// ── Assessments ───────────────────────────────────────────────────────────────

export interface Assessment {
  id:       string
  courseId: string
  name:     string
  maxMarks: number
  weight:   number
  status:   'draft' | 'submitted' | 'published'
}

export const ASSESSMENTS: Assessment[] = [
  { id: 'csc201-a1',    courseId: 'csc-201', name: 'Assignment 1',      maxMarks: 20, weight: 10, status: 'published' },
  { id: 'csc201-a2',    courseId: 'csc-201', name: 'Assignment 2',      maxMarks: 20, weight: 10, status: 'submitted' },
  { id: 'csc201-mid',   courseId: 'csc-201', name: 'Mid-Semester Exam', maxMarks: 30, weight: 30, status: 'published' },
  { id: 'csc201-final', courseId: 'csc-201', name: 'Final Exam',        maxMarks: 50, weight: 50, status: 'draft'     },

  { id: 'csc301-a1',    courseId: 'csc-301', name: 'Assignment 1',      maxMarks: 20, weight: 10, status: 'published' },
  { id: 'csc301-mid',   courseId: 'csc-301', name: 'Mid-Semester Exam', maxMarks: 30, weight: 30, status: 'draft'     },
  { id: 'csc301-final', courseId: 'csc-301', name: 'Final Exam',        maxMarks: 50, weight: 50, status: 'draft'     },

  { id: 'csc202-a1',    courseId: 'csc-202', name: 'Assignment 1',      maxMarks: 20, weight: 10, status: 'published' },
  { id: 'csc202-a2',    courseId: 'csc-202', name: 'Assignment 2',      maxMarks: 20, weight: 10, status: 'published' },
  { id: 'csc202-mid',   courseId: 'csc-202', name: 'Mid-Semester Exam', maxMarks: 30, weight: 30, status: 'submitted' },
  { id: 'csc202-final', courseId: 'csc-202', name: 'Final Exam',        maxMarks: 50, weight: 50, status: 'draft'     },

  { id: 'csc401-a1',    courseId: 'csc-401', name: 'Assignment 1',      maxMarks: 20, weight: 10, status: 'published' },
  { id: 'csc401-proj',  courseId: 'csc-401', name: 'Project',           maxMarks: 40, weight: 40, status: 'draft'     },
  { id: 'csc401-final', courseId: 'csc-401', name: 'Final Exam',        maxMarks: 50, weight: 50, status: 'draft'     },
]

// Published marks: assessmentId → studentId → mark
export const PUBLISHED_MARKS: Record<string, Record<string, number>> = {
  'csc201-a1': {
    'SFE-2024-0042': 18, 'SFE-2024-0017': 12, 'SFE-2024-0033': 17,
    'SFE-2024-0058': 9,  'SFE-2024-0071': 15, 'SFE-2024-0089': 20,
    'SFE-2024-0104': 8,  'SFE-2024-0116': 16,
  },
  'csc201-mid': {
    'SFE-2024-0042': 27, 'SFE-2024-0017': 16, 'SFE-2024-0033': 24,
    'SFE-2024-0058': 11, 'SFE-2024-0071': 21, 'SFE-2024-0089': 29,
    'SFE-2024-0104': 10, 'SFE-2024-0116': 23,
  },
  'csc301-a1': {
    'SFE-2024-0042': 19, 'SFE-2024-0023': 14, 'SFE-2024-0039': 13,
    'SFE-2024-0055': 20, 'SFE-2024-0068': 7,  'SFE-2024-0082': 17,
  },
  'csc202-a1': {
    'SFE-2024-0011': 20, 'SFE-2024-0027': 15, 'SFE-2024-0043': 13,
    'SFE-2024-0059': 18, 'SFE-2024-0074': 9,  'SFE-2024-0091': 19, 'SFE-2024-0107': 14,
  },
  'csc202-a2': {
    'SFE-2024-0011': 19, 'SFE-2024-0027': 16, 'SFE-2024-0043': 12,
    'SFE-2024-0059': 17, 'SFE-2024-0074': 8,  'SFE-2024-0091': 20, 'SFE-2024-0107': 15,
  },
  'csc401-a1': {
    'SFE-2024-0015': 20, 'SFE-2024-0031': 17, 'SFE-2024-0047': 13,
    'SFE-2024-0063': 19, 'SFE-2024-0079': 9,  'SFE-2024-0095': 15,
  },
}

// ── Assignments ───────────────────────────────────────────────────────────────

export interface LecturerAssignment {
  id:             number
  title:          string
  courseId:       string
  dueDate:        string
  submittedCount: number
  totalCount:     number
  status:         'Draft' | 'Active' | 'Closed' | 'Graded'
  description:    string
  maxMarks:       number
}

export const LECTURER_ASSIGNMENTS: LecturerAssignment[] = [
  { id: 1, title: 'Binary Tree Implementation',       courseId: 'csc-201', dueDate: '25 Jan 2025', submittedCount: 38, totalCount: 45, status: 'Active',  description: 'Implement a binary search tree with insert, delete, and traversal operations in Python.',          maxMarks: 20 },
  { id: 2, title: 'Graph Traversal Algorithms',       courseId: 'csc-201', dueDate: '10 Feb 2025', submittedCount: 0,  totalCount: 45, status: 'Draft',   description: 'Implement BFS and DFS algorithms and compare their time complexities.',                         maxMarks: 20 },
  { id: 3, title: 'Process Scheduler Simulation',    courseId: 'csc-301', dueDate: '28 Jan 2025', submittedCount: 30, totalCount: 38, status: 'Active',  description: 'Simulate a round-robin CPU scheduler with configurable time quantum.',                        maxMarks: 20 },
  { id: 4, title: 'UML Class Diagrams',               courseId: 'csc-202', dueDate: '20 Jan 2025', submittedCount: 52, totalCount: 52, status: 'Graded',  description: 'Create UML class diagrams for a library management system.',                                 maxMarks: 20 },
  { id: 5, title: 'Design Patterns Report',           courseId: 'csc-202', dueDate: '05 Feb 2025', submittedCount: 18, totalCount: 52, status: 'Active',  description: 'Write a report comparing three design patterns with implementation examples.',               maxMarks: 20 },
  { id: 6, title: 'Software Requirements Spec',      courseId: 'csc-401', dueDate: '15 Feb 2025', submittedCount: 0,  totalCount: 31, status: 'Draft',   description: 'Write a complete SRS document for a chosen software project.',                              maxMarks: 40 },
]

// Submissions for submission-review screen
export interface AssignmentSubmission {
  studentId:   string
  studentName: string
  submittedAt: string
  status:      'Submitted' | 'Late' | 'Not submitted'
  grade?:      number
  fileName?:   string
  fileSize?:   string
}

export const ASSIGNMENT_SUBMISSIONS: Record<number, AssignmentSubmission[]> = {
  1: [
    { studentId: 'SFE-2024-0042', studentName: 'Jean-Paul Mugisha',  submittedAt: '23 Jan 2025', status: 'Submitted', grade: 18, fileName: 'BST_Mugisha.py',         fileSize: '14 KB' },
    { studentId: 'SFE-2024-0017', studentName: 'Diane Umutoniwase',  submittedAt: '24 Jan 2025', status: 'Submitted', grade: 12, fileName: 'BST_Umutoniwase.py',     fileSize: '11 KB' },
    { studentId: 'SFE-2024-0033', studentName: 'Patrick Habimana',   submittedAt: '22 Jan 2025', status: 'Submitted',           fileName: 'BST_Habimana.py',         fileSize: '16 KB' },
    { studentId: 'SFE-2024-0058', studentName: 'Claudine Mukamana',  submittedAt: '',            status: 'Not submitted' },
    { studentId: 'SFE-2024-0071', studentName: 'Eric Nzeyimana',     submittedAt: '25 Jan 2025', status: 'Late',                fileName: 'BST_Nzeyimana.py',        fileSize: '13 KB' },
    { studentId: 'SFE-2024-0089', studentName: 'Aline Ingabire',     submittedAt: '21 Jan 2025', status: 'Submitted', grade: 20, fileName: 'BST_Ingabire.py',         fileSize: '18 KB' },
    { studentId: 'SFE-2024-0104', studentName: 'Samuel Bizimana',    submittedAt: '',            status: 'Not submitted' },
    { studentId: 'SFE-2024-0116', studentName: 'Clarisse Uwimana',   submittedAt: '23 Jan 2025', status: 'Submitted',           fileName: 'BST_Uwimana.py',          fileSize: '15 KB' },
  ],
  4: [
    { studentId: 'SFE-2024-0011', studentName: 'Emmanuel Habineza',  submittedAt: '18 Jan 2025', status: 'Submitted', grade: 20, fileName: 'UML_Habineza.pdf',        fileSize: '1.2 MB' },
    { studentId: 'SFE-2024-0027', studentName: 'Marie Uwantege',     submittedAt: '19 Jan 2025', status: 'Submitted', grade: 15, fileName: 'UML_Uwantege.pdf',        fileSize: '0.9 MB' },
    { studentId: 'SFE-2024-0043', studentName: 'Pierre Niyomugabo',  submittedAt: '20 Jan 2025', status: 'Late',      grade: 11, fileName: 'UML_Niyomugabo.pdf',      fileSize: '1.1 MB' },
    { studentId: 'SFE-2024-0059', studentName: 'Rose Mukamugema',    submittedAt: '17 Jan 2025', status: 'Submitted', grade: 18, fileName: 'UML_Mukamugema.pdf',      fileSize: '1.4 MB' },
    { studentId: 'SFE-2024-0074', studentName: 'Alex Habimana',      submittedAt: '20 Jan 2025', status: 'Late',      grade: 8,  fileName: 'UML_Habimana.pdf',        fileSize: '0.7 MB' },
    { studentId: 'SFE-2024-0091', studentName: 'Josiane Uwimana',    submittedAt: '16 Jan 2025', status: 'Submitted', grade: 19, fileName: 'UML_Uwimana.pdf',         fileSize: '1.5 MB' },
    { studentId: 'SFE-2024-0107', studentName: 'David Nkurunziza',   submittedAt: '18 Jan 2025', status: 'Submitted', grade: 14, fileName: 'UML_Nkurunziza.pdf',      fileSize: '1.0 MB' },
  ],
}

// ── At-risk students ──────────────────────────────────────────────────────────

export interface AtRiskStudent {
  id:        string
  name:      string
  courseId:  string
  riskLevel: 'High' | 'Medium' | 'Low'
  reasons:   string[]
  resolved:  boolean
}

export const AT_RISK_STUDENTS: AtRiskStudent[] = [
  { id: 'SFE-2024-0058', name: 'Claudine Mukamana',  courseId: 'csc-201', riskLevel: 'High',   reasons: ['Attendance: 45%', 'Avg grade: D',  'Missing 2 assignments'], resolved: false },
  { id: 'SFE-2024-0104', name: 'Samuel Bizimana',    courseId: 'csc-201', riskLevel: 'High',   reasons: ['Attendance: 55%', 'Avg grade: D+', 'Failed mid-semester'],   resolved: false },
  { id: 'SFE-2024-0068', name: 'Fred Nkurunziza',    courseId: 'csc-301', riskLevel: 'High',   reasons: ['Attendance: 40%', 'Avg grade: D',  'Missing 3 assignments'], resolved: false },
  { id: 'SFE-2024-0074', name: 'Alex Habimana',      courseId: 'csc-202', riskLevel: 'High',   reasons: ['Attendance: 50%', 'Avg grade: D+', 'Not submitting work'],   resolved: false },
  { id: 'SFE-2024-0079', name: 'Laetitia Niyonsaba', courseId: 'csc-401', riskLevel: 'High',   reasons: ['Attendance: 42%', 'Avg grade: D',  'No submissions this month'], resolved: false },
  { id: 'SFE-2024-0017', name: 'Diane Umutoniwase',  courseId: 'csc-201', riskLevel: 'Medium', reasons: ['Attendance: 65%', 'Below class average'],                     resolved: false },
  { id: 'SFE-2024-0039', name: 'Robert Uwera',       courseId: 'csc-301', riskLevel: 'Medium', reasons: ['Attendance: 58%', 'Declining grades'],                        resolved: false },
  { id: 'SFE-2024-0043', name: 'Pierre Niyomugabo',  courseId: 'csc-202', riskLevel: 'Low',    reasons: ['Attendance: 62%'],                                            resolved: false },
  { id: 'SFE-2024-0047', name: 'Jeanne Uwase',       courseId: 'csc-401', riskLevel: 'Low',    reasons: ['Declining attendance trend'],                                 resolved: false },
]

// ── Course materials ──────────────────────────────────────────────────────────

export interface CourseMaterial {
  id:         number
  courseId:   string
  title:      string
  type:       'PDF' | 'PPTX' | 'DOCX' | 'ZIP'
  uploadDate: string
  fileSize:   string
  downloads:  number
}

export const COURSE_MATERIALS: CourseMaterial[] = [
  { id: 1, courseId: 'csc-201', title: 'Week 1 — Introduction to Data Structures', type: 'PPTX', uploadDate: '03 Sep 2024', fileSize: '4.2 MB', downloads: 43 },
  { id: 2, courseId: 'csc-201', title: 'Week 2 — Arrays and Linked Lists',         type: 'PPTX', uploadDate: '10 Sep 2024', fileSize: '3.8 MB', downloads: 41 },
  { id: 3, courseId: 'csc-201', title: 'Tutorial Sheet 1',                         type: 'PDF',  uploadDate: '11 Sep 2024', fileSize: '0.6 MB', downloads: 44 },
  { id: 4, courseId: 'csc-201', title: 'Week 3 — Stacks and Queues',               type: 'PPTX', uploadDate: '17 Sep 2024', fileSize: '5.1 MB', downloads: 40 },
  { id: 5, courseId: 'csc-201', title: 'Mid-Semester Exam Practice Paper',         type: 'PDF',  uploadDate: '01 Oct 2024', fileSize: '0.8 MB', downloads: 45 },

  { id: 6,  courseId: 'csc-301', title: 'Week 1 — OS Concepts Overview',            type: 'PPTX', uploadDate: '04 Sep 2024', fileSize: '3.5 MB', downloads: 36 },
  { id: 7,  courseId: 'csc-301', title: 'Week 3 — Process Management',              type: 'PPTX', uploadDate: '18 Sep 2024', fileSize: '4.0 MB', downloads: 35 },
  { id: 8,  courseId: 'csc-301', title: 'Lab Manual',                               type: 'PDF',  uploadDate: '05 Sep 2024', fileSize: '1.2 MB', downloads: 38 },

  { id: 9,  courseId: 'csc-202', title: 'OOP Fundamentals — Lecture Notes',        type: 'PDF',  uploadDate: '04 Sep 2024', fileSize: '2.1 MB', downloads: 50 },
  { id: 10, courseId: 'csc-202', title: 'Week 2 — Classes and Objects',             type: 'PPTX', uploadDate: '11 Sep 2024', fileSize: '3.6 MB', downloads: 49 },
  { id: 11, courseId: 'csc-202', title: 'Assignment 1 Brief',                       type: 'DOCX', uploadDate: '12 Sep 2024', fileSize: '0.4 MB', downloads: 52 },

  { id: 12, courseId: 'csc-401', title: 'Software Development Life Cycles',        type: 'PPTX', uploadDate: '05 Sep 2024', fileSize: '3.2 MB', downloads: 30 },
  { id: 13, courseId: 'csc-401', title: 'Agile & Scrum Reference Guide',           type: 'PDF',  uploadDate: '19 Sep 2024', fileSize: '1.5 MB', downloads: 31 },
]

// ── Announcements ─────────────────────────────────────────────────────────────

export interface CourseAnnouncement {
  id:       number
  courseId: string
  title:    string
  body:     string
  date:     string
  pinned:   boolean
}

export const ANNOUNCEMENTS: CourseAnnouncement[] = [
  { id: 1, courseId: 'csc-201', title: 'Assignment 1 deadline reminder',         body: 'Binary Tree Implementation is due 25 January. Submit via the portal before 23:59.',                   date: '22 Jan 2025', pinned: true  },
  { id: 2, courseId: 'csc-201', title: 'Office hours this week',                 body: 'I will be available for consultation Monday 12:00–14:00 and Wednesday 16:00–17:00.',                  date: '20 Jan 2025', pinned: false },
  { id: 3, courseId: 'csc-301', title: 'Lab session rescheduled',                body: 'Thursday lab on 23 January is moved to Friday 24 January at 10:00 in Lab 2.',                         date: '21 Jan 2025', pinned: true  },
  { id: 4, courseId: 'csc-202', title: 'Assignment 2 posted',                    body: 'Design Patterns Report has been posted. See the Assignments section for the brief.',                  date: '18 Jan 2025', pinned: false },
  { id: 5, courseId: 'csc-401', title: 'Guest lecture next Thursday',            body: 'We will have a guest lecturer from a leading Kigali tech firm presenting on agile in practice.',    date: '15 Jan 2025', pinned: false },
]

// ── Lecturer notifications ────────────────────────────────────────────────────

export type LecturerNotifType = 'result' | 'assignment' | 'atrisk' | 'system'

export interface LecturerNotif {
  id:           number
  type:         LecturerNotifType
  title:        string
  body:         string
  detailedBody: string
  action?:      string
  timestamp:    string
  read:         boolean
}

export const LECTURER_NOTIFS: LecturerNotif[] = [
  {
    id: 1, type: 'result', read: false, timestamp: '1 hour ago',
    title: 'Result entry deadline approaching',
    body: 'CSC 201 Assignment 2 results must be submitted by 31 January 2025.',
    detailedBody: 'The Academic Registrar has set a submission deadline of 31 January 2025 for CSC 201 Assignment 2 results. Marks must be submitted via the Results section before this date so that the Academic Admin can review and publish them to students. Once submitted, results cannot be edited. Please complete your mark entry before the deadline.',
    action: 'Enter Results',
  },
  {
    id: 2, type: 'assignment', read: false, timestamp: '3 hours ago',
    title: 'New submissions — Binary Tree Implementation',
    body: '38 of 45 students have submitted Assignment 1 for CSC 201.',
    detailedBody: '38 of 45 students enrolled in CSC 201 — Data Structures & Algorithms have submitted the Binary Tree Implementation assignment. The submission deadline is 25 January 2025. 7 students have not yet submitted. You can view all submissions and begin grading via the Assignments section.',
    action: 'View Submissions',
  },
  {
    id: 3, type: 'atrisk', read: false, timestamp: '1 day ago',
    title: 'At-risk alert: Claudine Mukamana',
    body: 'Claudine Mukamana (CSC 201) has been flagged for low attendance and poor grades.',
    detailedBody: 'The StackEDU AI system has flagged Claudine Mukamana (SFE-2024-0058) in CSC 201 — Data Structures & Algorithms as at high academic risk. Key indicators: attendance rate of 45% (below the 75% minimum), average grade of D across submitted assessments, and 2 missing assignment submissions. Early intervention is recommended to help this student improve their standing before the end of semester.',
    action: 'View Alert',
  },
  {
    id: 4, type: 'system', read: true, timestamp: '2 days ago',
    title: 'Academic calendar updated',
    body: 'The Academic Admin has updated the semester end date to 30 May 2025.',
    detailedBody: 'The StackForgeAI University Academic Registrar has published an updated academic calendar for the 2024/2025 academic year. The Semester 1 end date has been revised to 30 May 2025 to accommodate a revised examination timetable. All assessment submission deadlines remain unchanged. Please review the updated calendar in the Academic Calendar section.',
  },
  {
    id: 5, type: 'assignment', read: true, timestamp: '3 days ago',
    title: 'UML Class Diagrams — all submitted',
    body: 'All 52 students in CSC 202 have submitted Assignment 1.',
    detailedBody: 'All 52 students enrolled in CSC 202 — Object-Oriented Programming have submitted the UML Class Diagrams assignment. The assignment closed on 20 January 2025. You can now begin reviewing and grading all submissions via the Assignments section. The average grade will be calculated and displayed once all submissions are graded.',
    action: 'Grade Now',
  },
  {
    id: 6, type: 'atrisk', read: true, timestamp: '4 days ago',
    title: 'At-risk alert: Fred Nkurunziza',
    body: 'Fred Nkurunziza (CSC 301) — attendance below 40% and failing average.',
    detailedBody: 'Fred Nkurunziza (SFE-2024-0068) in CSC 301 — Operating Systems has been flagged at high academic risk. Attendance stands at 40% and the current average grade is D, with 3 missing assignment submissions. Please consider initiating a follow-up conversation with the student and notifying the Academic Registrar if the situation does not improve.',
    action: 'View Alert',
  },
  {
    id: 7, type: 'result', read: true, timestamp: '1 week ago',
    title: 'Results published — CSC 201 Assignment 1',
    body: 'Your submitted results for CSC 201 Assignment 1 have been reviewed and published to students.',
    detailedBody: 'The Academic Admin has reviewed and approved your submitted results for CSC 201 — Data Structures & Algorithms, Assignment 1. Results have been published and are now visible to all enrolled students. Students have been notified by the system. The class average for this assessment was 14.8 / 20 (74%). You can view the published result distribution in the Result Review section.',
  },
  {
    id: 8, type: 'system', read: true, timestamp: '3 months ago',
    title: 'Welcome to StackEDU',
    body: 'Your lecturer account has been activated. You are assigned to 4 courses this semester.',
    detailedBody: 'Your StackEDU lecturer account has been successfully created and activated for the 2024/2025 academic year. You are assigned to 4 courses: CSC 201, CSC 202, CSC 301, and CSC 401. You can view your full course list in the My Courses section. If you notice any discrepancies in your course assignments, please contact the Academic Registrar. Your unique lecturer ID is LEC-2024-0012.',
  },
]

// ── Grade helpers ─────────────────────────────────────────────────────────────

export function calcGrade(marks: number, maxMarks: number): string {
  if (!maxMarks || isNaN(marks)) return '—'
  const pct = (marks / maxMarks) * 100
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  return 'F'
}

export function gradeColor(grade: string): { bg: string; color: string } {
  if (grade === 'A')                  return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (grade === 'B+' || grade === 'B') return { bg: 'var(--info-bg)',    color: 'var(--info)'    }
  if (grade === 'C+' || grade === 'C') return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  if (grade === 'D+' || grade === 'D' || grade === 'E') return { bg: 'var(--error-bg)', color: 'var(--error)' }
  if (grade === 'F')                  return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}
