// ─────────────────────────────────────────────────────────────────────────────
// StackEDU — Academic Admin mock data
// ─────────────────────────────────────────────────────────────────────────────

import {
  LayoutDashboard, FileText, Users, BookOpen, GraduationCap,
  CalendarDays, Clock, UserCheck, BarChart2, FileBarChart, AlertTriangle, Library, Bell,
} from 'lucide-react'

// ── Identity ──────────────────────────────────────────────────────────────────

export const ACADEMIC_ADMIN = {
  fullName:    'Prof. Emmanuel Nkurunziza',
  firstName:   'Prof. Nkurunziza',
  shortName:   'Prof. Nkurunziza',
  id:          'ADM-2024-0001',
  initials:    'EN',
  role:        'Registrar',
  institution: 'StackForgeAI University',
  office:      'Registry Office',
}

// ── Navigation ────────────────────────────────────────────────────────────────

export const ACADEMIC_NAV = [
  { label: 'Dashboard',     to: '/academic/dashboard',     icon: LayoutDashboard },
  { label: 'Applications',  to: '/academic/applications',  icon: FileText        },
  { label: 'Students',      to: '/academic/students',      icon: Users           },
  { label: 'Courses',       to: '/academic/courses',       icon: BookOpen        },
  { label: 'Programmes',    to: '/academic/programmes',    icon: GraduationCap   },
  { label: 'Calendar',      to: '/academic/calendar',      icon: CalendarDays    },
  { label: 'Timetable',     to: '/academic/timetable',     icon: Clock           },
  { label: 'Faculty',       to: '/academic/faculty',       icon: UserCheck       },
  { label: 'Results',       to: '/academic/results',       icon: BarChart2       },
  { label: 'Reports',       to: '/academic/reports',       icon: FileBarChart    },
  { label: 'At-Risk',       to: '/academic/at-risk',       icon: AlertTriangle   },
  { label: 'E-Library',     to: '/academic/library',       icon: Library         },
  { label: 'Notifications', to: '/academic/notifications', icon: Bell            },
]

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppStatus      = 'Pending' | 'Approved' | 'Rejected' | 'Conditional' | 'Accepted' | 'Declined' | 'Withdrawn'
export type DocStatus      = 'Submitted' | 'Pending' | 'Missing'
export type StudentStatus  = 'Active' | 'Suspended' | 'Graduated' | 'Deferred'
export type CourseStatus   = 'Active' | 'Archived'
export type CourseType     = 'Compulsory' | 'Elective'
export type SessionType    = 'Lecture' | 'Tutorial' | 'Lab'
export type RiskLevel      = 'High' | 'Medium' | 'Low'
export type ResultStatus   = 'Pending' | 'Approved'

// ── Applications (10) ─────────────────────────────────────────────────────────

export interface Application {
  id:            string
  appId:         string
  firstName:     string
  lastName:      string
  fullName:      string
  initials:      string
  dob:           string
  nationality:   string
  gender:        string
  phone:         string
  email:         string
  programme:     string
  entryYear:     string
  studyMode:     string
  status:        AppStatus
  submittedDate: string
  lastUpdated:   string
  docsComplete:  boolean
  prevInstitution: string
  prevQualification: string
  prevGPA:       string
  prevYearCompleted: string
  documents:     { name: string; status: DocStatus; uploadDate?: string }[]
  notes?:        string
}

export const APPLICATIONS: Application[] = [
  {
    id: '1', appId: 'APP-2025-0034',
    firstName: 'Grace', lastName: 'Uwimana', fullName: 'Grace Uwimana', initials: 'GU',
    dob: '14 Mar 2004', nationality: 'Rwandan', gender: 'Female',
    phone: '+250 788 123 456', email: 'grace.uwimana@gmail.com',
    programme: 'Computer Science', entryYear: '2025', studyMode: 'Full-time',
    status: 'Pending', submittedDate: '20 Jan 2025', lastUpdated: '20 Jan 2025', docsComplete: true,
    prevInstitution: 'FAWE Girls School', prevQualification: 'A-Level', prevGPA: '85%', prevYearCompleted: '2024',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '20 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '20 Jan 2025' },
      { name: 'Official Transcript', status: 'Submitted', uploadDate: '20 Jan 2025' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '20 Jan 2025' },
    ],
  },
  {
    id: '2', appId: 'APP-2025-0033',
    firstName: 'David', lastName: 'Niyomugabo', fullName: 'David Niyomugabo', initials: 'DN',
    dob: '08 Jul 2003', nationality: 'Rwandan', gender: 'Male',
    phone: '+250 722 654 321', email: 'david.niyomugabo@outlook.com',
    programme: 'Business Administration', entryYear: '2025', studyMode: 'Full-time',
    status: 'Accepted', submittedDate: '18 Jan 2025', lastUpdated: '23 Jan 2025', docsComplete: true,
    prevInstitution: 'Lycée de Kigali', prevQualification: 'A-Level', prevGPA: '78%', prevYearCompleted: '2023',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '18 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '18 Jan 2025' },
      { name: 'Official Transcript', status: 'Submitted', uploadDate: '18 Jan 2025' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '18 Jan 2025' },
    ],
    notes: 'Strong academic record. Approved for Semester 1 2025.',
  },
  {
    id: '3', appId: 'APP-2025-0032',
    firstName: 'Sylvie', lastName: 'Ingabire', fullName: 'Sylvie Ingabire', initials: 'SI',
    dob: '22 Nov 2004', nationality: 'Rwandan', gender: 'Female',
    phone: '+250 788 987 654', email: 'sylvie.ingabire@yahoo.com',
    programme: 'Information Technology', entryYear: '2025', studyMode: 'Full-time',
    status: 'Conditional', submittedDate: '17 Jan 2025', lastUpdated: '22 Jan 2025', docsComplete: false,
    prevInstitution: 'École des Sciences de Butare', prevQualification: 'A-Level', prevGPA: '72%', prevYearCompleted: '2024',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '17 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '17 Jan 2025' },
      { name: 'Official Transcript', status: 'Missing' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '17 Jan 2025' },
    ],
    notes: 'Conditional offer: must submit Official Transcript within 2 weeks.',
  },
  {
    id: '4', appId: 'APP-2025-0031',
    firstName: 'Kevin', lastName: 'Hakizimana', fullName: 'Kevin Hakizimana', initials: 'KH',
    dob: '05 Feb 2003', nationality: 'Rwandan', gender: 'Male',
    phone: '+250 722 111 222', email: 'kevin.hakizimana@gmail.com',
    programme: 'Mathematics', entryYear: '2025', studyMode: 'Full-time',
    status: 'Pending', submittedDate: '16 Jan 2025', lastUpdated: '16 Jan 2025', docsComplete: false,
    prevInstitution: 'Groupe Scolaire Officiel de Butare', prevQualification: 'A-Level', prevGPA: '91%', prevYearCompleted: '2024',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '16 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Pending' },
      { name: 'Official Transcript', status: 'Pending' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '16 Jan 2025' },
    ],
  },
  {
    id: '5', appId: 'APP-2025-0030',
    firstName: 'Judith', lastName: 'Mukamana', fullName: 'Judith Mukamana', initials: 'JM',
    dob: '30 Sep 2004', nationality: 'Rwandan', gender: 'Female',
    phone: '+250 788 333 444', email: 'judith.mukamana@gmail.com',
    programme: 'Computer Science', entryYear: '2025', studyMode: 'Full-time',
    status: 'Rejected', submittedDate: '14 Jan 2025', lastUpdated: '20 Jan 2025', docsComplete: true,
    prevInstitution: 'Institut d\'Enseignement Supérieur de Ruhengeri', prevQualification: 'A-Level', prevGPA: '58%', prevYearCompleted: '2024',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '14 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '14 Jan 2025' },
      { name: 'Official Transcript', status: 'Submitted', uploadDate: '14 Jan 2025' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '14 Jan 2025' },
    ],
    notes: 'Does not meet minimum GPA requirement of 60% for Computer Science.',
  },
  {
    id: '6', appId: 'APP-2025-0029',
    firstName: 'Thierry', lastName: 'Uwera', fullName: 'Thierry Uwera', initials: 'TU',
    dob: '12 Jan 2004', nationality: 'Rwandan', gender: 'Male',
    phone: '+250 722 555 666', email: 'thierry.uwera@gmail.com',
    programme: 'Information Technology', entryYear: '2025', studyMode: 'Part-time',
    status: 'Approved', submittedDate: '13 Jan 2025', lastUpdated: '18 Jan 2025', docsComplete: true,
    prevInstitution: 'Kigali Secondary School', prevQualification: 'A-Level', prevGPA: '75%', prevYearCompleted: '2023',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '13 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '13 Jan 2025' },
      { name: 'Official Transcript', status: 'Submitted', uploadDate: '13 Jan 2025' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '13 Jan 2025' },
    ],
  },
  {
    id: '7', appId: 'APP-2025-0028',
    firstName: 'Nadine', lastName: 'Uwimana', fullName: 'Nadine Uwimana', initials: 'NU',
    dob: '17 Jun 2004', nationality: 'Rwandan', gender: 'Female',
    phone: '+250 788 777 888', email: 'nadine.uwimana@gmail.com',
    programme: 'Business Administration', entryYear: '2025', studyMode: 'Full-time',
    status: 'Declined', submittedDate: '12 Jan 2025', lastUpdated: '20 Jan 2025', docsComplete: true,
    prevInstitution: 'FAWE Girls School', prevQualification: 'A-Level', prevGPA: '82%', prevYearCompleted: '2024',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '12 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '12 Jan 2025' },
      { name: 'Official Transcript', status: 'Submitted', uploadDate: '12 Jan 2025' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '12 Jan 2025' },
    ],
  },
  {
    id: '8', appId: 'APP-2025-0027',
    firstName: 'Alex', lastName: 'Habimana', fullName: 'Alex Habimana', initials: 'AH',
    dob: '25 Apr 2003', nationality: 'Rwandan', gender: 'Male',
    phone: '+250 722 999 000', email: 'alex.habimana@gmail.com',
    programme: 'Mathematics', entryYear: '2025', studyMode: 'Full-time',
    status: 'Pending', submittedDate: '10 Jan 2025', lastUpdated: '10 Jan 2025', docsComplete: false,
    prevInstitution: 'Lycée Notre Dame de Cîteaux', prevQualification: 'A-Level', prevGPA: '88%', prevYearCompleted: '2024',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '10 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '10 Jan 2025' },
      { name: 'Official Transcript', status: 'Missing' },
      { name: 'Passport Photo', status: 'Missing' },
    ],
  },
  {
    id: '9', appId: 'APP-2025-0026',
    firstName: 'Rachel', lastName: 'Nzeyimana', fullName: 'Rachel Nzeyimana', initials: 'RN',
    dob: '03 Dec 2004', nationality: 'Rwandan', gender: 'Female',
    phone: '+250 788 444 555', email: 'rachel.nzeyimana@gmail.com',
    programme: 'Computer Science', entryYear: '2025', studyMode: 'Full-time',
    status: 'Conditional', submittedDate: '09 Jan 2025', lastUpdated: '15 Jan 2025', docsComplete: false,
    prevInstitution: 'Ecole Secondaire Sainte Famille', prevQualification: 'A-Level', prevGPA: '69%', prevYearCompleted: '2024',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '09 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '09 Jan 2025' },
      { name: 'Official Transcript', status: 'Submitted', uploadDate: '09 Jan 2025' },
      { name: 'Passport Photo', status: 'Pending' },
    ],
    notes: 'Conditional offer: borderline GPA. Must attend diagnostic test on 1 Feb 2025.',
  },
  {
    id: '10', appId: 'APP-2025-0025',
    firstName: 'Paul', lastName: 'Rukundo', fullName: 'Paul Rukundo', initials: 'PR',
    dob: '18 Aug 2003', nationality: 'Rwandan', gender: 'Male',
    phone: '+250 722 888 999', email: 'paul.rukundo@gmail.com',
    programme: 'Business Administration', entryYear: '2025', studyMode: 'Part-time',
    status: 'Withdrawn', submittedDate: '07 Jan 2025', lastUpdated: '15 Jan 2025', docsComplete: true,
    prevInstitution: 'Groupe Scolaire Cyangugu', prevQualification: 'A-Level', prevGPA: '55%', prevYearCompleted: '2022',
    documents: [
      { name: 'National ID', status: 'Submitted', uploadDate: '07 Jan 2025' },
      { name: 'A-Level Certificate', status: 'Submitted', uploadDate: '07 Jan 2025' },
      { name: 'Official Transcript', status: 'Submitted', uploadDate: '07 Jan 2025' },
      { name: 'Passport Photo', status: 'Submitted', uploadDate: '07 Jan 2025' },
    ],
    notes: 'Below minimum entry requirements. Applicant may reapply after further study.',
  },
]

