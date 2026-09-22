import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { AcademicLecturerRow } from '@stackedu/shared'
import { UserPlus } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import {
  academicLecturersQueryKey,
  listAcademicLecturers,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/academic/faculty')({
  component: FacultyManagementPage,
})

const READ_ONLY_MSG = 'Faculty assignments are read-only from the API for now.'

function statusColors(s: string) {
  if (s === 'Active') return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (s === 'On Leave') return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function FacultyManagementPage() {
  const { data, isPending, error } = useQuery({
    queryKey: academicLecturersQueryKey,
    queryFn: listAcademicLecturers,
  })

  const lecturers = data ?? []
  const [profileOpen, setProfileOpen] = useState(false)
  const [addFacultyOpen, setAddFacultyOpen] = useState(false)
  const [selectedLec, setSelectedLec] = useState<AcademicLecturerRow | null>(null)

  const showReadOnly = () => toast.info(READ_ONLY_MSG)

  return (
    <AcademicShell pageTitle="Faculty">
      <div className="page-body animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Faculty Management</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {isPending ? 'Loading…' : lecturers.length === 1 ? '1 lecturer' : `${lecturers.length} lecturers`}
            </p>
          </div>
          <button type="button" onClick={() => { showReadOnly(); setAddFacultyOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'not-allowed', opacity: 0.6 }}
            title={READ_ONLY_MSG}>
            <UserPlus style={{ width: 15, height: 15 }} />Add to faculty
          </button>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load lecturers.')}</p>
        ) : null}

        <DataTable
          rows={lecturers}
          rowKey={(lec) => lec.id}
          searchPlaceholder="Search lecturer or email…"
          searchFilter={(lec, query) =>
            lec.name.toLowerCase().includes(query) || lec.email.toLowerCase().includes(query)
          }
          filters={[{ id: 'department', label: 'departments', getValue: (lec) => lec.department }]}
          empty={isPending ? 'Loading lecturers…' : 'No lecturers found. New lecturers must first be added to the platform by the ICT Manager before they appear here.'}
          columns={[
            { id: 'id', header: 'Lecturer ID', value: (lec) => lec.id, cell: (lec) => <span className="t-mono" style={{ fontSize: 11 }}>{lec.id.slice(0, 8)}…</span> },
            { id: 'name', header: 'Name', value: (lec) => lec.name, cell: (lec) => <span className="text-sm font-medium">{lec.name}</span> },
            { id: 'department', header: 'Department', value: (lec) => lec.department, cell: (lec) => <span className="text-sm">{lec.department}</span> },
            { id: 'courses', header: 'Assigned Courses', value: (lec) => lec.assignedCourses.length, cell: (lec) => <span className="text-sm font-medium">{lec.assignedCourses.length}</span> },
            { id: 'students', header: 'Total Students', value: (lec) => lec.assignedCourses.reduce((a, c) => a + c.enrolled, 0), cell: (lec) => <span className="text-sm">{lec.assignedCourses.reduce((a, c) => a + c.enrolled, 0)}</span> },
            {
              id: 'status', header: 'Status', value: (lec) => lec.status,
              cell: (lec) => {
                const sc = statusColors(lec.status)
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{lec.status}</span>
              },
            },
            {
              id: 'profile', header: '', className: 'text-right',
              cell: (lec) => (
                <button type="button" onClick={() => { setSelectedLec(lec); setProfileOpen(true) }} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                  View profile
                </button>
              ),
            },
          ]}
        />
      </div>

      {selectedLec ? (
        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
            <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>{selectedLec.name}</SheetTitle>
            </SheetHeader>
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                {[
                  { label: 'Department', value: selectedLec.department },
                  { label: 'Email', value: selectedLec.email },
                  { label: 'Phone', value: selectedLec.phone ?? '—' },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                    <p className="text-sm font-medium">{row.value}</p>
                  </div>
                ))}
              </div>
              <h3 className="t-h3 mb-4">Assigned Courses</h3>
              {selectedLec.assignedCourses.length === 0 ? (
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No courses assigned.</p>
              ) : (
                <div className="flex flex-col mb-6">
                  {selectedLec.assignedCourses.map((c, i) => (
                    <div key={c.code} className="flex items-center gap-4 py-3" style={{ borderBottom: i < selectedLec.assignedCourses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span className="t-mono flex-shrink-0" style={{ width: 60 }}>{c.code}</span>
                      <span className="text-sm flex-1">{c.name}</span>
                      <span className="t-caption">{c.enrolled} students</span>
                      <span className="t-caption">{c.semester}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      <Sheet open={addFacultyOpen} onOpenChange={setAddFacultyOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>Add Lecturer to Faculty</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">
            <p className="t-body-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>{READ_ONLY_MSG}</p>
            <button type="button" onClick={() => setAddFacultyOpen(false)} className="w-full py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid var(--border)', cursor: 'pointer' }}>Close</button>
          </div>
        </SheetContent>
      </Sheet>
    </AcademicShell>
  )
}
