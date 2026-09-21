// ─────────────────────────────────────────────────────────────────────────────
// StackEDU — ICT Manager mock data
// ─────────────────────────────────────────────────────────────────────────────

import {
  LayoutDashboard, Users, ShieldCheck, UserX, ScrollText,
  Settings, Plug, BarChart2, Bell, Megaphone,
} from 'lucide-react'

// ── Identity ──────────────────────────────────────────────────────────────────

export const ICT_MANAGER = {
  fullName:    'Patrick Habimana',
  firstName:   'Patrick',
  shortName:   'Patrick',
  id:          'ADM-2024-0007',
  initials:    'PH',
  role:        'ICT Manager',
  institution: 'StackForgeAI University',
  office:      'Technology Office',
  email:       'patrick.habimana@sfu.ac.rw',
  phone:       '+250 788 678 901',
  joinedDate:  '20 Mar 2020',
}

// ── Navigation ────────────────────────────────────────────────────────────────

export const ICT_NAV = [
  { label: 'Dashboard',         to: '/ict/dashboard',      icon: LayoutDashboard },
  { label: 'User Management',   to: '/ict/users',          icon: Users           },
  { label: 'Access Levels',     to: '/ict/access-levels',  icon: ShieldCheck     },
  { label: 'Access Revocation', to: '/ict/revocation',     icon: UserX           },
  { label: 'Audit Log',         to: '/ict/audit-log',      icon: ScrollText      },
  { label: 'System Settings',   to: '/ict/settings',       icon: Settings        },
  { label: 'Integrations',      to: '/ict/integrations',   icon: Plug            },
  { label: 'Analytics',         to: '/ict/analytics',      icon: BarChart2       },
  { label: 'Notifications',     to: '/ict/notifications',  icon: Bell            },
  { label: 'Announcements',     to: '/ict/announcements',  icon: Megaphone       },
]

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole   = 'Student' | 'Lecturer' | 'Bursar' | 'Academic Admin' | 'Librarian' | 'ICT Manager'
export type UserStatus = 'Active' | 'Suspended' | 'Inactive'

export interface LoginEvent {
  timestamp:  string
  ipAddress:  string
  deviceType: string
  status:     'Success' | 'Failed'
}

export interface PlatformUser {
  id:           string
  userId:       string
  fullName:     string
  initials:     string
  email:        string
  phone:        string
  role:         UserRole
  status:       UserStatus
  lastLogin:    string
  createdDate:  string
  department?:  string
  programme?:   string
  yearOfStudy?: string
  faculty?:     string
  loginHistory: LoginEvent[]
}

// ── Platform Users (20) ───────────────────────────────────────────────────────