// ── Students (15) ─────────────────────────────────────────────────────────────

export interface AcademicStudent {
  id:             string
  firstName:      string
  fullName:       string
  initials:       string
  programme:      string
  year:           number
  enrollmentDate: string
  expectedGrad:   string
  status:         StudentStatus
  email:          string
  phone:          string
  dob:            string
  gender:         string
  nationality:    string
  address:        string
  cgpa:           number
  standing:       'Good Standing' | 'Probation' | 'Suspended'
  semesters: {
    name: string
    gpa: number
    results: { code: string; name: string; grade: string; credits: number }[]
  }[]
  timeline: { date: string; event: string; type: string; notes?: string }[]
}

export const ACADEMIC_STUDENTS: AcademicStudent[] = [
  {
    id: 'SFE-2024-0042', firstName: 'Jean-Paul', fullName: 'Jean-Paul Mugisha', initials: 'JM',
    programme: 'Computer Science', year: 1, enrollmentDate: '02 Sep 2024', expectedGrad: 'Jul 2027',
    status: 'Active', email: 'jeanpaul.mugisha@sfu.ac.rw', phone: '+250 788 100 200',
    dob: '14 Mar 2005', gender: 'Male', nationality: 'Rwandan', address: 'KG 15 Ave, Kigali',
    cgpa: 3.6, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.6, results: [
        { code: 'CSC 101', name: 'Introduction to Computer Science', grade: 'A',  credits: 3 },
        { code: 'CSC 102', name: 'Programming Fundamentals',         grade: 'B+', credits: 3 },
        { code: 'MTH 101', name: 'Calculus I',                       grade: 'A',  credits: 3 },
        { code: 'ENG 101', name: 'English Communication Skills',     grade: 'B',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '02 Sep 2024', event: 'Admitted', type: 'admission', notes: 'Admitted to Computer Science Year 1.' },
      { date: '15 Sep 2024', event: 'Course Registration', type: 'registration', notes: 'Registered for 4 courses.' },
      { date: '02 Sep 2024', event: 'Semester 1 Start', type: 'semester' },
    ],
  },
  {
    id: 'SFE-2024-0017', firstName: 'Diane', fullName: 'Diane Umutoniwase', initials: 'DU',
    programme: 'Computer Science', year: 1, enrollmentDate: '02 Sep 2024', expectedGrad: 'Jul 2027',
    status: 'Active', email: 'diane.umutoniwase@sfu.ac.rw', phone: '+250 722 300 400',
    dob: '20 Jun 2005', gender: 'Female', nationality: 'Rwandan', address: 'KN 5 Rd, Kigali',
    cgpa: 3.2, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.2, results: [
        { code: 'CSC 101', name: 'Introduction to Computer Science', grade: 'B+', credits: 3 },
        { code: 'CSC 102', name: 'Programming Fundamentals',         grade: 'B',  credits: 3 },
        { code: 'MTH 101', name: 'Calculus I',                       grade: 'B+', credits: 3 },
        { code: 'ENG 101', name: 'English Communication Skills',     grade: 'A',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '02 Sep 2024', event: 'Admitted', type: 'admission' },
      { date: '15 Sep 2024', event: 'Course Registration', type: 'registration' },
      { date: '02 Sep 2024', event: 'Semester 1 Start', type: 'semester' },
    ],
  },
  {
    id: 'SFE-2024-0033', firstName: 'Patrick', fullName: 'Patrick Habimana', initials: 'PH',
    programme: 'Computer Science', year: 2, enrollmentDate: '05 Sep 2023', expectedGrad: 'Jul 2026',
    status: 'Active', email: 'patrick.habimana@sfu.ac.rw', phone: '+250 788 500 600',
    dob: '11 Feb 2004', gender: 'Male', nationality: 'Rwandan', address: 'KG 22 Ave, Kigali',
    cgpa: 3.8, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 2 · 2023/2024', gpa: 3.8, results: [
        { code: 'CSC 201', name: 'Data Structures & Algorithms', grade: 'A',  credits: 3 },
        { code: 'CSC 202', name: 'Database Management Systems', grade: 'A',  credits: 3 },
        { code: 'MTH 201', name: 'Calculus II',                  grade: 'B+', credits: 3 },
      ]},
      { name: 'Semester 1 · 2023/2024', gpa: 3.7, results: [
        { code: 'CSC 101', name: 'Introduction to Computer Science', grade: 'A',  credits: 3 },
        { code: 'CSC 102', name: 'Programming Fundamentals',         grade: 'A',  credits: 3 },
        { code: 'MTH 101', name: 'Calculus I',                       grade: 'B+', credits: 3 },
      ]},
    ],
    timeline: [
      { date: '05 Sep 2023', event: 'Admitted', type: 'admission' },
      { date: '20 Sep 2023', event: 'Course Registration', type: 'registration' },
      { date: '05 Sep 2023', event: 'Semester 1 Start', type: 'semester' },
      { date: '13 Jan 2024', event: 'Semester 2 Start', type: 'semester' },
    ],
  },
  {
    id: 'SFE-2024-0058', firstName: 'Claudine', fullName: 'Claudine Mukamana', initials: 'CM',
    programme: 'Computer Science', year: 1, enrollmentDate: '02 Sep 2024', expectedGrad: 'Jul 2027',
    status: 'Suspended', email: 'claudine.mukamana@sfu.ac.rw', phone: '+250 722 700 800',
    dob: '03 Sep 2005', gender: 'Female', nationality: 'Rwandan', address: 'KN 1 Rd, Kigali',
    cgpa: 1.8, standing: 'Suspended',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 1.8, results: [
        { code: 'CSC 101', name: 'Introduction to Computer Science', grade: 'D',  credits: 3 },
        { code: 'CSC 102', name: 'Programming Fundamentals',         grade: 'F',  credits: 3 },
        { code: 'MTH 101', name: 'Calculus I',                       grade: 'D+', credits: 3 },
        { code: 'ENG 101', name: 'English Communication Skills',     grade: 'C',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '02 Sep 2024', event: 'Admitted', type: 'admission' },
      { date: '15 Sep 2024', event: 'Course Registration', type: 'registration' },
      { date: '02 Sep 2024', event: 'Semester 1 Start', type: 'semester' },
      { date: '22 Jan 2025', event: 'Suspended', type: 'suspension', notes: 'Academic suspension: GPA below 2.0 threshold.' },
    ],
  },
  {
    id: 'SFE-2024-0071', firstName: 'Eric', fullName: 'Eric Nzeyimana', initials: 'EN',
    programme: 'Computer Science', year: 2, enrollmentDate: '05 Sep 2023', expectedGrad: 'Jul 2026',
    status: 'Active', email: 'eric.nzeyimana@sfu.ac.rw', phone: '+250 788 900 100',
    dob: '28 Jan 2004', gender: 'Male', nationality: 'Rwandan', address: 'KG 8 Ave, Kigali',
    cgpa: 2.9, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 2.9, results: [
        { code: 'CSC 201', name: 'Data Structures & Algorithms', grade: 'C+', credits: 3 },
        { code: 'CSC 202', name: 'Database Management Systems', grade: 'B',  credits: 3 },
        { code: 'MTH 201', name: 'Calculus II',                  grade: 'C',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '05 Sep 2023', event: 'Admitted', type: 'admission' },
      { date: '20 Sep 2023', event: 'Course Registration', type: 'registration' },
      { date: '05 Sep 2023', event: 'Semester 1 Start', type: 'semester' },
    ],
  },
  {
    id: 'SFE-2024-0089', firstName: 'Aline', fullName: 'Aline Ingabire', initials: 'AI',
    programme: 'Computer Science', year: 1, enrollmentDate: '02 Sep 2024', expectedGrad: 'Jul 2027',
    status: 'Active', email: 'aline.ingabire@sfu.ac.rw', phone: '+250 722 200 300',
    dob: '15 Apr 2005', gender: 'Female', nationality: 'Rwandan', address: 'KN 7 Ave, Kigali',
    cgpa: 3.9, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.9, results: [
        { code: 'CSC 101', name: 'Introduction to Computer Science', grade: 'A+', credits: 3 },
        { code: 'CSC 102', name: 'Programming Fundamentals',         grade: 'A',  credits: 3 },
        { code: 'MTH 101', name: 'Calculus I',                       grade: 'A',  credits: 3 },
        { code: 'ENG 101', name: 'English Communication Skills',     grade: 'A',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '02 Sep 2024', event: 'Admitted', type: 'admission' },
      { date: '15 Sep 2024', event: 'Course Registration', type: 'registration' },
      { date: '02 Sep 2024', event: 'Semester 1 Start', type: 'semester' },
    ],
  },
  {
    id: 'SFE-2024-0023', firstName: 'Alice', fullName: 'Alice Mukeshimana', initials: 'AM',
    programme: 'Business Administration', year: 2, enrollmentDate: '05 Sep 2023', expectedGrad: 'Jul 2026',
    status: 'Active', email: 'alice.mukeshimana@sfu.ac.rw', phone: '+250 788 400 500',
    dob: '07 Nov 2003', gender: 'Female', nationality: 'Rwandan', address: 'KG 30 Ave, Kigali',
    cgpa: 3.4, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.4, results: [
        { code: 'BUS 201', name: 'Organisational Behaviour',  grade: 'B+', credits: 3 },
        { code: 'BUS 202', name: 'Financial Accounting',      grade: 'A',  credits: 3 },
        { code: 'BUS 203', name: 'Business Communication',    grade: 'B',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '05 Sep 2023', event: 'Admitted', type: 'admission' },
      { date: '20 Sep 2023', event: 'Course Registration', type: 'registration' },
    ],
  },
  {
    id: 'SFE-2024-0055', firstName: 'Solange', fullName: 'Solange Mutesi', initials: 'SM',
    programme: 'Business Administration', year: 1, enrollmentDate: '02 Sep 2024', expectedGrad: 'Jul 2027',
    status: 'Active', email: 'solange.mutesi@sfu.ac.rw', phone: '+250 722 600 700',
    dob: '19 Aug 2005', gender: 'Female', nationality: 'Rwandan', address: 'KN 12 Rd, Kigali',
    cgpa: 2.7, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 2.7, results: [
        { code: 'BUS 101', name: 'Principles of Management', grade: 'C+', credits: 3 },
        { code: 'BUS 102', name: 'Introduction to Economics', grade: 'B',  credits: 3 },
        { code: 'ENG 101', name: 'English Communication Skills', grade: 'C', credits: 3 },
      ]},
    ],
    timeline: [
      { date: '02 Sep 2024', event: 'Admitted', type: 'admission' },
      { date: '15 Sep 2024', event: 'Course Registration', type: 'registration' },
    ],
  },
  {
    id: 'SFE-2024-0011', firstName: 'Emmanuel', fullName: 'Emmanuel Habineza', initials: 'EH',
    programme: 'Business Administration', year: 3, enrollmentDate: '10 Sep 2022', expectedGrad: 'Jul 2025',
    status: 'Active', email: 'emmanuel.habineza@sfu.ac.rw', phone: '+250 788 800 900',
    dob: '01 May 2003', gender: 'Male', nationality: 'Rwandan', address: 'KG 5 Ave, Kigali',
    cgpa: 3.5, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.5, results: [
        { code: 'BUS 301', name: 'Strategic Management',    grade: 'A',  credits: 3 },
        { code: 'BUS 302', name: 'International Business',  grade: 'B+', credits: 3 },
        { code: 'BUS 303', name: 'Entrepreneurship',        grade: 'A',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '10 Sep 2022', event: 'Admitted', type: 'admission' },
      { date: '25 Sep 2022', event: 'Course Registration', type: 'registration' },
    ],
  },
  {
    id: 'SFE-2024-0027', firstName: 'Marie', fullName: 'Marie Uwantege', initials: 'MU',
    programme: 'Computer Science', year: 3, enrollmentDate: '10 Sep 2022', expectedGrad: 'Jul 2025',
    status: 'Deferred', email: 'marie.uwantege@sfu.ac.rw', phone: '+250 722 150 250',
    dob: '14 Jul 2002', gender: 'Female', nationality: 'Rwandan', address: 'KN 9 Ave, Kigali',
    cgpa: 2.5, standing: 'Probation',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 2.2, results: [
        { code: 'CSC 301', name: 'Software Engineering',  grade: 'C',  credits: 3 },
        { code: 'CSC 302', name: 'Computer Networks',     grade: 'D+', credits: 3 },
      ]},
    ],
    timeline: [
      { date: '10 Sep 2022', event: 'Admitted', type: 'admission' },
      { date: '14 Jan 2025', event: 'Enrollment Deferred', type: 'deferral', notes: 'Student requested deferral for personal reasons.' },
    ],
  },
  {
    id: 'SFE-2024-0068', firstName: 'Fred', fullName: 'Fred Nkurunziza', initials: 'FN',
    programme: 'Computer Science', year: 2, enrollmentDate: '05 Sep 2023', expectedGrad: 'Jul 2026',
    status: 'Active', email: 'fred.nkurunziza@sfu.ac.rw', phone: '+250 788 350 450',
    dob: '22 Mar 2004', gender: 'Male', nationality: 'Rwandan', address: 'KG 18 Ave, Kigali',
    cgpa: 2.1, standing: 'Probation',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 2.1, results: [
        { code: 'CSC 201', name: 'Data Structures & Algorithms', grade: 'D+', credits: 3 },
        { code: 'CSC 202', name: 'Database Management Systems', grade: 'C',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '05 Sep 2023', event: 'Admitted', type: 'admission' },
      { date: '20 Sep 2023', event: 'Course Registration', type: 'registration' },
    ],
  },
  {
    id: 'SFE-2024-0039', firstName: 'Robert', fullName: 'Robert Uwera', initials: 'RU',
    programme: 'Business Administration', year: 1, enrollmentDate: '02 Sep 2024', expectedGrad: 'Jul 2027',
    status: 'Active', email: 'robert.uwera@sfu.ac.rw', phone: '+250 722 450 550',
    dob: '30 Dec 2004', gender: 'Male', nationality: 'Rwandan', address: 'KN 14 Rd, Kigali',
    cgpa: 3.1, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.1, results: [
        { code: 'BUS 101', name: 'Principles of Management',    grade: 'B',  credits: 3 },
        { code: 'BUS 102', name: 'Introduction to Economics',   grade: 'B+', credits: 3 },
        { code: 'ENG 101', name: 'English Communication Skills', grade: 'B',  credits: 3 },
      ]},
    ],
    timeline: [
      { date: '02 Sep 2024', event: 'Admitted', type: 'admission' },
      { date: '15 Sep 2024', event: 'Course Registration', type: 'registration' },
    ],
  },
  {
    id: 'SFE-2024-0015', firstName: 'Christine', fullName: 'Christine Ishimwe', initials: 'CI',
    programme: 'Computer Science', year: 4, enrollmentDate: '10 Sep 2021', expectedGrad: 'Jul 2025',
    status: 'Active', email: 'christine.ishimwe@sfu.ac.rw', phone: '+250 788 550 650',
    dob: '06 Aug 2002', gender: 'Female', nationality: 'Rwandan', address: 'KG 25 Ave, Kigali',
    cgpa: 3.7, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.7, results: [
        { code: 'CSC 401', name: 'Machine Learning Fundamentals', grade: 'A',  credits: 3 },
        { code: 'CSC 402', name: 'Cloud Computing',               grade: 'A',  credits: 3 },
        { code: 'CSC 403', name: 'Capstone Project',              grade: 'B+', credits: 6 },
      ]},
    ],
    timeline: [
      { date: '10 Sep 2021', event: 'Admitted', type: 'admission' },
      { date: '25 Sep 2021', event: 'Course Registration', type: 'registration' },
    ],
  },
  {
    id: 'SFE-2024-0031', firstName: 'Bruno', fullName: 'Bruno Ineza', initials: 'BI',
    programme: 'Business Administration', year: 2, enrollmentDate: '05 Sep 2023', expectedGrad: 'Jul 2026',
    status: 'Active', email: 'bruno.ineza@sfu.ac.rw', phone: '+250 722 750 850',
    dob: '13 Oct 2003', gender: 'Male', nationality: 'Rwandan', address: 'KN 3 Rd, Kigali',
    cgpa: 3.0, standing: 'Good Standing',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 3.0, results: [
        { code: 'BUS 201', name: 'Organisational Behaviour', grade: 'B',  credits: 3 },
        { code: 'BUS 202', name: 'Financial Accounting',     grade: 'B+', credits: 3 },
      ]},
    ],
    timeline: [
      { date: '05 Sep 2023', event: 'Admitted', type: 'admission' },
      { date: '20 Sep 2023', event: 'Course Registration', type: 'registration' },
    ],
  },
  {
    id: 'SFE-2024-0059', firstName: 'Rose', fullName: 'Rose Mukamugema', initials: 'RM',
    programme: 'Computer Science', year: 1, enrollmentDate: '02 Sep 2024', expectedGrad: 'Jul 2027',
    status: 'Graduated', email: 'rose.mukamugema@sfu.ac.rw', phone: '+250 788 050 150',
    dob: '09 Jun 2005', gender: 'Female', nationality: 'Rwandan', address: 'KG 10 Ave, Kigali',
    cgpa: 1.5, standing: 'Suspended',
    semesters: [
      { name: 'Semester 1 · 2024/2025', gpa: 1.5, results: [
        { code: 'CSC 101', name: 'Introduction to Computer Science', grade: 'F', credits: 3 },
        { code: 'CSC 102', name: 'Programming Fundamentals',         grade: 'D', credits: 3 },
      ]},
    ],
    timeline: [
      { date: '02 Sep 2024', event: 'Admitted', type: 'admission' },
      { date: '15 Sep 2024', event: 'Course Registration', type: 'registration' },
    ],
  },
]

