import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { AcademicResultBatch } from '@stackedu/shared'
import { Download, Search } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import { gradeColors } from '@/data/academic'
import {
  academicDashboardQueryKey,
  academicResultsQueryKey,
  academicSemestersQueryKey,
  approveAcademicResultBatch,
  listAcademicResultBatches,
  listAcademicSemesters,
  rejectAcademicResultBatch,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/notify'

export const Route = createFileRoute('/_auth/academic/results')({
  component: ResultManagementPage,
})

function ResultManagementPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'pending' | 'published'>('pending')
  const [semesterId, setSemesterId] = useState('')
  const [publishedSearch, setPublishedSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [viewResult, setViewResult] = useState<AcademicResultBatch | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [returnReason, setReturnReason] = useState('')

  const semestersQuery = useQuery({
    queryKey: academicSemestersQueryKey,
    queryFn: listAcademicSemesters,
  })

  const pendingQuery = useQuery({
    queryKey: academicResultsQueryKey(semesterId || undefined, 'Pending'),
    queryFn: () => listAcademicResultBatches({ semesterId: semesterId || undefined, status: 'Pending' }),
  })

  const publishedQuery = useQuery({
    queryKey: academicResultsQueryKey(semesterId || undefined, 'Published'),
    queryFn: () => listAcademicResultBatches({ semesterId: semesterId || undefined, status: 'Published' }),
  })

  const pending = pendingQuery.data ?? []
  const published = publishedQuery.data ?? []

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['academic', 'results'] })
    await queryClient.invalidateQueries({ queryKey: academicDashboardQueryKey })
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAcademicResultBatch(id),
    onSuccess: async (batch) => {
      notifySuccess(`Results for ${batch.courseCode} approved.`)
      setSheetOpen(false)
      await invalidate()
    },
    onError: (error) => notifyError(apiErrorMessage(error, 'Could not approve those results.')),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectAcademicResultBatch(id, { reason }),
    onSuccess: async (batch) => {
      notifySuccess(`Results for ${batch.courseCode} returned to lecturer.`)
      setReturnReason('')
      await invalidate()
    },
    onError: (error) => notifyError(apiErrorMessage(error, 'Could not return those results.')),
  })

  const filterResults = (results: AcademicResultBatch[], query: string) => {
    if (!query.trim()) return results
    const q = query.toLowerCase()
    return results.filter((r) =>
      r.courseName.toLowerCase().includes(q) ||
      r.courseCode.toLowerCase().includes(q) ||
      (r.lecturer ?? '').toLowerCase().includes(q),
    )
  }

  const filteredPublished = filterResults(published, publishedSearch)
  const semesters = semestersQuery.data ?? []
  const loading = semestersQuery.isPending || pendingQuery.isPending || publishedQuery.isPending

  return (
    <AcademicShell pageTitle="Results">
      <div className="page-body animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Result Management</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Approve and publish lecturer-submitted results</p>
          </div>
          <select
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            className="text-sm rounded-lg px-3 h-9 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            <option value="">All semesters</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {(pendingQuery.error || publishedQuery.error) ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>
            {apiErrorMessage(pendingQuery.error ?? publishedQuery.error, 'Could not load results.')}
          </p>
        ) : null}

        <div className="flex gap-1 mb-6">
          {[
            { key: 'pending' as const, label: 'Pending Approval', count: pending.length },
            { key: 'published' as const, label: 'Published', count: published.length },
          ].map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`filter-tab ${tab === t.key ? 'filter-tab--active' : ''}`}>
              {t.label}
              <span className="t-label filter-tab__badge">{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading results…</p>
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <div className="text-center py-16" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <p className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)' }}>All caught up!</p>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No results pending approval.</p>
            </div>
          ) : (
            <DataTable
              rows={pending}
              rowKey={(r) => r.id}
              searchPlaceholder="Search by course name, course code, or lecturer name…"
              searchFilter={(r, query) =>
                r.courseName.toLowerCase().includes(query) ||
                r.courseCode.toLowerCase().includes(query) ||
                (r.lecturer ?? '').toLowerCase().includes(query)
              }
              empty="No results match your search."
              columns={[
                { id: 'code', header: 'Course Code', value: (r) => r.courseCode, cell: (r) => <span className="t-mono">{r.courseCode}</span> },
                { id: 'name', header: 'Course Name', value: (r) => r.courseName, cell: (r) => <span className="text-sm font-medium">{r.courseName}</span> },
                { id: 'lecturer', header: 'Lecturer', value: (r) => r.lecturer ?? '', cell: (r) => <span className="text-sm">{r.lecturer ?? '—'}</span> },
                { id: 'assessment', header: 'Assessment', value: (r) => r.assessment, cell: (r) => <span className="text-sm">{r.assessment}</span> },
                { id: 'submitted', header: 'Submitted', value: (r) => r.submittedDate, cell: (r) => <span className="t-caption">{r.submittedDate}</span> },
                { id: 'students', header: 'Students', value: (r) => r.studentCount, cell: (r) => <span className="text-sm font-medium">{r.studentCount}</span> },
                { id: 'status', header: 'Status', value: () => 'Pending', cell: () => <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>Pending</span> },
                {
                  id: 'actions', header: '', className: 'text-right',
                  cell: (r) => (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setViewResult(r); setAdminNotes(''); setSheetOpen(true) }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
                        Review & Approve
                      </button>
                      <ConfirmAlertDialog
                        trigger={
                          <button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Return</button>
                        }
                        title="Return to lecturer?"
                        tone="warning"
                        headlineLabel="Action"
                        headline="Return for revision"
                        summary={`Return results for ${r.courseName} to ${r.lecturer ?? 'the lecturer'} for revision.`}
                        notices={[
                          { icon: 'bell', label: 'The lecturer will be notified to review and resubmit the results.' },
                          { icon: 'file', label: 'Your reason will be saved with this decision.' },
                        ]}
                        confirmLabel="Return"
                        confirmVariant="warning"
                        confirmDisabled={returnReason.trim().length < 4 || rejectMutation.isPending}
                        loading={rejectMutation.isPending}
                        onConfirm={() => rejectMutation.mutate({ id: r.id, reason: returnReason.trim() })}
                      >
                        <div>
                          <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Reason (required)</label>
                          <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={3} placeholder="Explain what needs to be corrected…"
                            className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
                        </div>
                      </ConfirmAlertDialog>
                    </div>
                  ),
                },
              ]}
            />
          )
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg px-3 h-9 mb-4" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', maxWidth: 480 }}>
              <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              <input type="text" placeholder="Search published results…" value={publishedSearch} onChange={(e) => setPublishedSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
            </div>
            <div className="flex flex-col gap-4">
              {published.length === 0 ? (
                <div className="text-center py-16" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published results yet.</p>
                </div>
              ) : filteredPublished.length === 0 ? (
                <div className="text-center py-12" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No results match your search.</p>
                </div>
              ) : filteredPublished.map((r) => (
                <div key={r.id} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 20 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="t-mono">{r.courseCode}</span>
                        <h3 className="t-h3" style={{ fontSize: '0.9375rem' }}>{r.courseName}</h3>
                      </div>
                      <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{r.assessment} · Published {r.submittedDate}</p>
                    </div>
                    <button type="button" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                      <Download style={{ width: 12, height: 12 }} />Export
                    </button>
                  </div>
                  <div className="flex gap-8">
                    <div><p className="t-label">Class Average</p><p className="text-lg font-bold">{r.avg != null ? `${r.avg}%` : '—'}</p></div>
                    <div><p className="t-label">Pass Rate</p><p className="text-lg font-bold" style={{ color: 'var(--success)' }}>{r.passRate != null ? `${r.passRate}%` : '—'}</p></div>
                    <div><p className="t-label">Students</p><p className="text-lg font-bold">{r.studentCount}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {viewResult ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
            <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>{viewResult.courseCode} — {viewResult.assessment}</SheetTitle>
            </SheetHeader>
            <div className="px-8 py-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                {[
                  { label: 'Average', value: viewResult.avg != null ? `${viewResult.avg}%` : '—', color: 'var(--info)' },
                  { label: 'Highest', value: viewResult.highest != null ? `${viewResult.highest}%` : '—', color: 'var(--success)' },
                  { label: 'Lowest', value: viewResult.lowest != null ? `${viewResult.lowest}%` : '—', color: 'var(--error)' },
                  { label: 'Pass Rate', value: viewResult.passRate != null ? `${viewResult.passRate}%` : '—', color: 'var(--success)' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <p className="t-label mb-0.5">{s.label}</p>
                    <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <p className="t-caption mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Based on {viewResult.studentCount === 1 ? '1 student' : `${viewResult.studentCount} students`} in this batch.
                {viewResult.studentCount === 1
                  ? ' Average, highest and lowest match because there is only one mark.'
                  : null}
              </p>
              <h3 className="t-h3 mb-3">Student Results</h3>
              <div className="mb-6">
                <DataTable
                  rows={viewResult.results}
                  rowKey={(r) => r.studentId}
                  searchPlaceholder="Search students…"
                  empty="No student results."
                  defaultPageSize={25}
                  columns={[
                    { id: 'id', header: 'Student ID', value: (r) => r.studentId, cell: (r) => <span className="t-mono">{r.studentId}</span> },
                    { id: 'name', header: 'Name', value: (r) => r.name, cell: (r) => <span className="text-sm">{r.name}</span> },
                    { id: 'marks', header: 'Marks', value: (r) => r.marks ?? '', cell: (r) => <span className="text-sm font-medium">{r.marks != null ? `${r.marks}%` : '—'}</span> },
                    {
                      id: 'grade', header: 'Grade', value: (r) => r.grade ?? '',
                      cell: (r) => {
                        if (!r.grade) return '—'
                        const gc = gradeColors(r.grade)
                        return <span className="t-label px-2 py-0.5" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{r.grade}</span>
                      },
                    },
                  ]}
                />
              </div>
              <div className="mb-6">
                <label className="t-label mb-1.5 block">Reviewer Notes</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Optional comments before publishing…"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
              </div>
              <ConfirmAlertDialog
                trigger={
                  <button type="button" className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
                    {approveMutation.isPending ? 'Publishing…' : 'Approve and publish'}
                  </button>
                }
                title="Publish these results?"
                tone="success"
                headlineLabel="Action"
                headline="Publish results"
                summary={`Results for ${viewResult.courseCode} will be published immediately.`}
                notices={[
                  { icon: 'user', label: 'Students will be able to view their grades once published.' },
                  { icon: 'bell', label: 'The lecturer will be notified that results are live.' },
                ]}
                confirmLabel="Publish"
                confirmVariant="brand"
                loading={approveMutation.isPending}
                onConfirm={() => approveMutation.mutate(viewResult.id)}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </AcademicShell>
  )
}
