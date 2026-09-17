import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { BarChart2, BookOpen, ClipboardList, AlertTriangle } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { StatTile } from '@/components/StatTile'
import { AnalyticsChartCard, analyticsTooltipStyle } from '@/components/AnalyticsChartCard'
import { PagedList } from '@/components/ListPagination'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerCourseAnalytics,
  lecturerCourseAnalyticsQueryKey,
  lecturerCoursesQueryKey,
  listLecturerCourses,
} from '@/lib/api/lecturer'
import { formatCurrency } from '@/lib/utils'

export const Route = createFileRoute('/_auth/lecturer/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data: courses = [], isPending, error } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const [offeringId, setOfferingId] = useState('')
  useEffect(() => {
    if (!offeringId && courses[0]) setOfferingId(courses[0].offeringId)
  }, [courses, offeringId])

  const { data: analytics, error: analyticsError } = useQuery({
    queryKey: lecturerCourseAnalyticsQueryKey(offeringId),
    queryFn: () => getLecturerCourseAnalytics(offeringId),
    enabled: Boolean(offeringId),
  })

  const paper = analytics?.assessments[0]
  const distribution = paper?.distribution ?? []

  return (
    <LecturerShell pageTitle="Analytics" guide="Engagement, attendance, fee balance and grade distribution for one assigned course, on the same view as at-risk scores.">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Analytics</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Attendance, materials opened, fees and grades in one place.
            </p>
          </div>
          {courses.length > 0 && (
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger className="w-full sm:w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.offeringId} value={c.offeringId}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {isPending ? <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load analytics.')}</p> : null}
        {analyticsError ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(analyticsError, 'Could not load this course.')}</p> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile icon={ClipboardList} iconColor="var(--brand)" iconBg="rgba(var(--brand-rgb),0.08)" label="ATTENDANCE" value={analytics?.averageAttendance != null ? `${analytics.averageAttendance}%` : '—'} delta="Class average" deltaColor="var(--muted-foreground)" animationDelay={0} />
          <StatTile icon={BookOpen} iconColor="var(--info)" iconBg="var(--info-bg)" label="ENGAGEMENT" value={analytics?.averageEngagement != null ? `${analytics.averageEngagement}%` : '—'} delta="Materials opened" deltaColor="var(--muted-foreground)" animationDelay={40} />
          <StatTile icon={BarChart2} iconColor="var(--success)" iconBg="var(--success-bg)" label="AVERAGE SCORE" value={analytics?.averageScore != null ? `${analytics.averageScore}` : '—'} delta={`${analytics?.enrolled ?? 0} enrolled`} deltaColor="var(--muted-foreground)" animationDelay={80} />
          <StatTile icon={AlertTriangle} iconColor="var(--error)" iconBg="var(--error-bg)" label="AT-RISK" value={String(analytics?.atRiskCount ?? 0)} delta="High or critical" deltaColor="var(--error)" animationDelay={120} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <AnalyticsChartCard
            title="Attendance and engagement"
            empty={!analytics?.students.length ? 'No enrolled students yet.' : null}
          >
            <BarChart data={(analytics?.students ?? []).map((student) => ({
              name: student.name.split(' ')[0] ?? student.name,
              attendance: student.attendanceRate ?? 0,
              engagement: student.engagementRate ?? 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip {...analyticsTooltipStyle} />
              <Legend />
              <Bar dataKey="attendance" name="Attendance %" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="engagement" name="Materials %" fill="var(--info)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </AnalyticsChartCard>
          <AnalyticsChartCard
            title={paper ? `Grade distribution · ${paper.title}` : 'Grade distribution'}
            empty={!paper || paper.gradedCount === 0 ? 'No graded work yet.' : null}
          >
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip {...analyticsTooltipStyle} />
              <Bar dataKey="count" name="Students" fill="var(--info)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </AnalyticsChartCard>
        </div>

        <section style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
          <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Students</h2>
          {!analytics?.students.length ? (
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No enrolled students yet.</p>
          ) : (
            <PagedList
              items={analytics.students}
              getKey={(row) => row.studentId}
              defaultPageSize={5}
              itemLabel="students"
              renderItem={(row) => (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.name}</p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{row.studentNumber}</p>
                  </div>
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                    Att {row.attendanceRate ?? '—'}% · Mat {row.materialsOpened}/{row.materialsTotal} · Score {row.averageScore ?? '—'} · {formatCurrency(row.feeBalance)}
                    {row.riskLevel ? ` · ${row.riskLevel}` : ''}
                  </p>
                </div>
              )}
            />
          )}
        </section>
      </div>
    </LecturerShell>
  )
}