// ── Courses (10) ──────────────────────────────────────────────────────────────

export interface Course {
  id:            number
  code:          string
  name:          string
  department:    string
  credits:       number
  type:          CourseType
  lecturer:      string
  enrolled:      number
  status:        CourseStatus
  description:   string
  prerequisites: string[]
  semester:      string
}

export const COURSES: Course[] = [
  { id: 1,  code: 'CSC 101', name: 'Introduction to Computer Science', department: 'Computer Science',    credits: 3, type: 'Compulsory', lecturer: 'Dr. Emmanuel Nkurunziza',   enrolled: 48, status: 'Active',   description: 'Foundational concepts of computing, algorithms, and problem solving.', prerequisites: [], semester: 'Semester 1' },
  { id: 2,  code: 'CSC 102', name: 'Programming Fundamentals',         department: 'Computer Science',    credits: 3, type: 'Compulsory', lecturer: 'Prof. Aline Uwimana',       enrolled: 48, status: 'Active',   description: 'Introduction to programming using Python. Variables, control flow, functions.', prerequisites: ['CSC 101'], semester: 'Semester 1' },
  { id: 3,  code: 'CSC 201', name: 'Data Structures & Algorithms',     department: 'Computer Science',    credits: 3, type: 'Compulsory', lecturer: 'Dr. Patrick Habimana',      enrolled: 36, status: 'Active',   description: 'Arrays, linked lists, trees, graphs, sorting and searching algorithms.', prerequisites: ['CSC 102'], semester: 'Semester 1' },
  { id: 4,  code: 'CSC 202', name: 'Database Management Systems',      department: 'Computer Science',    credits: 3, type: 'Compulsory', lecturer: 'Dr. Samuel Ndayishimiye',   enrolled: 36, status: 'Active',   description: 'Relational databases, SQL, normalisation, and transaction management.', prerequisites: ['CSC 101'], semester: 'Semester 1' },
  { id: 5,  code: 'CSC 301', name: 'Software Engineering',             department: 'Computer Science',    credits: 3, type: 'Compulsory', lecturer: 'Dr. Emmanuel Nkurunziza',   enrolled: 24, status: 'Active',   description: 'Software development lifecycle, design patterns, and testing methodologies.', prerequisites: ['CSC 201', 'CSC 202'], semester: 'Semester 1' },
  { id: 6,  code: 'MTH 101', name: 'Calculus I',                       department: 'Mathematics',         credits: 3, type: 'Compulsory', lecturer: 'Dr. Patrick Habimana',      enrolled: 120,status: 'Active',   description: 'Limits, derivatives, integrals, and the fundamental theorem of calculus.', prerequisites: [], semester: 'Semester 1' },
  { id: 7,  code: 'MTH 201', name: 'Calculus II',                      department: 'Mathematics',         credits: 3, type: 'Compulsory', lecturer: 'Dr. Patrick Habimana',      enrolled: 80, status: 'Active',   description: 'Sequences, series, multivariable calculus, and differential equations.', prerequisites: ['MTH 101'], semester: 'Semester 2' },
  { id: 8,  code: 'ENG 101', name: 'English Communication Skills',     department: 'Languages',           credits: 3, type: 'Compulsory', lecturer: 'Ms. Grace Mukamana',        enrolled: 180,status: 'Active',   description: 'Academic writing, oral communication, and professional language skills.', prerequisites: [], semester: 'Semester 1' },
  { id: 9,  code: 'BUS 101', name: 'Principles of Management',         department: 'Business',            credits: 3, type: 'Compulsory', lecturer: 'Prof. Solange Kayitesi',    enrolled: 65, status: 'Active',   description: 'Management theories, organisational structures, and leadership principles.', prerequisites: [], semester: 'Semester 1' },
  { id: 10, code: 'BUS 201', name: 'Organisational Behaviour',         department: 'Business',            credits: 3, type: 'Elective',   lecturer: 'Prof. Solange Kayitesi',    enrolled: 40, status: 'Active',   description: 'Human behaviour in organisations, motivation, teamwork, and conflict resolution.', prerequisites: ['BUS 101'], semester: 'Semester 1' },
  { id: 11, code: 'CSC 401', name: 'Machine Learning Fundamentals',    department: 'Computer Science',    credits: 3, type: 'Elective',   lecturer: 'Dr. Samuel Ndayishimiye',   enrolled: 18, status: 'Active',   description: 'Supervised and unsupervised learning, neural networks, model evaluation.', prerequisites: ['CSC 201', 'MTH 201'], semester: 'Semester 1' },
  { id: 12, code: 'CSC 999', name: 'Web Development (Legacy)',         department: 'Computer Science',    credits: 3, type: 'Elective',   lecturer: 'Prof. Aline Uwimana',       enrolled: 0,  status: 'Archived', description: 'Archived course. Replaced by CSC 305 Modern Web Technologies.', prerequisites: [], semester: 'Semester 1' },
]