export const PLATFORM_USERS: PlatformUser[] = [
  {
    id: 'user-001', userId: 'SFE-2025-0001', fullName: 'Alice Uwimana',          initials: 'AU',
    email: 'alice.uwimana@sfu.ac.rw',        phone: '+250 788 100 001',
    role: 'Student', status: 'Active',        lastLogin: '2026-06-04 14:22',
    createdDate: '2025-09-01',               programme: 'Computer Science',      yearOfStudy: 'Year 2',
    loginHistory: [
      { timestamp: '2026-06-04 14:22', ipAddress: '197.243.12.55', deviceType: 'Mobile',  status: 'Success' },
      { timestamp: '2026-06-03 09:15', ipAddress: '197.243.12.55', deviceType: 'Mobile',  status: 'Success' },
      { timestamp: '2026-06-02 18:42', ipAddress: '105.177.32.18', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-01 11:08', ipAddress: '197.243.12.55', deviceType: 'Mobile',  status: 'Failed'  },
      { timestamp: '2026-06-01 11:10', ipAddress: '197.243.12.55', deviceType: 'Mobile',  status: 'Success' },
    ],
  },
  {
    id: 'user-002', userId: 'SFE-2025-0002', fullName: 'Jean-Paul Mugisha',      initials: 'JM',
    email: 'jeanpaul.mugisha@sfu.ac.rw',     phone: '+250 789 100 002',
    role: 'Student', status: 'Active',        lastLogin: '2026-06-04 10:05',
    createdDate: '2025-09-01',               programme: 'Business Administration', yearOfStudy: 'Year 3',
    loginHistory: [
      { timestamp: '2026-06-04 10:05', ipAddress: '105.177.48.22', deviceType: 'Mobile',  status: 'Success' },
      { timestamp: '2026-06-03 12:30', ipAddress: '105.177.48.22', deviceType: 'Mobile',  status: 'Success' },
      { timestamp: '2026-06-02 08:14', ipAddress: '197.243.10.08', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-003', userId: 'SFE-2025-0003', fullName: 'Diane Ingabire',         initials: 'DI',
    email: 'diane.ingabire@sfu.ac.rw',       phone: '+250 788 100 003',
    role: 'Student', status: 'Suspended',     lastLogin: '2026-05-20 16:44',
    createdDate: '2025-09-01',               programme: 'Computer Science',      yearOfStudy: 'Year 1',
    loginHistory: [
      { timestamp: '2026-05-20 16:44', ipAddress: '197.243.22.11', deviceType: 'Mobile',  status: 'Success' },
      { timestamp: '2026-05-18 09:00', ipAddress: '197.243.22.11', deviceType: 'Mobile',  status: 'Failed'  },
    ],
  },
  {
    id: 'user-004', userId: 'SFE-2025-0004', fullName: 'Emmanuel Hakizimana',   initials: 'EH',
    email: 'emmanuel.h@sfu.ac.rw',           phone: '+250 789 100 004',
    role: 'Student', status: 'Active',        lastLogin: '2026-06-04 08:55',
    createdDate: '2025-09-01',               programme: 'Engineering',           yearOfStudy: 'Year 2',
    loginHistory: [
      { timestamp: '2026-06-04 08:55', ipAddress: '105.177.55.09', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 07:30', ipAddress: '105.177.55.09', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-005', userId: 'SFE-2025-0005', fullName: 'Marie Cyusa',            initials: 'MC',
    email: 'marie.cyusa@sfu.ac.rw',          phone: '+250 788 100 005',
    role: 'Student', status: 'Active',        lastLogin: '2026-06-04 13:10',
    createdDate: '2025-09-01',               programme: 'Mathematics',           yearOfStudy: 'Year 1',
    loginHistory: [
      { timestamp: '2026-06-04 13:10', ipAddress: '197.243.18.44', deviceType: 'Mobile',  status: 'Success' },
      { timestamp: '2026-06-04 08:02', ipAddress: '197.243.18.44', deviceType: 'Mobile',  status: 'Success' },
    ],
  },
  {
    id: 'user-006', userId: 'SFE-2025-0006', fullName: 'Claude Niyonzima',       initials: 'CN',
    email: 'claude.niyonzima@sfu.ac.rw',     phone: '+250 789 100 006',
    role: 'Student', status: 'Active',        lastLogin: '2026-06-03 20:18',
    createdDate: '2025-09-01',               programme: 'Languages',             yearOfStudy: 'Year 3',
    loginHistory: [
      { timestamp: '2026-06-03 20:18', ipAddress: '105.177.22.77', deviceType: 'Mobile',  status: 'Success' },
    ],
  },
  {
    id: 'user-007', userId: 'SFE-2025-0007', fullName: 'Aline Mukamana',         initials: 'AM',
    email: 'aline.mukamana@sfu.ac.rw',       phone: '+250 788 100 007',
    role: 'Student', status: 'Inactive',      lastLogin: '2026-02-14 09:30',
    createdDate: '2025-09-01',               programme: 'Business Administration', yearOfStudy: 'Year 2',
    loginHistory: [
      { timestamp: '2026-02-14 09:30', ipAddress: '197.243.30.55', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-008', userId: 'SFE-2025-0008', fullName: 'Pacifique Gahigi',       initials: 'PG',
    email: 'pacifique.gahigi@sfu.ac.rw',     phone: '+250 789 100 008',
    role: 'Student', status: 'Active',        lastLogin: '2026-06-04 11:45',
    createdDate: '2025-09-01',               programme: 'Computer Science',      yearOfStudy: 'Year 4',
    loginHistory: [
      { timestamp: '2026-06-04 11:45', ipAddress: '105.177.60.33', deviceType: 'Mobile',  status: 'Success' },
      { timestamp: '2026-06-03 14:22', ipAddress: '105.177.60.33', deviceType: 'Mobile',  status: 'Success' },
    ],
  },
  {
    id: 'user-009', userId: 'LEC-2024-0001', fullName: 'Dr. Sarah Mutesi',       initials: 'SM',
    email: 'sarah.mutesi@sfu.ac.rw',         phone: '+250 788 200 001',
    role: 'Lecturer', status: 'Active',       lastLogin: '2026-06-04 12:15',
    createdDate: '2024-01-15',               department: 'Computer Science & IT', faculty: 'Science & Technology',
    loginHistory: [
      { timestamp: '2026-06-04 12:15', ipAddress: '197.243.14.88', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 08:00', ipAddress: '197.243.14.88', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-02 07:45', ipAddress: '197.243.14.88', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-010', userId: 'LEC-2024-0002', fullName: 'Prof. David Nsengiyumva', initials: 'DN',
    email: 'david.nsengiyumva@sfu.ac.rw',    phone: '+250 789 200 002',
    role: 'Lecturer', status: 'Active',       lastLogin: '2026-06-04 09:40',
    createdDate: '2023-08-01',               department: 'Mathematics & Sciences', faculty: 'Science & Technology',
    loginHistory: [
      { timestamp: '2026-06-04 09:40', ipAddress: '105.177.44.22', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 09:20', ipAddress: '105.177.44.22', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-011', userId: 'LEC-2024-0003', fullName: 'Christophe Bakundukize', initials: 'CB',
    email: 'christophe.b@sfu.ac.rw',         phone: '+250 788 200 003',
    role: 'Lecturer', status: 'Active',       lastLogin: '2026-06-04 15:32',
    createdDate: '2024-01-15',               department: 'Business & Management', faculty: 'Business & Commerce',
    loginHistory: [
      { timestamp: '2026-06-04 15:32', ipAddress: '197.243.20.10', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-012', userId: 'LEC-2024-0004', fullName: 'Fatima Umubyeyi',        initials: 'FU',
    email: 'fatima.umubyeyi@sfu.ac.rw',      phone: '+250 789 200 004',
    role: 'Lecturer', status: 'Suspended',    lastLogin: '2026-05-28 11:20',
    createdDate: '2024-01-15',               department: 'Languages & Communication', faculty: 'Arts & Humanities',
    loginHistory: [
      { timestamp: '2026-05-28 11:20', ipAddress: '197.243.11.66', deviceType: 'Mobile',  status: 'Success' },
    ],
  },
  {
    id: 'user-013', userId: 'ADM-2024-0001', fullName: 'Grace Uwamariya',        initials: 'GU',
    email: 'grace.uwamariya@sfu.ac.rw',      phone: '+250 788 300 001',
    role: 'Bursar', status: 'Active',         lastLogin: '2026-06-04 09:45',
    createdDate: '2023-08-01',
    loginHistory: [
      { timestamp: '2026-06-04 09:45', ipAddress: '197.243.16.42', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 08:30', ipAddress: '197.243.16.42', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-02 08:15', ipAddress: '197.243.16.42', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-014', userId: 'ADM-2024-0002', fullName: 'Robert Karekezi',        initials: 'RK',
    email: 'robert.karekezi@sfu.ac.rw',      phone: '+250 789 300 002',
    role: 'Bursar', status: 'Active',         lastLogin: '2026-06-03 16:10',
    createdDate: '2024-03-01',
    loginHistory: [
      { timestamp: '2026-06-03 16:10', ipAddress: '105.177.38.19', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-015', userId: 'ADM-2024-0003', fullName: 'Prof. Emmanuel Nkurunziza', initials: 'EN',
    email: 'emmanuel.nkurunziza@sfu.ac.rw',  phone: '+250 788 300 003',
    role: 'Academic Admin', status: 'Active', lastLogin: '2026-06-04 08:45',
    createdDate: '2023-08-01',
    loginHistory: [
      { timestamp: '2026-06-04 08:45', ipAddress: '197.243.14.05', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 07:55', ipAddress: '197.243.14.05', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-016', userId: 'ADM-2024-0004', fullName: 'Agnes Nyiransabimana',   initials: 'AN',
    email: 'agnes.nyiransabimana@sfu.ac.rw', phone: '+250 789 300 004',
    role: 'Academic Admin', status: 'Active', lastLogin: '2026-06-04 10:20',
    createdDate: '2024-01-15',
    loginHistory: [
      { timestamp: '2026-06-04 10:20', ipAddress: '105.177.27.88', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-017', userId: 'ADM-2024-0005', fullName: 'Martin Habimana',        initials: 'MH',
    email: 'martin.habimana@sfu.ac.rw',      phone: '+250 788 300 005',
    role: 'Librarian', status: 'Active',      lastLogin: '2026-06-04 11:15',
    createdDate: '2023-08-01',
    loginHistory: [
      { timestamp: '2026-06-04 11:15', ipAddress: '197.243.18.77', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 10:00', ipAddress: '197.243.18.77', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-018', userId: 'ADM-2024-0006', fullName: 'Solange Uwase',          initials: 'SU',
    email: 'solange.uwase@sfu.ac.rw',        phone: '+250 789 300 006',
    role: 'Librarian', status: 'Inactive',    lastLogin: '2026-01-22 14:05',
    createdDate: '2023-08-01',
    loginHistory: [
      { timestamp: '2026-01-22 14:05', ipAddress: '197.243.25.33', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-019', userId: 'ADM-2024-0007', fullName: 'Patrick Habimana',       initials: 'PH',
    email: 'patrick.habimana@sfu.ac.rw',     phone: '+250 788 400 001',
    role: 'ICT Manager', status: 'Active',    lastLogin: '2026-06-04 15:45',
    createdDate: '2023-06-01',
    loginHistory: [
      { timestamp: '2026-06-04 15:45', ipAddress: '197.243.14.01', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-04 08:02', ipAddress: '197.243.14.01', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 07:58', ipAddress: '197.243.14.01', deviceType: 'Desktop', status: 'Success' },
    ],
  },
  {
    id: 'user-020', userId: 'ADM-2024-0008', fullName: 'Ines Kamanzi',           initials: 'IK',
    email: 'ines.kamanzi@sfu.ac.rw',         phone: '+250 789 400 002',
    role: 'ICT Manager', status: 'Active',    lastLogin: '2026-06-04 13:55',
    createdDate: '2024-06-01',
    loginHistory: [
      { timestamp: '2026-06-04 13:55', ipAddress: '105.177.50.11', deviceType: 'Desktop', status: 'Success' },
      { timestamp: '2026-06-03 14:00', ipAddress: '105.177.50.11', deviceType: 'Desktop', status: 'Success' },
    ],
  },
]

// ── Role badge colours ────────────────────────────────────────────────────────

export function roleBadgeColors(role: UserRole) {
  switch (role) {
    case 'Student':       return { bg: 'var(--info-bg)',     color: 'var(--info)'            }
    case 'Lecturer':      return { bg: 'var(--success-bg)',  color: 'var(--success)'         }
    case 'Bursar':        return { bg: 'var(--warning-bg)',  color: 'var(--warning)'         }
    case 'Academic Admin':return { bg: 'rgba(32,244,78,0.12)', color: '#16A34A'              }
    case 'Librarian':     return { bg: '#EDE9FE',            color: '#7C3AED'                }
    case 'ICT Manager':   return { bg: 'var(--ink)',         color: 'var(--ink-foreground)'  }
  }
}

export function userStatusColors(status: UserStatus) {
  switch (status) {
    case 'Active':    return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Suspended': return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'Inactive':  return { bg: 'var(--muted)',      color: 'var(--muted-foreground)' }
  }
}

// ── Recent User Activity (dashboard) ─────────────────────────────────────────

export interface ActivityItem {
  id:     string
  name:   string
  role:   UserRole
  action: string
  time:   string
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'act-1', name: 'Dr. Sarah Mutesi',          role: 'Lecturer',       action: 'Uploaded lecture material for CS301',          time: '2 min ago'  },
  { id: 'act-2', name: 'Grace Uwamariya',           role: 'Bursar',         action: 'Generated Q1 Financial Report',                time: '15 min ago' },
  { id: 'act-3', name: 'Prof. Emmanuel Nkurunziza', role: 'Academic Admin', action: 'Approved 3 student applications',              time: '32 min ago' },
  { id: 'act-4', name: 'Alice Uwimana',             role: 'Student',        action: 'Submitted assignment for CS201',               time: '1 hr ago'   },
  { id: 'act-5', name: 'Martin Habimana',           role: 'Librarian',      action: 'Added 5 new e-library resources',              time: '2 hrs ago'  },
]

// ── System Services (dashboard + integrations) ────────────────────────────────

export type ServiceStatus = 'Operational' | 'Degraded' | 'Down'

export interface SystemService {
  name:       string
  status:     ServiceStatus
  lastCheck:  string
}

export const SYSTEM_SERVICES: SystemService[] = [
  { name: 'API Server',       status: 'Operational', lastCheck: '1 min ago' },
  { name: 'Database',         status: 'Operational', lastCheck: '1 min ago' },
  { name: 'Payment Gateway',  status: 'Operational', lastCheck: '2 min ago' },
  { name: 'SMS Service',      status: 'Operational', lastCheck: '3 min ago' },
  { name: 'Email Service',    status: 'Degraded',    lastCheck: '5 min ago' },
  { name: 'File Storage',     status: 'Operational', lastCheck: '2 min ago' },
]

export function serviceStatusColors(status: ServiceStatus) {
  switch (status) {
    case 'Operational': return { bg: 'var(--success-bg)', color: 'var(--success)', dot: 'var(--success)' }
    case 'Degraded':    return { bg: 'var(--warning-bg)', color: 'var(--warning)', dot: 'var(--warning)' }
    case 'Down':        return { bg: 'var(--error-bg)',   color: 'var(--error)',   dot: 'var(--error)'   }
  }
}

// ── Audit Log (30 entries) ────────────────────────────────────────────────────

export type AuditModule = 'Dashboard' | 'Applications' | 'Student Registry' | 'Course Management' |
  'Fee Management' | 'E-Library' | 'Results' | 'Reports' | 'Audit Log' |
  'System Settings' | 'User Management' | 'Announcements'

export type AuditStatus = 'Success' | 'Failed' | 'Warning'

export interface AuditEntry {
  id:        string
  timestamp: string
  userName:  string
  userId:    string
  role:      UserRole
  module:    AuditModule
  action:    string
  ipAddress: string
  status:    AuditStatus
  details?:  { before?: string; after?: string; notes?: string }
}

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'aud-001', timestamp: '2026-06-04 15:45:22', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'Dashboard',        action: 'User signed in',                                    ipAddress: '197.243.14.01', status: 'Success' },
  { id: 'aud-002', timestamp: '2026-06-04 15:32:07', userName: 'Christophe Bakundukize', userId: 'LEC-2024-0003', role: 'Lecturer',       module: 'Reports',          action: 'Downloaded course analytics report',                ipAddress: '197.243.20.10', status: 'Success' },
  { id: 'aud-003', timestamp: '2026-06-04 15:15:33', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Student Registry', action: 'Updated student profile — Jean-Paul Mugisha', ipAddress: '197.243.14.05', status: 'Success', details: { before: 'Year 2', after: 'Year 3', notes: 'Manual year progression' } },
  { id: 'aud-004', timestamp: '2026-06-04 15:02:18', userName: 'Grace Uwamariya',         userId: 'ADM-2024-0001', role: 'Bursar',         module: 'Fee Management',   action: 'Reconciliation attempt failed — transaction TXN-0042', ipAddress: '197.243.16.42', status: 'Failed', details: { notes: 'Gateway returned timeout error' } },
  { id: 'aud-005', timestamp: '2026-06-04 14:45:44', userName: 'Martin Habimana',          userId: 'ADM-2024-0005', role: 'Librarian',      module: 'E-Library',        action: 'Deleted resource: Outdated Financial Accounting 2019', ipAddress: '197.243.18.77', status: 'Success' },
  { id: 'aud-006', timestamp: '2026-06-04 14:32:22', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Results',          action: 'Published results batch — CS301 Semester 1',        ipAddress: '197.243.14.05', status: 'Success' },
  { id: 'aud-007', timestamp: '2026-06-04 14:15:07', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'Announcements',    action: 'Sent platform announcement: Semester 2 Registration Open', ipAddress: '197.243.14.01', status: 'Success' },
  { id: 'aud-008', timestamp: '2026-06-04 14:02:33', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'User Management',  action: 'Revoked access — Diane Ingabire (SFE-2025-0003)',    ipAddress: '197.243.14.01', status: 'Success', details: { notes: 'Disciplinary action — academic misconduct' } },
  { id: 'aud-009', timestamp: '2026-06-04 13:45:09', userName: 'Alice Uwimana',           userId: 'SFE-2025-0001', role: 'Student',        module: 'Student Registry', action: 'Registered for 5 courses — Semester 2',              ipAddress: '197.243.12.55', status: 'Success' },
  { id: 'aud-010', timestamp: '2026-06-04 13:32:18', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'System Settings',  action: 'Scheduled system maintenance window for 22:00',       ipAddress: '197.243.14.01', status: 'Warning', details: { notes: 'Maintenance will cause 15-min downtime' } },
  { id: 'aud-011', timestamp: '2026-06-04 13:15:33', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'User Management',  action: 'Changed role — Ines Kamanzi: Librarian → ICT Manager', ipAddress: '197.243.14.01', status: 'Success', details: { before: 'Librarian', after: 'ICT Manager' } },
  { id: 'aud-012', timestamp: '2026-06-04 13:02:44', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'System Settings',  action: 'Tested integration — Resend Email API',               ipAddress: '197.243.14.01', status: 'Warning', details: { notes: 'Test returned degraded response (2.4s latency)' } },
  { id: 'aud-013', timestamp: '2026-06-04 12:45:07', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Course Management', action: 'Assigned Dr. Sarah Mutesi to CS401',               ipAddress: '197.243.14.05', status: 'Success' },
  { id: 'aud-014', timestamp: '2026-06-04 12:32:19', userName: 'Grace Uwamariya',         userId: 'ADM-2024-0001', role: 'Bursar',         module: 'Fee Management',   action: 'Applied fee hold — Emmanuel Hakizimana (SFE-2025-0004)', ipAddress: '197.243.16.42', status: 'Warning', details: { notes: 'Outstanding balance > 60 days' } },
  { id: 'aud-015', timestamp: '2026-06-04 12:15:08', userName: 'Dr. Sarah Mutesi',        userId: 'LEC-2024-0001', role: 'Lecturer',       module: 'Dashboard',        action: 'User signed in',                                    ipAddress: '197.243.14.88', status: 'Success' },
  { id: 'aud-016', timestamp: '2026-06-04 12:02:33', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Applications',    action: 'Approved application — Hirwa Jean Bosco (APP-2026-0088)', ipAddress: '197.243.14.05', status: 'Success' },
  { id: 'aud-017', timestamp: '2026-06-04 11:45:12', userName: 'Grace Uwamariya',         userId: 'ADM-2024-0001', role: 'Bursar',         module: 'Reports',          action: 'Generated Semester 1 Financial Summary Report',       ipAddress: '197.243.16.42', status: 'Success' },
  { id: 'aud-018', timestamp: '2026-06-04 11:32:44', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'User Management',  action: 'Reset password — Pacifique Gahigi (SFE-2025-0008)',  ipAddress: '197.243.14.01', status: 'Success' },
  { id: 'aud-019', timestamp: '2026-06-04 11:15:28', userName: 'Martin Habimana',          userId: 'ADM-2024-0005', role: 'Librarian',      module: 'E-Library',        action: 'Added resource: Introduction to Algorithms (4th Ed)', ipAddress: '197.243.18.77', status: 'Success' },
  { id: 'aud-020', timestamp: '2026-06-04 11:02:17', userName: 'Dr. Sarah Mutesi',        userId: 'LEC-2024-0001', role: 'Lecturer',       module: 'Results',          action: 'Submitted marks for CS301 — 42 students',             ipAddress: '197.243.14.88', status: 'Success' },
  { id: 'aud-021', timestamp: '2026-06-04 10:45:33', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'User Management',  action: 'Suspended account — Fatima Umubyeyi (LEC-2024-0004)', ipAddress: '197.243.14.01', status: 'Success', details: { notes: 'Pending HR investigation' } },
  { id: 'aud-022', timestamp: '2026-06-04 10:32:09', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'System Settings',  action: 'Updated institution settings — academic year format', ipAddress: '197.243.14.01', status: 'Success', details: { before: '2024–2025', after: '2025/2026' } },
  { id: 'aud-023', timestamp: '2026-06-04 10:15:44', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Course Management', action: 'Created new course: CS402 — Advanced Machine Learning', ipAddress: '197.243.14.05', status: 'Success' },
  { id: 'aud-024', timestamp: '2026-06-04 10:02:18', userName: 'Unknown',                 userId: '—',             role: 'Student',        module: 'Dashboard',        action: 'Failed login attempt — alice.uwimana@sfu.ac.rw',     ipAddress: '87.110.44.22',  status: 'Failed',  details: { notes: 'Incorrect password — 3rd attempt' } },
  { id: 'aud-025', timestamp: '2026-06-04 09:45:22', userName: 'Grace Uwamariya',         userId: 'ADM-2024-0001', role: 'Bursar',         module: 'Fee Management',   action: 'Updated fee structure — Computer Science Year 2',     ipAddress: '197.243.16.42', status: 'Success', details: { before: 'RWF 450,000', after: 'RWF 480,000' } },
  { id: 'aud-026', timestamp: '2026-06-04 09:30:15', userName: 'Patrick Habimana',        userId: 'ADM-2024-0007', role: 'ICT Manager',   module: 'User Management',  action: 'Created account — Claude Niyonzima (SFE-2025-0006)', ipAddress: '197.243.14.01', status: 'Success' },
  { id: 'aud-027', timestamp: '2026-06-04 09:12:08', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Results',          action: 'Approved results batch — MATH201 Semester 1',       ipAddress: '197.243.14.05', status: 'Success' },
  { id: 'aud-028', timestamp: '2026-06-04 08:45:33', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Applications',    action: 'Reviewed application — Marie Uwase (APP-2026-0087)', ipAddress: '197.243.14.05', status: 'Success' },
  { id: 'aud-029', timestamp: '2026-06-04 08:22:11', userName: 'Grace Uwamariya',         userId: 'ADM-2024-0001', role: 'Bursar',         module: 'Dashboard',        action: 'User signed in',                                    ipAddress: '197.243.16.42', status: 'Success' },
  { id: 'aud-030', timestamp: '2026-06-04 08:15:22', userName: 'Prof. Emmanuel Nkurunziza', userId: 'ADM-2024-0003', role: 'Academic Admin', module: 'Dashboard',       action: 'User signed in',                                    ipAddress: '197.243.14.05', status: 'Success' },
]

export function auditModuleColors(module: AuditModule) {
  switch (module) {
    case 'Dashboard':        return { bg: 'var(--muted)',           color: 'var(--muted-foreground)' }
    case 'Applications':     return { bg: 'var(--info-bg)',         color: 'var(--info)'             }
    case 'Student Registry': return { bg: 'var(--info-bg)',         color: 'var(--info)'             }
    case 'Course Management':return { bg: 'var(--success-bg)',      color: 'var(--success)'          }
    case 'Fee Management':   return { bg: 'var(--warning-bg)',      color: 'var(--warning)'          }
    case 'E-Library':        return { bg: '#EDE9FE',                color: '#7C3AED'                 }
    case 'Results':          return { bg: 'var(--success-bg)',      color: 'var(--success)'          }
    case 'Reports':          return { bg: 'var(--muted)',           color: 'var(--muted-foreground)' }
    case 'Audit Log':        return { bg: 'var(--muted)',           color: 'var(--muted-foreground)' }
    case 'System Settings':  return { bg: 'var(--ink)',             color: 'var(--ink-foreground)'   }
    case 'User Management':  return { bg: 'var(--info-bg)',         color: 'var(--info)'             }
    case 'Announcements':    return { bg: 'var(--warning-bg)',      color: 'var(--warning)'          }
  }
}

export function auditStatusColors(status: AuditStatus) {
  switch (status) {
    case 'Success': return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Failed':  return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'Warning': return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  }
}

// ── Revocation Records (10) ───────────────────────────────────────────────────

export type RevocationStatus = 'Active Hold' | 'Revoked' | 'Reinstated'

export interface RevocationRecord {
  id:              string
  userName:        string
  userId:          string
  role:            UserRole
  revokedBy:       string
  revocationDate:  string
  reason:          string
  status:          RevocationStatus
  type:            'Temporary' | 'Permanent'
  endDate?:        string
  reinstatedDate?: string
  reinstatedBy?:   string
}

export const REVOCATIONS: RevocationRecord[] = [
  { id: 'rev-001', userName: 'Diane Ingabire',   userId: 'SFE-2025-0003', role: 'Student',       revokedBy: 'Patrick Habimana', revocationDate: '2026-06-04', reason: 'Disciplinary action — reported academic misconduct during Semester 1 examinations.',              status: 'Active Hold', type: 'Temporary', endDate: '2026-06-30'  },
  { id: 'rev-002', userName: 'Fatima Umubyeyi',  userId: 'LEC-2024-0004', role: 'Lecturer',      revokedBy: 'Patrick Habimana', revocationDate: '2026-06-04', reason: 'Account suspended pending HR investigation into student complaints.',                           status: 'Active Hold', type: 'Temporary', endDate: '2026-07-15'  },
  { id: 'rev-003', userName: 'Kwame Osei',       userId: 'SFE-2024-0099', role: 'Student',       revokedBy: 'Patrick Habimana', revocationDate: '2026-04-15', reason: 'Repeated unauthorised access attempts detected in system audit log.',                           status: 'Revoked',     type: 'Permanent'                           },
  { id: 'rev-004', userName: 'Celestin Rukundo', userId: 'ADM-2023-0018', role: 'Bursar',        revokedBy: 'Patrick Habimana', revocationDate: '2026-03-01', reason: 'Staff member resigned. Access removed per departure protocol.',                                   status: 'Revoked',     type: 'Permanent'                           },
  { id: 'rev-005', userName: 'Olive Nyirinkwaya',userId: 'SFE-2024-0045', role: 'Student',       revokedBy: 'Ines Kamanzi',     revocationDate: '2026-05-20', reason: 'Account flagged for sharing login credentials with external party.',                             status: 'Active Hold', type: 'Temporary', endDate: '2026-06-20'  },
  { id: 'rev-006', userName: 'Thierry Habiyaremye', userId: 'LEC-2023-0011', role: 'Lecturer',   revokedBy: 'Patrick Habimana', revocationDate: '2026-02-10', reason: 'Contract ended — lecturer on sabbatical leave.',                                                  status: 'Reinstated',  type: 'Temporary', endDate: '2026-05-10', reinstatedDate: '2026-05-11', reinstatedBy: 'Patrick Habimana' },
  { id: 'rev-007', userName: 'Annonciate Mukakamanzi', userId: 'SFE-2023-0122', role: 'Student', revokedBy: 'Ines Kamanzi',     revocationDate: '2026-01-25', reason: 'Fee hold — outstanding balance of RWF 960,000 for over 90 days.',                               status: 'Reinstated',  type: 'Temporary', endDate: '2026-03-31', reinstatedDate: '2026-04-02', reinstatedBy: 'Grace Uwamariya'  },
  { id: 'rev-008', userName: 'Evariste Nizeyimana', userId: 'SFE-2024-0077', role: 'Student',    revokedBy: 'Patrick Habimana', revocationDate: '2025-12-15', reason: 'Student transferred to University of Rwanda. Access closed per request.',                        status: 'Revoked',     type: 'Permanent'                           },
  { id: 'rev-009', userName: 'Bernadette Umuhoza', userId: 'ADM-2022-0003', role: 'Librarian',   revokedBy: 'Patrick Habimana', revocationDate: '2025-11-30', reason: 'Retirement — 30 years of service. Access closed per HR offboarding checklist.',                  status: 'Revoked',     type: 'Permanent'                           },
  { id: 'rev-010', userName: 'Pascal Nzeyimana', userId: 'SFE-2025-0088', role: 'Student',       revokedBy: 'Ines Kamanzi',     revocationDate: '2026-05-05', reason: 'Medical leave — student requested temporary suspension while receiving treatment.',               status: 'Active Hold', type: 'Temporary', endDate: '2026-08-31'  },
]

export function revocationStatusColors(status: RevocationStatus) {
  switch (status) {
    case 'Active Hold': return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'Revoked':     return { bg: 'var(--muted)',      color: 'var(--muted-foreground)' }
    case 'Reinstated':  return { bg: 'var(--success-bg)', color: 'var(--success)' }
  }
}

// ── Integrations ──────────────────────────────────────────────────────────────

export type IntegrationCategory = 'Payment' | 'SMS' | 'Email' | 'Storage'

export interface Integration {
  id:          string
  name:        string
  category:    IntegrationCategory
  status:      ServiceStatus
  lastTested:  string
  color:       string
  initials:    string
  description: string
}

export const INTEGRATIONS: Integration[] = [
  { id: 'int-001', name: 'MTN MoMo API',       category: 'Payment', status: 'Operational', lastTested: '2026-06-04 14:00', color: '#FFCC00', initials: 'MM', description: 'MTN Mobile Money payment collection for student fee payments.' },
  { id: 'int-002', name: 'Airtel Money API',   category: 'Payment', status: 'Operational', lastTested: '2026-06-04 14:00', color: '#EF0707', initials: 'AM', description: 'Airtel Money payment collection for student fee payments.'       },
  { id: 'int-003', name: 'DPO Pay',            category: 'Payment', status: 'Operational', lastTested: '2026-06-04 13:55', color: '#1A56DB', initials: 'DP', description: 'Card payment gateway — debit and credit card transactions.'       },
  { id: 'int-004', name: "Africa's Talking",   category: 'SMS',     status: 'Operational', lastTested: '2026-06-04 13:50', color: '#F97316', initials: 'AT', description: 'SMS gateway for transactional and notification SMS delivery.'     },
  { id: 'int-005', name: 'Resend Email',       category: 'Email',   status: 'Degraded',    lastTested: '2026-06-04 13:48', color: '#6366F1', initials: 'RE', description: 'Transactional email service for notifications and alerts.'        },
  { id: 'int-006', name: 'Cloudflare R2',      category: 'Storage', status: 'Operational', lastTested: '2026-06-04 14:02', color: '#F97316', initials: 'R2', description: 'Object storage for documents, assignments, and library files.'    },
]

// ── Notifications (ICT-specific) ──────────────────────────────────────────────

export type IctNotifType = 'Users' | 'System' | 'Security' | 'Integrations'

export interface IctNotif {
  id:      string
  type:    IctNotifType
  title:   string
  body:    string
  time:    string
  read:    boolean
  urgent?: boolean
}

export const ICT_NOTIFS: IctNotif[] = [
  {
    id: 'notif-001', type: 'Users', read: false, urgent: false,
    title: 'New account request — Hirwa Jean Bosco',
    body:  'A new account creation request has been submitted for Hirwa Jean Bosco (Student, Computer Science Year 1). Please review and create the account.',
    time:  '10 min ago',
  },
  {
    id: 'notif-002', type: 'Security', read: false, urgent: true,
    title: 'Multiple failed login attempts detected',
    body:  'IP address 87.110.44.22 attempted login 5 times in the last 10 minutes with incorrect credentials. Account alice.uwimana@sfu.ac.rw has been temporarily locked.',
    time:  '25 min ago',
  },
  {
    id: 'notif-003', type: 'Integrations', read: false, urgent: true,
    title: 'Integration degraded — Resend Email',
    body:  'The Resend Email integration is showing degraded performance. Average response time has increased to 2.4s (normal: <500ms). Email delivery may be delayed. Investigating.',
    time:  '1 hr ago',
  },
  {
    id: 'notif-004', type: 'System', read: true, urgent: false,
    title: 'Scheduled maintenance reminder',
    body:  'System maintenance is scheduled for tonight at 22:00 (server time). Expected downtime: 15 minutes. All users have been notified via SMS and email.',
    time:  '2 hrs ago',
  },
  {
    id: 'notif-005', type: 'System', read: true, urgent: false,
    title: 'Audit log anomaly flagged',
    body:  'The automated audit monitor flagged an unusual access pattern for user account SFE-2025-0003 (Diane Ingabire). 12 consecutive failed logins followed by a successful login from a new IP address. Review recommended.',
    time:  '3 hrs ago',
  },
  {
    id: 'notif-006', type: 'Users', read: true, urgent: false,
    title: 'Account access request — Thierry Habiyaremye',
    body:  'Lecturer Thierry Habiyaremye (LEC-2023-0011) has returned from sabbatical and their account has been reinstated by Patrick Habimana.',
    time:  '5 hrs ago',
  },
]

// ── Announcements (5) ─────────────────────────────────────────────────────────

export type AnnouncementStatus = 'Sent' | 'Scheduled' | 'Draft'

export interface Announcement {
  id:             string
  title:          string
  body:           string
  targetAudience: string[]
  channels:       ('Email' | 'SMS' | 'In-app')[]
  sentDate?:      string
  scheduledDate?: string
  status:         AnnouncementStatus
  priority:       'Normal' | 'Urgent'
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001', status: 'Sent', priority: 'Normal',
    title:          'Semester 2 Registration Now Open',
    body:           'Dear Students, course registration for Semester 2 (2025/2026) is now open. You may register for up to 21 credit units. Registration closes on 20 June 2026. Please log in to the StackEDU portal to register.',
    targetAudience: ['All Users'],
    channels:       ['In-app', 'Email', 'SMS'],
    sentDate:       '2026-06-01 08:00',
  },
  {
    id: 'ann-002', status: 'Sent', priority: 'Urgent',
    title:          'System Maintenance — Tonight 22:00',
    body:           'The StackEDU platform will undergo scheduled maintenance tonight from 22:00 to 22:15 (server time). Please save all work before this time. Services will resume automatically after maintenance.',
    targetAudience: ['All Users'],
    channels:       ['In-app', 'SMS'],
    sentDate:       '2026-06-04 14:15',
  },
  {
    id: 'ann-003', status: 'Sent', priority: 'Normal',
    title:          'Semester 1 Results Published',
    body:           'Semester 1 (2025/2026) results have been published. Log in to your StackEDU portal to view your grades and GPA. If you have any concerns, please contact the Registry Office.',
    targetAudience: ['Students'],
    channels:       ['In-app', 'Email', 'SMS'],
    sentDate:       '2026-05-15 09:00',
  },
  {
    id: 'ann-004', status: 'Sent', priority: 'Normal',
    title:          'New Library Resources Available',
    body:           'The StackEDU e-library has been updated with over 50 new titles including textbooks, research journals, and course packs. Log in and visit the E-Library section to explore.',
    targetAudience: ['Students', 'Lecturers'],
    channels:       ['In-app', 'Email'],
    sentDate:       '2026-05-28 10:30',
  },
  {
    id: 'ann-005', status: 'Scheduled', priority: 'Normal',
    title:          'End of Year Examination Schedule',
    body:           'The examination timetable for the 2025/2026 academic year will be published on 10 July 2026. Examinations are scheduled from 21 July to 8 August 2026. Prepare accordingly.',
    targetAudience: ['All Users'],
    channels:       ['In-app', 'Email', 'SMS'],
    scheduledDate:  '2026-07-08 08:00',
  },
]

export function announcementStatusColors(status: AnnouncementStatus) {
  switch (status) {
    case 'Sent':      return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Scheduled': return { bg: 'var(--info-bg)',    color: 'var(--info)'    }
    case 'Draft':     return { bg: 'var(--muted)',      color: 'var(--muted-foreground)' }
  }
}

// ── Analytics chart data ──────────────────────────────────────────────────────

export const ENROL_BY_PROGRAMME = [
  { name: 'Computer Science', enrolled: 312 },
  { name: 'Business Admin',   enrolled: 248 },
  { name: 'Engineering',      enrolled: 198 },
  { name: 'Mathematics',      enrolled: 156 },
  { name: 'Languages',        enrolled: 187 },
  { name: 'Sciences',         enrolled: 146 },
]

export const ENROL_TREND = [
  { month: 'Jul', enrolled: 1098 },
  { month: 'Aug', enrolled: 1125 },
  { month: 'Sep', enrolled: 1187 },
  { month: 'Oct', enrolled: 1203 },
  { month: 'Nov', enrolled: 1212 },
  { month: 'Dec', enrolled: 1198 },
  { month: 'Jan', enrolled: 1215 },
  { month: 'Feb', enrolled: 1224 },
  { month: 'Mar', enrolled: 1235 },
  { month: 'Apr', enrolled: 1240 },
  { month: 'May', enrolled: 1244 },
  { month: 'Jun', enrolled: 1247 },
]

export const MONTHLY_COLLECTIONS = [
  { month: 'Jul', amount: 48500000 },
  { month: 'Aug', amount: 52300000 },
  { month: 'Sep', amount: 61200000 },
  { month: 'Oct', amount: 58400000 },
  { month: 'Nov', amount: 55100000 },
  { month: 'Dec', amount: 43200000 },
  { month: 'Jan', amount: 62800000 },
  { month: 'Feb', amount: 59500000 },
  { month: 'Mar', amount: 66200000 },
  { month: 'Apr', amount: 63400000 },
  { month: 'May', amount: 70100000 },
  { month: 'Jun', amount: 68500000 },
]

export const AVG_GPA_BY_PROGRAMME = [
  { name: 'Mathematics',       gpa: 3.61 },
  { name: 'Sciences',          gpa: 3.48 },
  { name: 'Computer Science',  gpa: 3.42 },
  { name: 'Languages',         gpa: 3.35 },
  { name: 'Business Admin',    gpa: 3.28 },
  { name: 'Engineering',       gpa: 3.15 },
]

export const PASS_RATES_BY_DEPT = [
  { dept: 'Mathematics & Sciences',   rate: 87 },
  { dept: 'Languages & Communication',rate: 85 },
  { dept: 'Computer Science & IT',    rate: 82 },
  { dept: 'Business & Management',    rate: 79 },
  { dept: 'Engineering',              rate: 76 },
]

export const DAILY_ACTIVE_USERS = [
  { day: '6 May',  users: 318 }, { day: '7 May',  users: 290 }, { day: '8 May',  users: 142 },
  { day: '9 May',  users: 165 }, { day: '10 May', users: 344 }, { day: '11 May', users: 368 },
  { day: '12 May', users: 355 }, { day: '13 May', users: 372 }, { day: '14 May', users: 188 },
  { day: '15 May', users: 201 }, { day: '16 May', users: 381 }, { day: '17 May', users: 390 },
  { day: '18 May', users: 378 }, { day: '19 May', users: 362 }, { day: '20 May', users: 195 },
  { day: '21 May', users: 184 }, { day: '22 May', users: 358 }, { day: '23 May', users: 342 },
  { day: '24 May', users: 375 }, { day: '25 May', users: 388 }, { day: '26 May', users: 210 },
  { day: '27 May', users: 198 }, { day: '28 May', users: 365 }, { day: '29 May', users: 371 },
  { day: '30 May', users: 385 }, { day: '31 May', users: 352 }, { day: '1 Jun',  users: 220 },
  { day: '2 Jun',  users: 208 }, { day: '3 Jun',  users: 378 }, { day: '4 Jun',  users: 392 },
]

// 7 days × 24 hours — deterministic activity values
const _hourWeights = [2,1,1,1,1,2,4,8,12,14,16,16,15,14,15,16,15,12,10,8,6,5,4,3]
const _dayWeights  = [1.0, 1.0, 0.95, 1.0, 0.9, 0.45, 0.3] // Mon–Sun
export const ACTIVITY_HEATMAP: number[][] = Array.from({ length: 7 }, (_, d) =>
  _hourWeights.map((h) => Math.round(h * _dayWeights[d] * 2.5))
)
export const HEATMAP_DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const HEATMAP_HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`)

// ── Top library resources ─────────────────────────────────────────────────────

export const TOP_LIBRARY_RESOURCES = [
  { title: 'Introduction to Algorithms (4th Ed)', accesses: 412 },
  { title: 'Principles of Corporate Finance',      accesses: 387 },
  { title: 'The Pragmatic Programmer',             accesses: 344 },
  { title: 'Engineering Mathematics (Stroud)',     accesses: 312 },
  { title: 'Academic Writing for Rwandan Students', accesses: 298 },
]

export const FAILED_LOGINS_DAILY = [
  { day: '6 May',  count: 2 }, { day: '7 May',  count: 1 }, { day: '8 May',  count: 0 },
  { day: '9 May',  count: 3 }, { day: '10 May', count: 1 }, { day: '11 May', count: 2 },
  { day: '12 May', count: 0 }, { day: '13 May', count: 1 }, { day: '14 May', count: 4 },
  { day: '15 May', count: 2 }, { day: '16 May', count: 1 }, { day: '17 May', count: 0 },
  { day: '18 May', count: 3 }, { day: '19 May', count: 2 }, { day: '20 May', count: 1 },
  { day: '21 May', count: 0 }, { day: '22 May', count: 5 }, { day: '23 May', count: 2 },
  { day: '24 May', count: 1 }, { day: '25 May', count: 3 }, { day: '26 May', count: 0 },
  { day: '27 May', count: 2 }, { day: '28 May', count: 4 }, { day: '29 May', count: 1 },
  { day: '30 May', count: 2 }, { day: '31 May', count: 0 }, { day: '1 Jun',  count: 3 },
  { day: '2 Jun',  count: 1 }, { day: '3 Jun',  count: 2 }, { day: '4 Jun',  count: 5 },
]

export const TOP_ACTIVE_ADMINS: { name: string; role: UserRole; actions: number }[] = [
  { name: 'Prof. Emmanuel Nkurunziza', role: 'Academic Admin', actions: 148 },
  { name: 'Patrick Habimana',          role: 'ICT Manager',    actions: 112 },
  { name: 'Grace Uwamariya',           role: 'Bursar',         actions: 87  },
  { name: 'Agnes Nyiransabimana',      role: 'Academic Admin', actions: 64  },
  { name: 'Martin Habimana',           role: 'Librarian',      actions: 52  },
]

// ── Grading scale ─────────────────────────────────────────────────────────────

export const DEFAULT_GRADING_SCALE = [
  { grade: 'A',  minMark: 80, maxMark: 100, gpaPoints: 4.0 },
  { grade: 'B+', minMark: 70, maxMark: 79,  gpaPoints: 3.5 },
  { grade: 'B',  minMark: 60, maxMark: 69,  gpaPoints: 3.0 },
  { grade: 'C+', minMark: 55, maxMark: 59,  gpaPoints: 2.5 },
  { grade: 'C',  minMark: 50, maxMark: 54,  gpaPoints: 2.0 },
  { grade: 'D',  minMark: 40, maxMark: 49,  gpaPoints: 1.0 },
  { grade: 'F',  minMark: 0,  maxMark: 39,  gpaPoints: 0.0 },
]

// ── Notification templates ────────────────────────────────────────────────────

export const NOTIF_TEMPLATES = [
  { id: 'tpl-001', name: 'Admission Offer',         trigger: 'Application approved',         channels: { email: true, sms: true,  inapp: true  }, subject: 'Congratulations — Your Admission Offer',       body: 'Dear {studentName},\n\nWe are pleased to offer you admission to {programmeName} at {institutionName}...' },
  { id: 'tpl-002', name: 'Offer Accepted',          trigger: 'Student accepts offer',         channels: { email: true, sms: false, inapp: true  }, subject: 'Offer Accepted — Next Steps',                   body: 'Dear {studentName},\n\nThank you for accepting your offer...' },
  { id: 'tpl-003', name: 'Account Created',         trigger: 'New user account created',      channels: { email: true, sms: true,  inapp: false }, subject: 'Your StackEDU Account Has Been Created',        body: 'Dear {fullName},\n\nYour StackEDU account has been created...' },
  { id: 'tpl-004', name: 'Results Published',       trigger: 'Results batch published',       channels: { email: true, sms: true,  inapp: true  }, subject: 'Your Semester Results Are Now Available',       body: 'Dear {studentName},\n\nYour results for {semesterName} have been published...' },
  { id: 'tpl-005', name: 'Fee Reminder',            trigger: 'Fee payment deadline − 7 days', channels: { email: true, sms: true,  inapp: true  }, subject: 'Fee Payment Due in 7 Days',                     body: 'Dear {studentName},\n\nYour fee payment of {amount} is due on {dueDate}...' },
  { id: 'tpl-006', name: 'Registration Open',       trigger: 'Registration window opened',    channels: { email: false, sms: true,  inapp: true }, subject: 'Course Registration Is Now Open',               body: 'Dear {studentName},\n\nCourse registration for {semesterName} is now open...' },
  { id: 'tpl-007', name: 'Password Reset',          trigger: 'Password reset requested',      channels: { email: true, sms: true,  inapp: false }, subject: 'Your StackEDU Password Reset Request',          body: 'Dear {fullName},\n\nA password reset was requested for your account...' },
  { id: 'tpl-008', name: 'System Maintenance',      trigger: 'Maintenance scheduled',         channels: { email: false, sms: false, inapp: true }, subject: 'Scheduled System Maintenance Notice',           body: 'The StackEDU platform will be offline for maintenance on {maintenanceDate}...' },
]

// ── Departments ───────────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  { id: 'dept-001', name: 'Computer Science & IT',      faculty: 'Science & Technology', courses: 18, lecturers: 8,  status: 'Active' },
  { id: 'dept-002', name: 'Mathematics & Sciences',     faculty: 'Science & Technology', courses: 14, lecturers: 6,  status: 'Active' },
  { id: 'dept-003', name: 'Business & Management',      faculty: 'Business & Commerce',  courses: 16, lecturers: 7,  status: 'Active' },
  { id: 'dept-004', name: 'Languages & Communication',  faculty: 'Arts & Humanities',    courses: 10, lecturers: 5,  status: 'Active' },
  { id: 'dept-005', name: 'Engineering',                faculty: 'Science & Technology', courses: 12, lecturers: 6,  status: 'Active' },
]

// ── Permissions matrix ────────────────────────────────────────────────────────

export type PermissionKey = 'read' | 'write' | 'delete'

export const MODULES_LIST = [
  'Dashboard', 'Applications', 'Student Registry', 'Course Management',
  'Fee Management', 'E-Library', 'Results', 'Reports',
  'Audit Log', 'System Settings', 'User Management', 'Announcements',
] as const

export type ModuleName = typeof MODULES_LIST[number]

export type RolePermissions = Record<ModuleName, Record<PermissionKey, boolean>>

export const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'Student': {
    'Dashboard':        { read: true,  write: false, delete: false },
    'Applications':     { read: false, write: false, delete: false },
    'Student Registry': { read: true,  write: false, delete: false },
    'Course Management':{ read: true,  write: false, delete: false },
    'Fee Management':   { read: true,  write: false, delete: false },
    'E-Library':        { read: true,  write: false, delete: false },
    'Results':          { read: true,  write: false, delete: false },
    'Reports':          { read: false, write: false, delete: false },
    'Audit Log':        { read: false, write: false, delete: false },
    'System Settings':  { read: false, write: false, delete: false },
    'User Management':  { read: false, write: false, delete: false },
    'Announcements':    { read: true,  write: false, delete: false },
  },
  'Lecturer': {
    'Dashboard':        { read: true,  write: false, delete: false },
    'Applications':     { read: false, write: false, delete: false },
    'Student Registry': { read: true,  write: false, delete: false },
    'Course Management':{ read: true,  write: true,  delete: false },
    'Fee Management':   { read: false, write: false, delete: false },
    'E-Library':        { read: true,  write: false, delete: false },
    'Results':          { read: true,  write: true,  delete: false },
    'Reports':          { read: true,  write: false, delete: false },
    'Audit Log':        { read: false, write: false, delete: false },
    'System Settings':  { read: false, write: false, delete: false },
    'User Management':  { read: false, write: false, delete: false },
    'Announcements':    { read: true,  write: false, delete: false },
  },
  'Bursar': {
    'Dashboard':        { read: true,  write: false, delete: false },
    'Applications':     { read: false, write: false, delete: false },
    'Student Registry': { read: true,  write: false, delete: false },
    'Course Management':{ read: false, write: false, delete: false },
    'Fee Management':   { read: true,  write: true,  delete: true  },
    'E-Library':        { read: false, write: false, delete: false },
    'Results':          { read: false, write: false, delete: false },
    'Reports':          { read: true,  write: true,  delete: false },
    'Audit Log':        { read: false, write: false, delete: false },
    'System Settings':  { read: false, write: false, delete: false },
    'User Management':  { read: false, write: false, delete: false },
    'Announcements':    { read: true,  write: false, delete: false },
  },
  'Academic Admin': {
    'Dashboard':        { read: true,  write: false, delete: false },
    'Applications':     { read: true,  write: true,  delete: false },
    'Student Registry': { read: true,  write: true,  delete: false },
    'Course Management':{ read: true,  write: true,  delete: true  },
    'Fee Management':   { read: false, write: false, delete: false },
    'E-Library':        { read: false, write: false, delete: false },
    'Results':          { read: true,  write: true,  delete: false },
    'Reports':          { read: true,  write: true,  delete: false },
    'Audit Log':        { read: false, write: false, delete: false },
    'System Settings':  { read: false, write: false, delete: false },
    'User Management':  { read: false, write: false, delete: false },
    'Announcements':    { read: true,  write: true,  delete: false },
  },
  'Librarian': {
    'Dashboard':        { read: true,  write: false, delete: false },
    'Applications':     { read: false, write: false, delete: false },
    'Student Registry': { read: true,  write: false, delete: false },
    'Course Management':{ read: false, write: false, delete: false },
    'Fee Management':   { read: false, write: false, delete: false },
    'E-Library':        { read: true,  write: true,  delete: true  },
    'Results':          { read: false, write: false, delete: false },
    'Reports':          { read: true,  write: false, delete: false },
    'Audit Log':        { read: false, write: false, delete: false },
    'System Settings':  { read: false, write: false, delete: false },
    'User Management':  { read: false, write: false, delete: false },
    'Announcements':    { read: true,  write: false, delete: false },
  },
  'ICT Manager': {
    'Dashboard':        { read: true, write: true, delete: true },
    'Applications':     { read: true, write: true, delete: true },
    'Student Registry': { read: true, write: true, delete: true },
    'Course Management':{ read: true, write: true, delete: true },
    'Fee Management':   { read: true, write: true, delete: true },
    'E-Library':        { read: true, write: true, delete: true },
    'Results':          { read: true, write: true, delete: true },
    'Reports':          { read: true, write: true, delete: true },
    'Audit Log':        { read: true, write: true, delete: true },
    'System Settings':  { read: true, write: true, delete: true },
    'User Management':  { read: true, write: true, delete: true },
    'Announcements':    { read: true, write: true, delete: true },
  },
}
