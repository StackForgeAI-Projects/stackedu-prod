import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, Mail, Phone, Download, FileText, X, CheckCircle } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, APPLICATIONS, appStatusColors, type AppStatus } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/application')({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) || '1' }),
  component: ApplicationDetailPage,
})

// ─────────────────────────────────────────────────────────────────────────────

type DecisionChoice = 'Approved' | 'Conditional' | 'Rejected' | 'Withdrawn'

function ApplicationDetailPage() {
  const { id }  = Route.useSearch()
  const app     = APPLICATIONS.find((a) => a.id === id) ?? APPLICATIONS[0]

  const getInitialDecision = (): DecisionChoice => {
    if (app.status === 'Conditional') return 'Conditional'
    if (app.status === 'Rejected')    return 'Rejected'
    if (app.status === 'Withdrawn')   return 'Withdrawn'
    return 'Approved'
  }

  const [decision, setDecision]         = useState<DecisionChoice>(getInitialDecision)
  const [notes, setNotes]               = useState(app.notes ?? '')
  const [conditions, setConditions]     = useState('')
  const [withdrawReason, setWithdrawReason] = useState('')
  const [submitted, setSubmitted]       = useState(false)
  const [previewDoc, setPreviewDoc]     = useState<{ name: string } | null>(null)

  const sc = appStatusColors(app.status)

  const docStatusColors = (s: string) => {
    if (s === 'Submitted') return { bg: 'var(--success-bg)', color: 'var(--success)' }
    if (s === 'Pending')   return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    return                        { bg: 'var(--error-bg)',   color: 'var(--error)'   }
  }

  const statusBadgeLabel = (s: AppStatus) => {
    if (s === 'Accepted') return 'Offer Accepted'
    if (s === 'Declined') return 'Offer Declined'
    return s
  }

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Application Detail"
      userName={ACADEMIC_ADMIN.fullName}
      userRole={ACADEMIC_ADMIN.role}
      userInitials={ACADEMIC_ADMIN.initials}
      unreadCount={4}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/academic/applications" className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--success)', textDecoration: 'none' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />Applications
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>{app.appId}</span>
        </div>

        {/* Section header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{app.fullName}</h1>
            <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>{app.appId}</span>
          </div>
          <span className="t-label px-3 py-1.5 mt-1" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{statusBadgeLabel(app.status)}</span>
        </div>

        <div className="flex gap-6">

          {/* ── Main content (65%) ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0" style={{ flex: '0 0 65%', maxWidth: '65%' }}>

            {/* Personal Details */}
            <SectionCard title="Personal Details">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: 'Full Name',    value: app.fullName    },
                  { label: 'Date of Birth', value: app.dob        },
                  { label: 'Gender',       value: app.gender      },
                  { label: 'Nationality',  value: app.nationality },
                  { label: 'Phone',        value: app.phone       },
                  { label: 'Email',        value: app.email       },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Academic History */}
            <SectionCard title="Academic History">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: 'Previous Institution',  value: app.prevInstitution   },
                  { label: 'Highest Qualification', value: app.prevQualification },
                  { label: 'Grades / GPA',          value: app.prevGPA           },
                  { label: 'Year Completed',        value: app.prevYearCompleted },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Documents */}
            <SectionCard title="Documents">
              <div className="flex flex-col" style={{ gap: 0 }}>
                {app.documents.map((doc, i) => {
                  const dc = docStatusColors(doc.status)
                  return (
                    <div key={doc.name} className="flex items-center gap-4 py-3.5" style={{ borderBottom: i < app.documents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{doc.name}</p>
                        {doc.uploadDate && (
                          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Uploaded {doc.uploadDate}</p>
                        )}
                      </div>
                      <span className="t-label px-2 py-0.5" style={{ backgroundColor: dc.bg, color: dc.color, borderRadius: 'var(--radius-sm)' }}>{doc.status}</span>
                      {doc.status === 'Submitted' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc({ name: doc.name })}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <FileText style={{ width: 12, height: 12 }} />Preview
                          </button>
                          <button
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <Download style={{ width: 12, height: 12 }} />Download
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {/* Programme & Entry */}
            <SectionCard title="Programme & Entry">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: 'Programme Applied', value: app.programme },
                  { label: 'Entry Year',        value: app.entryYear },
                  { label: 'Study Mode',        value: app.studyMode },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

          </div>

          {/* ── Right sidebar (35%) ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4" style={{ flex: '0 0 35%', maxWidth: '35%' }}>

            {/* Application Status card */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Application Status</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="t-label px-3 py-1.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  {statusBadgeLabel(app.status)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <DataRow label="Submitted"    value={app.submittedDate} />
                <DataRow label="Last Updated" value={app.lastUpdated}   />
              </div>
            </div>

            {/* Decision card */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Decision</h3>

              {/* Case 1: Accepted — read-only */}
              {app.status === 'Accepted' ? (
                <div>
                  <div className="flex items-start gap-3 p-4 rounded-xl mb-3" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <CheckCircle style={{ width: 16, height: 16, color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--success)' }}>Offer Accepted</p>
                      <p className="t-caption" style={{ color: 'var(--success)', opacity: 0.85 }}>
                        This offer has been accepted by the applicant. The ICT Manager has been notified to create the student account.
                      </p>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-xl text-sm font-medium transition-colors duration-150"
                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    View acceptance details
                  </button>
                </div>

              /* Case 2: Declined — read-only */
              ) : app.status === 'Declined' ? (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--error)' }}>Offer Declined</p>
                  <p className="t-caption" style={{ color: 'var(--error)', opacity: 0.85 }}>The applicant has declined this offer.</p>
                  <p className="t-caption mt-1.5" style={{ color: 'var(--muted-foreground)' }}>Declined on {app.lastUpdated}</p>
                </div>

              /* Case 3: Submitted successfully */
              ) : submitted ? (
                <div className="text-sm py-3 px-3 rounded-lg" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                  Decision submitted successfully.
                </div>

              /* Case 4: Editable form */
              ) : (
                <>
                  {app.status === 'Approved' && (
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(32,244,78,0.06)', border: '1px solid rgba(32,244,78,0.15)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--success)' }}>Offer has been sent to applicant</p>
                      <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Waiting for applicant response</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Decision</label>
                    <select value={decision} onChange={(e) => setDecision(e.target.value as DecisionChoice)}
                      className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                    >
                      <option value="Approved">Approve</option>
                      <option value="Conditional">Conditional Offer</option>
                      <option value="Rejected">Reject</option>
                      <option value="Withdrawn">Withdraw Offer</option>
                    </select>
                  </div>

                  {decision === 'Conditional' && (
                    <div className="mb-3">
                      <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Conditions</label>
                      <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2} placeholder="List conditions for this offer…"
                        className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                      />
                    </div>
                  )}

                  {decision === 'Withdrawn' && (
                    <div className="mb-3">
                      <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Withdrawal Reason <span style={{ color: 'var(--error)' }}>*</span></label>
                      <textarea value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} rows={2} placeholder="Required: reason for withdrawing this offer…"
                        className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                        style={{ border: `1px solid ${withdrawReason ? 'var(--border)' : 'var(--error)'}`, backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add reviewer notes…"
                      className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={decision === 'Withdrawn' && !withdrawReason.trim()}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                      >
                        Submit decision
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm decision</AlertDialogTitle>
                        <AlertDialogDescription>
                          You are about to mark this application as <strong>{decision === 'Withdrawn' ? 'Withdrawn' : decision}</strong> for {app.fullName}. This will trigger a notification to the applicant.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setSubmitted(true)}>Confirm</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Withdraw offer section — shown when status is Approved and offer not yet withdrawn */}
                  {app.status === 'Approved' && decision !== 'Withdrawn' && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                            style={{ border: '1px solid var(--error)', color: 'var(--error)', backgroundColor: 'transparent', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            Withdraw offer
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Withdraw this offer?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Withdrawing this offer will notify {app.fullName} immediately. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="px-1 py-2">
                            <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Reason (required)</label>
                            <textarea
                              value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)}
                              rows={3} placeholder="State the reason for withdrawing this offer…"
                              className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => setSubmitted(true)}
                              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
                            >
                              Withdraw offer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Contact card */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Applicant Contact</h3>
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Mail style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{app.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{app.phone}</span>
                </div>
              </div>
              <button className="w-full py-2 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Send email
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={previewDoc !== null} onOpenChange={(open) => { if (!open) setPreviewDoc(null) }}>
        <DialogContent style={{ maxWidth: 640 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center rounded-xl mt-2" style={{ height: 300, backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <FileText style={{ width: 48, height: 48, color: 'var(--muted-foreground)', marginBottom: 12 }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Document preview would appear here</p>
          </div>
        </DialogContent>
      </Dialog>

    </AppShell>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
      <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{title}</h2>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{value}</span>
    </div>
  )
}