// ── Programmes (4) ────────────────────────────────────────────────────────────

export interface Programme {
  id:          number
  name:        string
  department:  string
  duration:    string
  totalCredits: number
  enrolled:    number
  status:      'Active' | 'Inactive'
  description: string
  years: {
    year: number
    semesters: {
      name: string
      courses: { code: string; name: string; type: CourseType; credits: number }[]
    }[]
  }[]
}

export const PROGRAMMES: Programme[] = [
  {
    id: 1, name: 'Computer Science', department: 'School of Computing',
    duration: '3 years', totalCredits: 120, enrolled: 162, status: 'Active',
    description: 'A rigorous programme covering algorithms, software engineering, databases, and AI.',
    years: [
      { year: 1, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'CSC 101', name: 'Introduction to Computer Science', type: 'Compulsory', credits: 3 },
          { code: 'CSC 102', name: 'Programming Fundamentals',         type: 'Compulsory', credits: 3 },
          { code: 'MTH 101', name: 'Calculus I',                       type: 'Compulsory', credits: 3 },
          { code: 'ENG 101', name: 'English Communication Skills',     type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'CSC 111', name: 'Object-Oriented Programming',      type: 'Compulsory', credits: 3 },
          { code: 'CSC 112', name: 'Discrete Mathematics',             type: 'Compulsory', credits: 3 },
          { code: 'MTH 102', name: 'Linear Algebra',                   type: 'Compulsory', credits: 3 },
          { code: 'ENG 102', name: 'Technical Writing',                type: 'Elective',   credits: 3 },
        ]},
      ]},
      { year: 2, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'CSC 201', name: 'Data Structures & Algorithms',     type: 'Compulsory', credits: 3 },
          { code: 'CSC 202', name: 'Database Management Systems',      type: 'Compulsory', credits: 3 },
          { code: 'MTH 201', name: 'Calculus II',                      type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'CSC 211', name: 'Computer Architecture',            type: 'Compulsory', credits: 3 },
          { code: 'CSC 212', name: 'Operating Systems',                type: 'Compulsory', credits: 3 },
          { code: 'CSC 213', name: 'Web Technologies',                 type: 'Elective',   credits: 3 },
        ]},
      ]},
      { year: 3, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'CSC 301', name: 'Software Engineering',             type: 'Compulsory', credits: 3 },
          { code: 'CSC 302', name: 'Computer Networks',                type: 'Compulsory', credits: 3 },
          { code: 'CSC 401', name: 'Machine Learning Fundamentals',    type: 'Elective',   credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'CSC 402', name: 'Cloud Computing',                  type: 'Elective',   credits: 3 },
          { code: 'CSC 403', name: 'Capstone Project',                 type: 'Compulsory', credits: 6 },
        ]},
      ]},
    ],
  },
  {
    id: 2, name: 'Information Technology', department: 'School of Computing',
    duration: '3 years', totalCredits: 114, enrolled: 98, status: 'Active',
    description: 'Focused on IT systems, networking, cybersecurity, and enterprise solutions.',
    years: [
      { year: 1, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'CSC 101', name: 'Introduction to Computer Science', type: 'Compulsory', credits: 3 },
          { code: 'ITN 101', name: 'Networking Fundamentals',          type: 'Compulsory', credits: 3 },
          { code: 'ENG 101', name: 'English Communication Skills',     type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'ITN 102', name: 'IT Support & Systems',             type: 'Compulsory', credits: 3 },
          { code: 'CSC 102', name: 'Programming Fundamentals',         type: 'Elective',   credits: 3 },
        ]},
      ]},
      { year: 2, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'ITN 201', name: 'Network Administration',           type: 'Compulsory', credits: 3 },
          { code: 'ITN 202', name: 'Cybersecurity Fundamentals',       type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'ITN 211', name: 'Enterprise IT Architecture',       type: 'Compulsory', credits: 3 },
          { code: 'ITN 212', name: 'Cloud Services',                   type: 'Elective',   credits: 3 },
        ]},
      ]},
      { year: 3, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'ITN 301', name: 'IT Project Management',            type: 'Compulsory', credits: 3 },
          { code: 'ITN 302', name: 'Digital Transformation',           type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'ITN 303', name: 'Capstone IT Project',              type: 'Compulsory', credits: 6 },
        ]},
      ]},
    ],
  },
  {
    id: 3, name: 'Mathematics', department: 'School of Sciences',
    duration: '3 years', totalCredits: 108, enrolled: 54, status: 'Active',
    description: 'Pure and applied mathematics covering analysis, algebra, and statistics.',
    years: [
      { year: 1, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'MTH 101', name: 'Calculus I',                  type: 'Compulsory', credits: 3 },
          { code: 'MTH 103', name: 'Introduction to Statistics',  type: 'Compulsory', credits: 3 },
          { code: 'ENG 101', name: 'English Communication Skills', type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'MTH 102', name: 'Linear Algebra',              type: 'Compulsory', credits: 3 },
          { code: 'MTH 104', name: 'Discrete Mathematics',        type: 'Compulsory', credits: 3 },
        ]},
      ]},
      { year: 2, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'MTH 201', name: 'Calculus II',                 type: 'Compulsory', credits: 3 },
          { code: 'MTH 202', name: 'Abstract Algebra',            type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'MTH 211', name: 'Real Analysis',               type: 'Compulsory', credits: 3 },
          { code: 'MTH 212', name: 'Probability Theory',          type: 'Elective',   credits: 3 },
        ]},
      ]},
      { year: 3, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'MTH 301', name: 'Numerical Methods',           type: 'Compulsory', credits: 3 },
          { code: 'MTH 302', name: 'Complex Analysis',            type: 'Elective',   credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'MTH 303', name: 'Mathematics Project',         type: 'Compulsory', credits: 6 },
        ]},
      ]},
    ],
  },
  {
    id: 4, name: 'Business Administration', department: 'School of Business',
    duration: '3 years', totalCredits: 108, enrolled: 175, status: 'Active',
    description: 'Comprehensive business education covering management, finance, marketing, and entrepreneurship.',
    years: [
      { year: 1, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'BUS 101', name: 'Principles of Management',      type: 'Compulsory', credits: 3 },
          { code: 'BUS 102', name: 'Introduction to Economics',     type: 'Compulsory', credits: 3 },
          { code: 'ENG 101', name: 'English Communication Skills',  type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'BUS 111', name: 'Business Mathematics',          type: 'Compulsory', credits: 3 },
          { code: 'BUS 112', name: 'Principles of Marketing',       type: 'Compulsory', credits: 3 },
        ]},
      ]},
      { year: 2, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'BUS 201', name: 'Organisational Behaviour',      type: 'Compulsory', credits: 3 },
          { code: 'BUS 202', name: 'Financial Accounting',          type: 'Compulsory', credits: 3 },
          { code: 'BUS 203', name: 'Business Communication',        type: 'Compulsory', credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'BUS 211', name: 'Operations Management',         type: 'Compulsory', credits: 3 },
          { code: 'BUS 212', name: 'Human Resource Management',     type: 'Elective',   credits: 3 },
        ]},
      ]},
      { year: 3, semesters: [
        { name: 'Semester 1', courses: [
          { code: 'BUS 301', name: 'Strategic Management',          type: 'Compulsory', credits: 3 },
          { code: 'BUS 302', name: 'International Business',        type: 'Elective',   credits: 3 },
          { code: 'BUS 303', name: 'Entrepreneurship',              type: 'Elective',   credits: 3 },
        ]},
        { name: 'Semester 2', courses: [
          { code: 'BUS 304', name: 'Business Research Project',     type: 'Compulsory', credits: 6 },
        ]},
      ]},
    ],
  },
]

