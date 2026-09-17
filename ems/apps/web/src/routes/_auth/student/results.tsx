import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/DataTable'
import { StudentShell } from '@/components/StudentShell'
import { StatTile } from '@/components/StatTile'
import { TrendingUp } from 'lucide-react'
import { getStudentResults, studentResultsQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/results')({
  component: AcademicResultsPage,
})

function AcademicResultsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: studentResultsQueryKey,
    queryFn: getStudentResults,
  })
  const [semesterId, setSemesterId] = useState<string>('')
  const selected = data?.semesters.find((row) => row.semesterId === semesterId) ?? data?.semesters[0]

  return (
    <StudentShell pageTitle="Results" guide="Published results only. Lecturers enter marks; Academic Admin publishes them before they appear here.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Results</h1>
          <Link to="/student/transcript" className="text-sm font-medium" style={{ color: 'var(--success)' }}>Transcript →</Link>
        </div>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading results…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load results.')}</p>
        ) : !data?.semesters.length ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published results yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <StatTile icon={TrendingUp} iconColor="var(--brand)" iconBg="rgba(var(--brand-rgb),0.08)" label="CGPA" value={data.cgpa?.toFixed(2) ?? '—'} />
              <StatTile icon={TrendingUp} iconColor="var(--info)" iconBg="var(--info-bg)" label="STANDING" value={data.standing ?? '—'} />
            </div>
            <select
              className="mb-4 text-sm px-3 py-2 rounded-lg"
              style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
              value={selected?.semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
            >
              {data.semesters.map((row) => (
                <option key={row.semesterId} value={row.semesterId}>{row.label}</option>
              ))}
            </select>
            <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Semester GPA {selected?.gpa?.toFixed(2) ?? '—'}
            </p>
            <DataTable
              rows={selected?.courses ?? []}
              rowKey={(course) => course.offeringId}
              searchPlaceholder="Search courses…"
              filters={[{ id: 'type', label: 'types', getValue: (course) => course.type }]}
              empty="No published courses in this semester."
              columns={[
                { id: 'code', header: 'Code', value: (course) => course.courseCode, sortable: true, cell: (course) => <span className="t-mono">{course.courseCode}</span> },
                { id: 'name', header: 'Course', value: (course) => course.courseName, sortable: true, cell: (course) => course.courseName },
                { id: 'grade', header: 'Grade', value: (course) => course.grade ?? '—', cell: (course) => <span className="t-label">{course.grade ?? '—'}</span> },
                { id: 'credits', header: 'Credits', value: (course) => course.credits, sortable: true, sortValue: (course) => course.credits, cell: (course) => `${course.credits} cr` },
              ]}
            />
          </>
        )}
      </div>
    </StudentShell>
  )
}
