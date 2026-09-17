import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { PagedList } from '@/components/ListPagination'
import { Button } from '@/components/ui/button'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  lecturerAtRiskQueryKey,
  lecturerCoursesQueryKey,
  lecturerDashboardQueryKey,
  listLecturerAtRiskStudents,
  listLecturerCourses,
  resolveLecturerAtRisk,
} from '@/lib/api/lecturer'

export const Route = createFileRoute('/_auth/lecturer/at-risk')({
  component: AtRiskPage,
})

const RISK_STYLE: Record<string, { bg: string; color: string }> = {
  Critical: { bg: 'var(--error-bg)', color: 'var(--error)' },
  High: { bg: 'var(--error-bg)', color: 'var(--error)' },
  Medium: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  Low: { bg: 'var(--info-bg)', color: 'var(--info)' },
}

function AtRiskPage() {
  const queryClient = useQueryClient()
  const { data: courses = [] } = useQuery({ queryKey: lecturerCoursesQueryKey, queryFn: listLecturerCourses })
  const { data: students = [], isPending, error } = useQuery({
    queryKey: lecturerAtRiskQueryKey,
    queryFn: listLecturerAtRiskStudents,
  })
  const [courseFilter, setCourseFilter] = useState('all')
  const [riskTab, setRiskTab] = useState('all')

  const resolve = useMutation({
    mutationFn: (id: string) => resolveLecturerAtRisk(id, { notes: 'Followed up with the student.' }),
    onSuccess: async () => {
      toast.success('Student marked as followed up')
      await queryClient.invalidateQueries({ queryKey: lecturerAtRiskQueryKey })
      await queryClient.invalidateQueries({ queryKey: lecturerDashboardQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update that alert.')),
  })

  const active = students.filter((s) => {
    if (s.resolved) return false
    if (courseFilter !== 'all' && s.offeringId !== courseFilter) return false
    if (riskTab !== 'all' && s.riskLevel !== riskTab) return false
    return true
  })
  const resolved = students.filter((s) => s.resolved)

  return (
    <LecturerShell pageTitle="At-Risk Students" guide="Students in your courses who have been flagged. Follow-up is recorded against the live risk record.">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 860, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>At-Risk Students</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {active.length} active alert{active.length !== 1 ? 's' : ''} across your courses.
            </p>
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.offeringId} value={c.offeringId}>{c.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={riskTab} onValueChange={setRiskTab}>
          <TabsList className="mb-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="High">High</TabsTrigger>
            <TabsTrigger value="Medium">Medium</TabsTrigger>
            <TabsTrigger value="Low">Low</TabsTrigger>
          </TabsList>
        </Tabs>

        {isPending ? <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load at-risk students.')}</p> : null}

        <PagedList
          items={active}
          getKey={(s) => s.id}
          defaultPageSize={5}
          resetKey={`${courseFilter}:${riskTab}`}
          itemLabel="alerts"
          empty={!isPending && !error ? <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No open alerts for this filter.</p> : null}
          renderItem={(s) => {
            const style = RISK_STYLE[s.riskLevel] ?? RISK_STYLE.Medium
            return (
              <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '16px 18px' }}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 36, height: 36, backgroundColor: style.bg }}>
                    <AlertTriangle style={{ width: 16, height: 16, color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                      <span className="t-label px-2 py-0.5" style={{ backgroundColor: style.bg, color: style.color, borderRadius: 'var(--radius-sm)' }}>{s.riskLevel}</span>
                      {s.courseCode ? <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{s.courseCode}</span> : null}
                    </div>
                    <p className="t-caption mb-2" style={{ color: 'var(--muted-foreground)' }}>{s.studentNumber} · {s.programme}</p>
                    <ul className="t-body-sm" style={{ color: 'var(--foreground)' }}>
                      {s.riskFactors.map((f) => <li key={f.label}>• {f.label}</li>)}
                    </ul>
                    <div className="mt-3">
                      <ConfirmAlertDialog
                        trigger={<Button variant="outline" size="sm">Mark followed up</Button>}
                        title="Record a follow-up?"
                        tone="info"
                        headlineLabel="Action"
                        headline="Follow up"
                        summary="This records that you have followed up with the student on this alert."
                        notices={[{ icon: 'user', label: `${s.name} will move to the resolved list.` }]}
                        confirmLabel="Confirm"
                        confirmVariant="brand"
                        onConfirm={() => resolve.mutate(s.id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          }}
        />

        {resolved.length > 0 && (
          <div className="mt-8">
            <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Resolved</h2>
            {resolved.map((s) => (
              <p key={s.id} className="t-body-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>{s.name} · {s.resolution ?? 'Followed up'}</p>
            ))}
          </div>
        )}
      </div>
    </LecturerShell>
  )
}