// ── Lecturers / Faculty (6) ───────────────────────────────────────────────────

export interface Lecturer {
  id:          string
  name:        string
  initials:    string
  department:  string
  email:       string
  phone:       string
  status:      'Active' | 'On Leave' | 'Inactive'
  assignedCourses: { code: string; name: string; enrolled: number; semester: string }[]
}

export const LECTURERS: Lecturer[] = [
  {
    id: 'LEC-2024-0001', name: 'Dr. Emmanuel Nkurunziza', initials: 'EN',
    department: 'Computer Science', email: 'e.nkurunziza@sfu.ac.rw', phone: '+250 788 001 001',
    status: 'Active',
    assignedCourses: [
      { code: 'CSC 101', name: 'Introduction to Computer Science', enrolled: 48, semester: 'Semester 1' },
      { code: 'CSC 301', name: 'Software Engineering',             enrolled: 24, semester: 'Semester 1' },
    ],
  },
  {
    id: 'LEC-2024-0002', name: 'Prof. Aline Uwimana', initials: 'AU',
    department: 'Computer Science', email: 'a.uwimana@sfu.ac.rw', phone: '+250 722 002 002',
    status: 'Active',
    assignedCourses: [
      { code: 'CSC 102', name: 'Programming Fundamentals', enrolled: 48, semester: 'Semester 1' },
    ],
  },
  {
    id: 'LEC-2024-0003', name: 'Dr. Patrick Habimana', initials: 'PH',
    department: 'Mathematics', email: 'p.habimana@sfu.ac.rw', phone: '+250 788 003 003',
    status: 'Active',
    assignedCourses: [
      { code: 'MTH 101', name: 'Calculus I',    enrolled: 120, semester: 'Semester 1' },
      { code: 'MTH 201', name: 'Calculus II',   enrolled: 80,  semester: 'Semester 2' },
    ],
  },
  {
    id: 'LEC-2024-0004', name: 'Ms. Grace Mukamana', initials: 'GM',
    department: 'Languages', email: 'g.mukamana@sfu.ac.rw', phone: '+250 722 004 004',
    status: 'On Leave',
    assignedCourses: [
      { code: 'ENG 101', name: 'English Communication Skills', enrolled: 180, semester: 'Semester 1' },
    ],
  },
  {
    id: 'LEC-2024-0005', name: 'Prof. Solange Kayitesi', initials: 'SK',
    department: 'Business', email: 's.kayitesi@sfu.ac.rw', phone: '+250 788 005 005',
    status: 'Active',
    assignedCourses: [
      { code: 'BUS 101', name: 'Principles of Management',  enrolled: 65, semester: 'Semester 1' },
      { code: 'BUS 201', name: 'Organisational Behaviour',  enrolled: 40, semester: 'Semester 1' },
    ],
  },
  {
    id: 'LEC-2024-0006', name: 'Dr. Samuel Ndayishimiye', initials: 'SN',
    department: 'Computer Science', email: 's.ndayishimiye@sfu.ac.rw', phone: '+250 722 006 006',
    status: 'Active',
    assignedCourses: [
      { code: 'CSC 202', name: 'Database Management Systems', enrolled: 36, semester: 'Semester 1' },
      { code: 'CSC 401', name: 'Machine Learning Fundamentals', enrolled: 18, semester: 'Semester 1' },
    ],
  },
]

