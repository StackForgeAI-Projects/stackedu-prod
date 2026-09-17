import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import {
  academicCoursesQueryKey,
  academicProgrammeQueryKey,
  getAcademicProgramme,
  listAcademicCourses,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/academic/programme')({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) || '' }),
  component: ProgrammeDetailPage,
})

function courseCodeColor(code: string) {
  const prefix = code.split(' ')[0]
  switch (prefix) {
    case 'CSC': return { bg: 'var(--info-bg)', color: 'var(--info)' }
    case 'MTH': return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'ENG': return { bg: 'rgba(var(--brand-rgb),0.10)', color: '#16A34A' }
    case 'BUS': return { bg: 'var(--error-bg)', color: 'var(--error)' }
    case 'ITN': return { bg: 'rgba(124,58,237,0.10)', color: '#7C3AED' }
    default: return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
  }
}

function ProgrammeDetailPage() {
  const { id } = Route.useSearch()
  const [openYears, setOpenYears] = useState<number[]>([1])

  const programmeQuery = useQuery({
    queryKey: academicProgrammeQueryKey(id),
    queryFn: () => getAcademicProgramme(id),
    enabled: Boolean(id),
  })

  const coursesQuery = useQuery({
    queryKey: academicCoursesQueryKey,
    queryFn: listAcademicCourses,
  })

  const prog = programmeQuery.data
  const catalogueCourses = coursesQuery.data ?? []

  const getLecturer = (code: string) =>
    catalogueCourses.find((c) => c.code === code)?.lecturerName ?? 'Unassigned'

  const toggleYear = (y: number) =>
    setOpenYears((prev) => (prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]))

  if (!id) {
    return (
      <AcademicShell pageTitle="Programme">
        <div className="page-body"><p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Missing programme id.</p></div>
      </AcademicShell>
    )
  }

  if (programmeQuery.isPending || !prog) {
    return (
      <AcademicShell pageTitle="Programme">
        <div className="page-body">
          <p className="t-body" style={{ color: programmeQuery.error ? 'var(--error)' : 'var(--muted-foreground)' }}>
            {programmeQuery.error ? apiErrorMessage(programmeQuery.error, 'Programme could not be loaded.') : 'Loading programme…'}
          </p>
        </div>
      </AcademicShell>
    )
  }

  const statusColors = prog.status === 'Active'
    ? { bg: 'var(--success-bg)', color: 'var(--success)' }
    : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  return (
    <AcademicShell pageTitle="Programme">
      <div className="page-body animate-fade-up">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/academic/programmes" className="flex items-center gap-1 text-sm" style={{ color: 'var(--success)', textDecoration: 'none' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />Programmes
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{prog.name}</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{prog.name}</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{prog.department}</p>
          </div>
          <Link to="/academic/programmes">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            >
              Edit programme
            </button>
          </Link>
        </div>

        <div className="mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
          <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Programme Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <div><p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Department</p><p className="text-sm font-medium">{prog.department}</p></div>
            <div><p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Duration</p><p className="text-sm font-medium">{prog.duration}</p></div>
            <div><p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Total Credits</p><p className="text-sm font-medium">{prog.totalCredits} credit units</p></div>
            <div>
              <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Enrolled</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-medium">{prog.enrolled} students</p>
                <span className="t-label px-2 py-0.5" style={{ backgroundColor: statusColors.bg, color: statusColors.color, borderRadius: 'var(--radius-sm)' }}>{prog.status}</span>
              </div>
            </div>
          </div>
          {prog.description ? (
            <p className="t-body mt-4" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: 16 }}>{prog.description}</p>
          ) : null}
        </div>

        <h2 className="t-h2 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Courses by Year</h2>
        {prog.years.length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No curriculum structure defined yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {prog.years.map((yr) => {
              const isOpen = openYears.includes(yr.year)
              const totalCr = yr.semesters.reduce((acc, sem) => acc + sem.courses.reduce((a, c) => a + c.credits, 0), 0)
              return (
                <div key={yr.year} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <button type="button" onClick={() => toggleYear(yr.year)} className="w-full flex items-center justify-between px-6 py-4" style={{ backgroundColor: isOpen ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                    <div className="flex items-center gap-3">
                      <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Year {yr.year}</h3>
                      <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{totalCr} credits</span>
                    </div>
                    {isOpen ? <ChevronDown style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} /> : <ChevronRight style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />}
                  </button>
                  {isOpen && yr.semesters.map((sem, si) => {
                    const semCr = sem.courses.reduce((a, c) => a + c.credits, 0)
                    return (
                      <div key={si} style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: 'rgba(241,245,249,0.6)', borderBottom: '1px solid var(--border)' }}>
                          <p className="text-sm font-semibold">{sem.name} · {semCr} credits</p>
                        </div>
                        <div style={{ padding: '0 16px 16px' }}>
                          <DataTable
                            rows={sem.courses}
                            rowKey={(c) => c.code}
                            hideSearch
                            empty="No courses assigned yet"
                            defaultPageSize={25}
                            columns={[
                              {
                                id: 'code', header: 'Course Code', value: (c) => c.code,
                                cell: (c) => {
                                  const cc = courseCodeColor(c.code)
                                  return <span style={{ backgroundColor: cc.bg, color: cc.color, borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 6px' }}>{c.code}</span>
                                },
                              },
                              { id: 'name', header: 'Course Name', value: (c) => c.name, cell: (c) => <span className="text-sm font-medium">{c.name}</span> },
                              {
                                id: 'type', header: 'Type', value: (c) => c.type,
                                cell: (c) => {
                                  const typeColors = c.type === 'Compulsory'
                                    ? { bg: 'var(--info-bg)', color: 'var(--info)' }
                                    : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                                  return <span className="t-label px-2 py-0.5" style={{ backgroundColor: typeColors.bg, color: typeColors.color, borderRadius: 'var(--radius-sm)' }}>{c.type}</span>
                                },
                              },
                              { id: 'credits', header: 'Credit Units', value: (c) => c.credits, cell: (c) => <span className="text-sm">{c.credits} cr</span> },
                              { id: 'lecturer', header: 'Assigned Lecturer', value: (c) => getLecturer(c.code), cell: (c) => <span className="text-sm">{getLecturer(c.code)}</span> },
                              { id: 'status', header: 'Status', value: () => 'Active', cell: () => <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Active</span> },
                            ]}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AcademicShell>
  )
}
