import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, LECTURERS } from '@/data/academic'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/faculty')({
  component: FacultyManagementPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const DEPARTMENTS  = ['All Departments', 'Computer Science', 'Mathematics', 'Languages', 'Business']
const DEPT_OPTIONS = ['Computer Science', 'Mathematics', 'Languages', 'Business']

const PLATFORM_LECTURERS = [
  'Dr. Amina Uwase',
  'Dr. Emmanuel Nkurunziza',
  'Prof. Aline Uwimana',
  'Dr. Patrick Habimana',
  'Ms. Grace Mukamana',
  'Prof. Sarah Ingabire',
  'Dr. James Uwera',
  'Dr. Peter Nzeyimana',
]

const FACULTY_OPTIONS = [
  'School of Computing',
  'School of Sciences',
  'School of Business',
  'School of Languages',
]

// ─────────────────────────────────────────────────────────────────────────────

function FacultyManagementPage() {
  const [search, setSearch]               = useState('')
  const [dept, setDept]                   = useState('All Departments')
  const [profileOpen, setProfileOpen]     = useState(false)
  const [addFacultyOpen, setAddFacultyOpen] = useState(false)
  const [selectedLec, setSelectedLec]     = useState(LECTURERS[0])

  // Add to faculty form state
  const [addFacultyForm, setAddFacultyForm] = useState({
    lecturer: '', department: 'Computer Science', faculty: '',
  })

  const filtered = LECTURERS.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase())
    const matchDept   = dept === 'All Departments' || l.department === dept
    return matchSearch && matchDept
  })

  const statusColors = (s: string) => {
    if (s === 'Active')   return { bg: 'var(--success-bg)', color: 'var(--success)'         }
    if (s === 'On Leave') return { bg: 'var(--warning-bg)', color: 'var(--warning)'         }
    return                       { bg: 'var(--muted)',       color: 'var(--muted-foreground)' }
  }

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Faculty"
      userName={ACADEMIC_ADMIN.fullName}
      userRole={ACADEMIC_ADMIN.role}
      userInitials={ACADEMIC_ADMIN.initials}
      unreadCount={4}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Faculty Management</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{LECTURERS.length} lecturers</p>
          </div>
          <button
            onClick={() => setAddFacultyOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <UserPlus style={{ width: 15, height: 15 }} />Add to faculty
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 rounded-lg px-3 h-9 flex-1 max-w-xs" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input type="text" placeholder="Search lecturer or ID…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
          </div>
          <select value={dept} onChange={(e) => setDept(e.target.value)}
            className="text-sm rounded-lg px-3 h-9 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-8">
              <p className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No lecturers found</p>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                New lecturers must first be added to the platform by the ICT Manager before they appear here.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Lecturer ID', 'Name', 'Department', 'Assigned Courses', 'Total Students', 'Status', ''].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lec, i) => {
                  const sc = statusColors(lec.status)
                  const totalStudents = lec.assignedCourses.reduce((a, c) => a + c.enrolled, 0)
                  return (
                    <tr key={lec.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}><span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{lec.id}</span></td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{lec.name}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{lec.department}</td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px' }}>{lec.assignedCourses.length}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px' }}>{totalStudents}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{lec.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => { setSelectedLec(lec); setProfileOpen(true) }} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                          style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          View profile
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Profile Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{selectedLec.name}</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
              {[
                { label: 'Lecturer ID', value: selectedLec.id         },
                { label: 'Department',  value: selectedLec.department  },
                { label: 'Email',       value: selectedLec.email       },
                { label: 'Phone',       value: selectedLec.phone       },
              ].map((row) => (
                <div key={row.label}>
                  <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</p>
                </div>
              ))}
            </div>

            <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Assigned Courses</h3>
            <div className="flex flex-col mb-6" style={{ gap: 0 }}>
              {selectedLec.assignedCourses.map((c, i) => (
                <div key={c.code} className="flex items-center gap-4 py-3" style={{ borderBottom: i < selectedLec.assignedCourses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span className="t-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 60 }}>{c.code}</span>
                  <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{c.name}</span>
                  <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{c.enrolled} students</span>
                  <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{c.semester}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
              <div className="text-center">
                <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Total Courses</p>
                <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{selectedLec.assignedCourses.length}</p>
              </div>
              <div className="text-center">
                <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Total Students</p>
                <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{selectedLec.assignedCourses.reduce((a, c) => a + c.enrolled, 0)}</p>
              </div>
              <div className="text-center">
                <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Credit Hours</p>
                <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{selectedLec.assignedCourses.length * 3}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add to Faculty Sheet */}
      <Sheet open={addFacultyOpen} onOpenChange={setAddFacultyOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Add Lecturer to Faculty</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">

            {/* Info alert — ICT Manager prerequisite */}
            <div className="flex items-start gap-3 p-4 rounded-xl mb-6" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid rgba(37,99,235,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--info)' }} />
              <p className="text-sm" style={{ color: 'var(--info)' }}>
                New lecturers must first be added to the platform by the ICT Manager before they can be assigned here.
              </p>
            </div>

            <div className="flex flex-col gap-4">

              {/* Select Lecturer dropdown */}
              <div>
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Select Lecturer</label>
                <select
                  value={addFacultyForm.lecturer}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, lecturer: e.target.value })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  <option value="">Select a lecturer…</option>
                  {PLATFORM_LECTURERS.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              {/* Department selector */}
              <div>
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Department</label>
                <select
                  value={addFacultyForm.department}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, department: e.target.value })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  {DEPT_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              {/* ICT Manager note — department creation */}
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid rgba(37,99,235,0.2)' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--info)' }} />
                <p className="text-xs" style={{ color: 'var(--info)' }}>
                  Don't see the department? New departments are added by the ICT Manager under System Settings and will automatically appear here once added.
                </p>
              </div>

              {/* Select Faculty dropdown */}
              <div>
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Select Faculty</label>
                <select
                  value={addFacultyForm.faculty}
                  onChange={(e) => setAddFacultyForm({ ...addFacultyForm, faculty: e.target.value })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  <option value="">Select a faculty…</option>
                  {FACULTY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setAddFacultyOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => { toast.success('Lecturer added to faculty.'); setAddFacultyOpen(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >Add to faculty</button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}