// ── Pending Results (6) ───────────────────────────────────────────────────────

export interface PendingResult {
  id:            number
  courseCode:    string
  courseName:    string
  lecturer:      string
  assessment:    string
  submittedDate: string
  studentCount:  number
  status:        ResultStatus
  avg:           number
  highest:       number
  lowest:        number
  passRate:      number
  results:       { studentId: string; name: string; marks: number; grade: string }[]
}

export const PENDING_RESULTS: PendingResult[] = [
  {
    id: 1, courseCode: 'CSC 101', courseName: 'Introduction to Computer Science',
    lecturer: 'Dr. Emmanuel Nkurunziza', assessment: 'Semester 1 Final Exam',
    submittedDate: '20 Jan 2025', studentCount: 48, status: 'Pending',
    avg: 72, highest: 95, lowest: 38, passRate: 87,
    results: [
      { studentId: 'SFE-2024-0042', name: 'Jean-Paul Mugisha',  marks: 88, grade: 'A'  },
      { studentId: 'SFE-2024-0017', name: 'Diane Umutoniwase',  marks: 75, grade: 'B+' },
      { studentId: 'SFE-2024-0089', name: 'Aline Ingabire',     marks: 95, grade: 'A+' },
      { studentId: 'SFE-2024-0058', name: 'Claudine Mukamana',  marks: 48, grade: 'D'  },
      { studentId: 'SFE-2024-0059', name: 'Rose Mukamugema',    marks: 38, grade: 'F'  },
    ],
  },
  {
    id: 2, courseCode: 'MTH 101', courseName: 'Calculus I',
    lecturer: 'Dr. Patrick Habimana', assessment: 'Mid-Semester Assessment',
    submittedDate: '19 Jan 2025', studentCount: 120, status: 'Pending',
    avg: 68, highest: 92, lowest: 32, passRate: 79,
    results: [
      { studentId: 'SFE-2024-0042', name: 'Jean-Paul Mugisha',  marks: 85, grade: 'A'  },
      { studentId: 'SFE-2024-0017', name: 'Diane Umutoniwase',  marks: 78, grade: 'B+' },
      { studentId: 'SFE-2024-0033', name: 'Patrick Habimana',   marks: 92, grade: 'A+' },
      { studentId: 'SFE-2024-0058', name: 'Claudine Mukamana',  marks: 45, grade: 'D'  },
    ],
  },
  {
    id: 3, courseCode: 'CSC 201', courseName: 'Data Structures & Algorithms',
    lecturer: 'Dr. Patrick Habimana', assessment: 'Semester 1 Final Exam',
    submittedDate: '18 Jan 2025', studentCount: 36, status: 'Pending',
    avg: 74, highest: 91, lowest: 42, passRate: 92,
    results: [
      { studentId: 'SFE-2024-0033', name: 'Patrick Habimana',  marks: 91, grade: 'A+' },
      { studentId: 'SFE-2024-0071', name: 'Eric Nzeyimana',    marks: 62, grade: 'C+' },
      { studentId: 'SFE-2024-0068', name: 'Fred Nkurunziza',   marks: 55, grade: 'C'  },
    ],
  },
  {
    id: 4, courseCode: 'BUS 101', courseName: 'Principles of Management',
    lecturer: 'Prof. Solange Kayitesi', assessment: 'Semester 1 Final Exam',
    submittedDate: '17 Jan 2025', studentCount: 65, status: 'Pending',
    avg: 70, highest: 89, lowest: 40, passRate: 85,
    results: [
      { studentId: 'SFE-2024-0055', name: 'Solange Mutesi',     marks: 67, grade: 'C+' },
      { studentId: 'SFE-2024-0039', name: 'Robert Uwera',       marks: 75, grade: 'B'  },
      { studentId: 'SFE-2024-0031', name: 'Bruno Ineza',        marks: 78, grade: 'B'  },
    ],
  },
  {
    id: 5, courseCode: 'ENG 101', courseName: 'English Communication Skills',
    lecturer: 'Ms. Grace Mukamana', assessment: 'Coursework Assessment',
    submittedDate: '16 Jan 2025', studentCount: 180, status: 'Pending',
    avg: 76, highest: 97, lowest: 45, passRate: 93,
    results: [
      { studentId: 'SFE-2024-0042', name: 'Jean-Paul Mugisha', marks: 80, grade: 'B'  },
      { studentId: 'SFE-2024-0017', name: 'Diane Umutoniwase', marks: 90, grade: 'A'  },
      { studentId: 'SFE-2024-0089', name: 'Aline Ingabire',    marks: 97, grade: 'A+' },
    ],
  },
  {
    id: 6, courseCode: 'CSC 202', courseName: 'Database Management Systems',
    lecturer: 'Dr. Samuel Ndayishimiye', assessment: 'Mid-Semester Assessment',
    submittedDate: '15 Jan 2025', studentCount: 36, status: 'Pending',
    avg: 69, highest: 88, lowest: 35, passRate: 81,
    results: [
      { studentId: 'SFE-2024-0033', name: 'Patrick Habimana', marks: 88, grade: 'A'  },
      { studentId: 'SFE-2024-0071', name: 'Eric Nzeyimana',   marks: 70, grade: 'B'  },
    ],
  },
]

