import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, PENDING_RESULTS, gradeColors } from '@/data/academic'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/results')({
  component: ResultManagementPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const SEMESTERS = ['Semester 1 · 2024/2025', 'Semester 2 · 2024/2025']

// ─────────────────────────────────────────────────────────────────────────────

function ResultManagementPage() {
  const [tab, setTab]               = useState<'pending' | 'published'>('pending')
  const [semester, setSemester]     = useState(SEMESTERS[0])
  const [pending, setPending]       = useState(PENDING_RESULTS)
  const [published, setPublished]   = useState<typeof PENDING_RESULTS>([])
  const [pendingSearch, setPendingSearch]   = useState('')
  const [publishedSearch, setPublishedSearch] = useState('')
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [viewResult, setViewResult] = useState(PENDING_RESULTS[0])
  const [adminNotes, setAdminNotes] = useState('')
  const [returnReason, setReturnReason] = useState('')

  const filterResults = (results: typeof PENDING_RESULTS, query: string) => {
    if (!query.trim()) return results
    const q = query.toLowerCase()
    return results.filter((r) =>
      r.courseName.toLowerCase().includes(q) ||
      r.courseCode.toLowerCase().includes(q) ||
      r.lecturer.toLowerCase().includes(q)
    )
  }

  const filteredPending   = filterResults(pending, pendingSearch)
  const filteredPublished = filterResults(published, publishedSearch)

  const approveResult = () => {
    setPublished((prev) => [...prev, { ...viewResult, status: 'Approved' as const }])
    setPending((prev) => prev.filter((r) => r.id !== viewResult.id))
    toast.success(`Results for ${viewResult.courseCode} published. Students have been notified.`)
    setSheetOpen(false)
  }

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Results"
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
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Result Management</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Approve and publish lecturer-submitted results</p>
          </div>
          <select value={semester} onChange={(e) => setSemester(e.target.value)}
            className="text-sm rounded-lg px-3 h-9 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {[
            { key: 'pending' as const,   label: 'Pending Approval', count: pending.length   },
            { key: 'published' as const, label: 'Published',        count: published.length },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{ backgroundColor: tab === t.key ? 'var(--foreground)' : 'transparent', color: tab === t.key ? 'var(--ink-foreground)' : 'var(--muted-foreground)', border: tab === t.key ? '1px solid var(--foreground)' : '1px solid var(--border)', cursor: 'pointer' }}
            >
              {t.label}
              <span className="t-label px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tab === t.key ? 'rgba(255,255,255,0.15)' : 'var(--muted)', color: tab === t.key ? '#fff' : 'var(--muted-foreground)', fontSize: 10 }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Pending tab */}
        {tab === 'pending' && (
          <>
            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg px-3 h-9 mb-4" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', maxWidth: 480 }}>
              <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              <input type="text" placeholder="Search by course name, course code, or lecturer name…" value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
            </div>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            {pending.length === 0 ? (
              <div className="text-center py-16">
                <p className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>All caught up!</p>
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No results pending approval.</p>
              </div>
            ) : filteredPending.length === 0 ? (
              <div className="text-center py-12">
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No results match your search.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Course Code', 'Course Name', 'Lecturer', 'Assessment', 'Submitted', 'Students', 'Status', ''].map((h) => (
                      <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < filteredPending.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}><span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{r.courseCode}</span></td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px', minWidth: 180 }}>{r.courseName}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{r.lecturer}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{r.assessment}</td>
                      <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{r.submittedDate}</td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px' }}>{r.studentCount}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>Pending</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setViewResult(r); setAdminNotes(''); setSheetOpen(true) }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
                            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                          >
                            Review & Approve
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                                Return
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Return to lecturer?</AlertDialogTitle>
                                <AlertDialogDescription>Return results for {r.courseName} to {r.lecturer} for revision.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="px-1 py-2">
                                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Reason (required)</label>
                                <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={3} placeholder="Explain what needs to be corrected…"
                                  className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { toast.info(`Results returned to ${r.lecturer}.`); setReturnReason('') }}>Return</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </>
        )}

        {/* Published tab */}
        {tab === 'published' && (
          <>
            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg px-3 h-9 mb-4" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', maxWidth: 480 }}>
              <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              <input type="text" placeholder="Search by course name, course code, or lecturer name…" value={publishedSearch} onChange={(e) => setPublishedSearch(e.target.value)}
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
              <div key={r.id} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{r.courseCode}</span>
                      <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>{r.courseName}</h3>
                    </div>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{r.assessment} · Published {r.submittedDate}</p>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                    <Download style={{ width: 12, height: 12 }} />Export
                  </button>
                </div>
                <div className="flex gap-8">
                  <div><p className="t-label" style={{ color: 'var(--muted-foreground)' }}>Class Average</p><p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{r.avg}%</p></div>
                  <div><p className="t-label" style={{ color: 'var(--muted-foreground)' }}>Pass Rate</p><p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--success)' }}>{r.passRate}%</p></div>
                  <div><p className="t-label" style={{ color: 'var(--muted-foreground)' }}>Students</p><p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{r.studentCount}</p></div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Review Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {viewResult.courseCode} — {viewResult.assessment}
            </SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">
            {/* Class stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Average',   value: `${viewResult.avg}%`,      color: 'var(--info)'    },
                { label: 'Highest',   value: `${viewResult.highest}%`,   color: 'var(--success)' },
                { label: 'Lowest',    value: `${viewResult.lowest}%`,    color: 'var(--error)'   },
                { label: 'Pass Rate', value: `${viewResult.passRate}%`, color: 'var(--success)' },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                  <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Results table */}
            <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Student Results</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr>
                  {['Student ID', 'Name', 'Marks', 'Grade'].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 8, borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewResult.results.map((r, i) => {
                  const gc = gradeColors(r.grade)
                  return (
                    <tr key={r.studentId} style={{ borderBottom: i < viewResult.results.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px 12px 0' }}><span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{r.studentId}</span></td>
                      <td className="text-sm" style={{ color: 'var(--foreground)', padding: '12px 16px 12px 0' }}>{r.name}</td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '12px 16px 12px 0' }}>{r.marks}%</td>
                      <td style={{ padding: '12px 0' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{r.grade}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Admin notes */}
            <div className="mb-6">
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Reviewer Notes</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Optional comments before publishing…"
                className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
                  Approve and publish
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish these results?</AlertDialogTitle>
                  <AlertDialogDescription>Results for <strong>{viewResult.courseCode}</strong> will be published immediately. Students will be notified.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={approveResult}>Publish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}