// ── At-Risk Students (8) ──────────────────────────────────────────────────────

export interface AtRiskStudent {
  id:          string
  name:        string
  initials:    string
  programme:   string
  year:        number
  riskLevel:   RiskLevel
  riskFactors: { label: string; severity: 'error' | 'warning' }[]
  gpa:         number
  attendance:  number
  advisor?:    string
  resolved?:   boolean
  resolvedDate?: string
  resolution?:   string
}

export const AT_RISK_STUDENTS: AtRiskStudent[] = [
  {
    id: 'SFE-2024-0058', name: 'Claudine Mukamana', initials: 'CM', programme: 'Computer Science', year: 1,
    riskLevel: 'High', gpa: 1.8, attendance: 42,
    riskFactors: [
      { label: 'Attendance: 42%',     severity: 'error'   },
      { label: 'GPA: 1.8',            severity: 'error'   },
      { label: 'Failed 2 courses',    severity: 'error'   },
    ],
  },
  {
    id: 'SFE-2024-0059', name: 'Rose Mukamugema', initials: 'RM', programme: 'Computer Science', year: 1,
    riskLevel: 'High', gpa: 1.5, attendance: 38,
    riskFactors: [
      { label: 'Attendance: 38%',     severity: 'error'   },
      { label: 'GPA: 1.5',            severity: 'error'   },
      { label: 'Missing 5 assignments', severity: 'error' },
      { label: 'Fee hold active',     severity: 'warning' },
    ],
  },
  {
    id: 'SFE-2024-0068', name: 'Fred Nkurunziza', initials: 'FN', programme: 'Computer Science', year: 2,
    riskLevel: 'High', gpa: 2.1, attendance: 55,
    riskFactors: [
      { label: 'GPA: 2.1 (Probation)', severity: 'error'  },
      { label: 'Attendance: 55%',      severity: 'warning' },
      { label: 'Missing 3 assignments', severity: 'warning' },
    ],
  },
  {
    id: 'SFE-2024-0027', name: 'Marie Uwantege', initials: 'MU', programme: 'Computer Science', year: 3,
    riskLevel: 'Medium', gpa: 2.5, attendance: 62,
    riskFactors: [
      { label: 'GPA: 2.5 (Probation)', severity: 'warning' },
      { label: 'Attendance: 62%',      severity: 'warning' },
      { label: 'Enrollment deferred',  severity: 'warning' },
    ],
  },
  {
    id: 'SFE-2024-0071', name: 'Eric Nzeyimana', initials: 'EN', programme: 'Computer Science', year: 2,
    riskLevel: 'Medium', gpa: 2.9, attendance: 68,
    riskFactors: [
      { label: 'Avg grade: C+',       severity: 'warning' },
      { label: 'Attendance: 68%',     severity: 'warning' },
      { label: 'Outstanding fees',    severity: 'warning' },
    ],
  },
  {
    id: 'SFE-2024-0055', name: 'Solange Mutesi', initials: 'SM', programme: 'Business Administration', year: 1,
    riskLevel: 'Medium', gpa: 2.7, attendance: 71,
    riskFactors: [
      { label: 'GPA: 2.7',            severity: 'warning' },
      { label: 'Missing 2 assignments', severity: 'warning' },
    ],
  },
  {
    id: 'SFE-2024-0031', name: 'Bruno Ineza', initials: 'BI', programme: 'Business Administration', year: 2,
    riskLevel: 'Low', gpa: 3.0, attendance: 76,
    riskFactors: [
      { label: 'Attendance: 76%',     severity: 'warning' },
      { label: 'Late submission ×2',  severity: 'warning' },
    ],
  },
  {
    id: 'SFE-2024-0017', name: 'Diane Umutoniwase', initials: 'DU', programme: 'Computer Science', year: 1,
    riskLevel: 'Low', gpa: 3.2, attendance: 78,
    riskFactors: [
      { label: 'Failed payment attempt', severity: 'warning' },
      { label: 'Attendance: 78%',        severity: 'warning' },
    ],
    resolved: true, resolvedDate: '21 Jan 2025', advisor: 'Dr. Emmanuel Nkurunziza', resolution: 'Counselling session scheduled. Student confirmed payment plan with Bursar.',
  },
]

// ── Calendar Events ───────────────────────────────────────────────────────────

export type CalEventType = 'Semester' | 'Registration' | 'Exam' | 'Holiday' | 'Deadline' | 'Results'

export interface CalEvent {
  id:          number
  title:       string
  type:        CalEventType
  startDate:   string
  endDate:     string
  description?: string
  affectsAll:  boolean
}

export const CAL_EVENTS: CalEvent[] = [
  { id: 1,  title: 'Semester 1 Start',               type: 'Semester',      startDate: '2024-09-02', endDate: '2024-09-02', affectsAll: true,  description: 'Start of Semester 1 for the 2024/2025 academic year.' },
  { id: 2,  title: 'Course Registration — Semester 1', type: 'Registration', startDate: '2024-09-02', endDate: '2024-09-15', affectsAll: true,  description: 'Students may register for Semester 1 courses within this window.' },
  { id: 3,  title: 'Mid-Semester Break',             type: 'Holiday',       startDate: '2024-10-28', endDate: '2024-11-01', affectsAll: true,  description: 'No classes during this period.' },
  { id: 4,  title: 'Examination Period — Semester 1', type: 'Exam',         startDate: '2024-12-02', endDate: '2024-12-15', affectsAll: true,  description: 'End-of-semester examinations for all Year 1 and Year 2 students.' },
  { id: 5,  title: 'Semester 1 End',                 type: 'Semester',      startDate: '2024-12-20', endDate: '2024-12-20', affectsAll: true  },
  { id: 6,  title: 'Results Release — Semester 1',   type: 'Results',       startDate: '2025-01-10', endDate: '2025-01-10', affectsAll: true,  description: 'Approved results published to the student portal.' },
  { id: 7,  title: 'Semester 2 Start',               type: 'Semester',      startDate: '2025-01-13', endDate: '2025-01-13', affectsAll: true,  description: 'Start of Semester 2 for the 2024/2025 academic year.' },
  { id: 8,  title: 'Course Registration — Semester 2', type: 'Registration', startDate: '2025-01-13', endDate: '2025-01-28', affectsAll: true,  description: 'Students may register for Semester 2 courses within this window.' },
  { id: 9,  title: 'Examination Period — Semester 2', type: 'Exam',         startDate: '2025-05-12', endDate: '2025-05-23', affectsAll: true,  description: 'End-of-semester examinations for all students.' },
  { id: 10, title: 'Graduation Ceremony',             type: 'Deadline',     startDate: '2025-07-04', endDate: '2025-07-04', affectsAll: true,  description: 'Annual graduation ceremony for all completing students.' },
]

// ── Timetable Slots ───────────────────────────────────────────────────────────

export interface TimetableSlot {
  id:          number
  day:         number  // 1=Mon … 5=Fri
  hour:        number  // 8 … 17
  courseCode:  string
  courseName:  string
  lecturer:    string
  room:        string
  type:        SessionType
  dept:        string
  color:       string
}

export const TIMETABLE_SLOTS: TimetableSlot[] = [
  { id: 1,  day: 1, hour: 8,  courseCode: 'CSC 101', courseName: 'Intro to CS',             lecturer: 'Dr. Emmanuel Nkurunziza', room: 'Lab 3',    type: 'Lecture',  dept: 'CS',   color: '#0D9488' },
  { id: 2,  day: 1, hour: 14, courseCode: 'MTH 101', courseName: 'Calculus I',              lecturer: 'Dr. Patrick Habimana',    room: 'Hall A',   type: 'Tutorial', dept: 'MTH',  color: '#D97706' },
  { id: 3,  day: 2, hour: 10, courseCode: 'CSC 102', courseName: 'Programming Fundamentals',lecturer: 'Prof. Aline Uwimana',     room: 'Lab 2',    type: 'Lab',      dept: 'CS',   color: '#7C3AED' },
  { id: 4,  day: 2, hour: 14, courseCode: 'ENG 101', courseName: 'English Comm. Skills',    lecturer: 'Ms. Grace Mukamana',      room: 'Room 101', type: 'Lecture',  dept: 'ENG',  color: '#2563EB' },
  { id: 5,  day: 3, hour: 8,  courseCode: 'MTH 101', courseName: 'Calculus I',              lecturer: 'Dr. Patrick Habimana',    room: 'Hall A',   type: 'Lecture',  dept: 'MTH',  color: '#D97706' },
  { id: 6,  day: 3, hour: 10, courseCode: 'CSC 101', courseName: 'Intro to CS',             lecturer: 'Dr. Emmanuel Nkurunziza', room: 'Lab 3',    type: 'Tutorial', dept: 'CS',   color: '#0D9488' },
  { id: 7,  day: 4, hour: 8,  courseCode: 'CSC 102', courseName: 'Programming Fundamentals',lecturer: 'Prof. Aline Uwimana',     room: 'Lab 2',    type: 'Lecture',  dept: 'CS',   color: '#7C3AED' },
  { id: 8,  day: 4, hour: 14, courseCode: 'BUS 101', courseName: 'Principles of Management',lecturer: 'Prof. Solange Kayitesi',  room: 'Hall B',   type: 'Lecture',  dept: 'BUS',  color: '#E11D48' },
  { id: 9,  day: 5, hour: 10, courseCode: 'ENG 101', courseName: 'English Comm. Skills',    lecturer: 'Ms. Grace Mukamana',      room: 'Room 101', type: 'Tutorial', dept: 'ENG',  color: '#2563EB' },
  { id: 10, day: 5, hour: 14, courseCode: 'BUS 101', courseName: 'Principles of Management',lecturer: 'Prof. Solange Kayitesi',  room: 'Hall B',   type: 'Tutorial', dept: 'BUS',  color: '#E11D48' },
]

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotifType = 'Applications' | 'Results' | 'Registration' | 'System' | 'At-Risk'

export interface AcademicNotif {
  id:      number
  type:    NotifType
  title:   string
  body:    string
  time:    string
  read:    boolean
  urgent?: boolean
}

export const ACADEMIC_NOTIFS: AcademicNotif[] = [
  { id: 1,  type: 'Applications',  title: 'New Application Received',            body: 'Grace Uwimana has submitted an application for Computer Science (APP-2025-0034). Documents are complete — ready for review.',                                 time: '2 hours ago', read: false, urgent: false },
  { id: 2,  type: 'Results',       title: 'Results Submitted: CSC 101',           body: 'Dr. Emmanuel Nkurunziza has submitted Semester 1 Final Exam results for CSC 101 (48 students). Awaiting your approval.',                                       time: '3 hours ago', read: false, urgent: true  },
  { id: 3,  type: 'Results',       title: 'Results Submitted: MTH 101',           body: 'Dr. Patrick Habimana has submitted Mid-Semester Assessment results for MTH 101 (120 students). Awaiting your approval.',                                        time: '5 hours ago', read: false, urgent: true  },
  { id: 4,  type: 'At-Risk',       title: 'At-Risk Flag: Claudine Mukamana',      body: 'Student Claudine Mukamana (SFE-2024-0058, CS Year 1) has been flagged as High Risk. Attendance: 42%, GPA: 1.8. Immediate follow-up recommended.',              time: '6 hours ago', read: false, urgent: true  },
  { id: 5,  type: 'Registration',  title: 'Registration Window Closing Soon',     body: 'Semester 2 course registration closes in 5 days (28 January 2025). 312 students have registered; 47 have not yet registered.',                               time: '1 day ago',   read: true,  urgent: false },
  { id: 6,  type: 'Applications',  title: 'Application Requires Review: APP-2025-0032', body: 'Sylvie Ingabire\'s conditional application (Information Technology) — Official Transcript has been uploaded. Action required.',                     time: '1 day ago',   read: true,  urgent: false },
  { id: 7,  type: 'Results',       title: 'Results Submitted: BUS 101',           body: 'Prof. Solange Kayitesi has submitted Semester 1 Final Exam results for BUS 101 (65 students). Awaiting your approval.',                                        time: '2 days ago',  read: true,  urgent: false },
  { id: 8,  type: 'At-Risk',       title: 'At-Risk Flag: Rose Mukamugema',        body: 'Student Rose Mukamugema (SFE-2024-0059, CS Year 1) has been flagged as High Risk. Attendance: 38%, GPA: 1.5. Student has also failed 2 courses.',              time: '2 days ago',  read: true,  urgent: false },
  { id: 9,  type: 'System',        title: 'Scheduled Maintenance Tonight',        body: 'StackEDU platform will undergo scheduled maintenance on 23 January 2025 from 01:00 to 03:00 AM. Data submissions before midnight will not be affected.',       time: '3 days ago',  read: true,  urgent: false },
  { id: 10, type: 'Applications',  title: '3 New Applications This Week',         body: 'Three new student applications were received this week: Grace Uwimana, Kevin Hakizimana, and Thierry Uwera. Review pending.',                                  time: '4 days ago',  read: true,  urgent: false },
  { id: 11, type: 'System',        title: 'System Update: Result Approval Flow',  body: 'Result approval workflow has been updated. You can now add reviewer comments before publishing. View the updated guide in Settings > Help.',                  time: '5 days ago',  read: true,  urgent: false },
  { id: 12, type: 'Registration',  title: 'Semester 2 Registration Opened',       body: 'Course registration for Semester 2 (2024/2025) is now open. Registration window: 13 January – 28 January 2025.',                                              time: '10 days ago', read: true,  urgent: false },
]

// ── Badge helpers ─────────────────────────────────────────────────────────────

export function appStatusColors(status: AppStatus) {
  switch (status) {
    case 'Pending':     return { bg: 'var(--warning-bg)', color: 'var(--warning)'         }
    case 'Approved':    return { bg: 'var(--success-bg)', color: 'var(--success)'         }
    case 'Rejected':    return { bg: 'var(--error-bg)',   color: 'var(--error)'           }
    case 'Conditional': return { bg: 'var(--info-bg)',    color: 'var(--info)'            }
    case 'Accepted':    return { bg: 'var(--success-bg)', color: 'var(--success)'         }
    case 'Declined':    return { bg: 'var(--error-bg)',   color: 'var(--error)'           }
    case 'Withdrawn':   return { bg: 'var(--muted)',      color: 'var(--muted-foreground)' }
  }
}

export function studentStatusColors(status: StudentStatus) {
  switch (status) {
    case 'Active':    return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Suspended': return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'Graduated': return { bg: 'var(--info-bg)',    color: 'var(--info)'    }
    case 'Deferred':  return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  }
}

export function riskColors(level: RiskLevel) {
  switch (level) {
    case 'High':   return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'Medium': return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Low':    return { bg: 'var(--info-bg)',     color: 'var(--info)'   }
  }
}

export function calEventColors(type: CalEventType) {
  switch (type) {
    case 'Semester':      return { bg: 'var(--info-bg)',              color: 'var(--info)'            }
    case 'Registration':  return { bg: 'rgba(var(--brand-rgb),0.10)',        color: '#16A34A'                }
    case 'Exam':          return { bg: 'var(--error-bg)',             color: 'var(--error)'           }
    case 'Holiday':       return { bg: 'var(--muted)',                color: 'var(--muted-foreground)'}
    case 'Deadline':      return { bg: 'var(--warning-bg)',           color: 'var(--warning)'         }
    case 'Results':       return { bg: 'rgba(var(--brand-rgb),0.10)',        color: '#16A34A'                }
  }
}

export function gradeColors(grade: string) {
  if (grade.startsWith('A')) return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (grade.startsWith('B')) return { bg: 'var(--info-bg)',    color: 'var(--info)'    }
  if (grade.startsWith('C')) return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  return                             { bg: 'var(--error-bg)',   color: 'var(--error)'   }
}
