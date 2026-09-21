import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell,
  ChevronRight, ChevronLeft,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  LIBRARIAN, RESOURCE_REQUESTS, CATALOGUE_RESOURCES,
  type ResourceRequest, type RequestStatus,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/requests')({
  component: RequestsPage,
})

const LIBRARIAN_NAV = [
  { label: 'Dashboard',          to: '/librarian/dashboard',    icon: LayoutDashboard },
  { label: 'Resource Catalogue', to: '/librarian/catalogue',    icon: Library         },
  { label: 'Collections',        to: '/librarian/collections',  icon: BookMarked      },
  { label: 'Resource Requests',  to: '/librarian/requests',     icon: Inbox           },
  { label: 'Analytics',          to: '/librarian/analytics',    icon: BarChart2       },
  { label: 'Notifications',      to: '/librarian/notifications', icon: Bell           },
]

const STATUS_CONFIG: Record<RequestStatus, { bg: string; color: string }> = {
  Pending:   { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  Fulfilled: { bg: 'var(--success-bg)', color: 'var(--success)' },
  Declined:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  Student:  { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  Lecturer: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
}

const REQ_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'New Resource':      { bg: 'rgba(32,244,78,0.1)',   color: 'var(--brand)' },
  'Existing Resource': { bg: 'var(--muted)',           color: 'var(--muted-foreground)' },
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─────────────────────────────────────────────────────────────────────────────

function RequestsPage() {
  const [requests,     setRequests]     = useState<ResourceRequest[]>(RESOURCE_REQUESTS)
  const [tab,          setTab]          = useState('all')
  const [detailTarget, setDetailTarget] = useState<ResourceRequest | null>(null)
  const [fulfilTarget, setFulfilTarget] = useState<ResourceRequest | null>(null)
  const [declineTarget,setDeclineTarget]= useState<ResourceRequest | null>(null)
  const [declineReason,setDeclineReason]= useState('')
  const [fulfilHow,    setFulfilHow]    = useState('catalogue')
  const [linkedRes,    setLinkedRes]    = useState('')
  const [arrivalDate,  setArrivalDate]  = useState('')
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(10)

  const tabCounts = {
    all:       requests.length,
    pending:   requests.filter(r => r.status === 'Pending').length,
    fulfilled: requests.filter(r => r.status === 'Fulfilled').length,
    declined:  requests.filter(r => r.status === 'Declined').length,
  }

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === (
    tab === 'pending' ? 'Pending' : tab === 'fulfilled' ? 'Fulfilled' : 'Declined'
  ))

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleFulfil = () => {
    if (!fulfilTarget) return
    setRequests(prev => prev.map(r => r.id === fulfilTarget.id ? { ...r, status: 'Fulfilled', resolution: fulfilHow === 'catalogue' ? `Linked to existing resource: ${linkedRes || 'Selected resource'}` : fulfilHow === 'ordered' ? `Ordered — expected arrival: ${arrivalDate || 'TBD'}` : 'Fulfilled' } : r))
    toast.success(`Request fulfilled. ${fulfilTarget.requester} will be notified.`)
    setFulfilTarget(null)
    setFulfilHow('catalogue')
    setLinkedRes('')
    setArrivalDate('')
  }

  const handleDecline = () => {
    if (!declineTarget) return
    setRequests(prev => prev.map(r => r.id === declineTarget.id ? { ...r, status: 'Declined', resolution: declineReason } : r))
    toast.error(`Request declined. ${declineTarget.requester} will be notified.`)
    setDeclineTarget(null)
    setDeclineReason('')
  }

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle="Resource Requests"
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARIAN"
      infoCardValue="StackForgeAI University"
      infoCardSubtext="Library Services"
    >
      <div className="px-8 py-8 animate-fade-up" style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Page header */}
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
          <span>Librarian</span><span>›</span>
          <span style={{ color: 'var(--foreground)' }}>Resource Requests</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Resource Requests</h1>
        </div>

        {/* Filter tabs */}
        <div className="mb-6">
          <Tabs value={tab} onValueChange={v => { setTab(v); setPage(1) }}>
            <TabsList>
              {([
                { value: 'all',       label: 'All'       },
                { value: 'pending',   label: 'Pending'   },
                { value: 'fulfilled', label: 'Fulfilled' },
                { value: 'declined',  label: 'Declined'  },
              ] as const).map(t => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1" style={{ backgroundColor: t.value === 'pending' && tabCounts.pending > 0 ? 'var(--warning)' : 'var(--muted)', color: t.value === 'pending' && tabCounts.pending > 0 ? '#fff' : 'var(--muted-foreground)' }}>
                    {tabCounts[t.value]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Requests table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Header row */}
          <div className="flex items-center gap-3 px-6 py-2.5" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 88, fontFamily: 'var(--font-mono)', fontSize: 10 }}>REQUEST ID</span>
            <span className="t-label" style={{ color: 'var(--muted-foreground)', minWidth: 120 }}>REQUESTER</span>
            <span className="t-label flex-1" style={{ color: 'var(--muted-foreground)' }}>RESOURCE TITLE</span>
            <span className="t-label flex-shrink-0 hidden xl:block" style={{ color: 'var(--muted-foreground)', width: 96 }}>TYPE</span>
            <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 80 }}>DATE</span>
            <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 72, textAlign: 'center' }}>STATUS</span>
            <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 120, textAlign: 'center' }}>ACTIONS</span>
          </div>

          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 12 }} />
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No requests in this category.</p>
            </div>
          ) : (
            paginated.map((req, i) => (
              <RequestRow
                key={req.id}
                request={req}
                isLast={i === paginated.length - 1}
                onOpen={() => setDetailTarget(req)}
                onFulfil={() => setFulfilTarget(req)}
                onDecline={() => setDeclineTarget(req)}
              />
            ))
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            <div className="flex items-center gap-2">
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                style={{ height: 28, padding: '0 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', cursor: 'pointer', outline: 'none' }}
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page · {filtered.length} total</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, border: '1px solid var(--border)', backgroundColor: 'var(--card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={13} />
              </button>
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, border: '1px solid var(--border)', backgroundColor: 'var(--card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailTarget !== null} onOpenChange={open => { if (!open) setDetailTarget(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(860px, 55vw)' }}>
          {detailTarget && <RequestDetailSheet request={detailTarget} onClose={() => setDetailTarget(null)} />}
        </SheetContent>
      </Sheet>

      {/* Fulfil Sheet */}
      <Sheet open={fulfilTarget !== null} onOpenChange={open => { if (!open) setFulfilTarget(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(860px, 55vw)' }}>
          {fulfilTarget && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)' }}>Fulfil Request</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                <DataRow label="Requester"    value={`${fulfilTarget.requester} (${fulfilTarget.role})`} />
                <DataRow label="Resource"     value={fulfilTarget.resourceTitle} />
                <DataRow label="Description"  value={fulfilTarget.description} />
                <DataRow label="Submitted"    value={fulfilTarget.dateSubmitted} />
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>HOW ARE YOU FULFILLING THIS REQUEST?</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {[
                      { id: 'catalogue', label: 'Found in catalogue — link existing resource' },
                      { id: 'ordered',   label: 'Ordered new resource — set expected arrival' },
                      { id: 'decline',   label: 'Cannot fulfil — redirect to decline' },
                    ].map(o => (
                      <label key={o.id} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="fulfil-how" value={o.id} checked={fulfilHow === o.id} onChange={() => setFulfilHow(o.id)} style={{ accentColor: 'var(--brand)' }} />
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{o.label}</span>
                      </label>
                    ))}
                  </div>

                  {fulfilHow === 'catalogue' && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Link to resource</Label>
                      <select
                        value={linkedRes}
                        onChange={e => setLinkedRes(e.target.value)}
                        style={{ height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none' }}
                      >
                        <option value="">Select a resource…</option>
                        {CATALOGUE_RESOURCES.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
                      </select>
                    </div>
                  )}

                  {fulfilHow === 'ordered' && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Expected arrival date</Label>
                      <input
                        type="date"
                        value={arrivalDate}
                        onChange={e => setArrivalDate(e.target.value)}
                        style={{ height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none', width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Button variant="outline" className="flex-1" onClick={() => setFulfilTarget(null)}>Cancel</Button>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
                  onClick={fulfilHow === 'decline' ? () => { setFulfilTarget(null); setDeclineTarget(fulfilTarget) } : handleFulfil}
                >
                  {fulfilHow === 'decline' ? 'Go to decline' : 'Mark as fulfilled'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Decline AlertDialog */}
      <AlertDialog open={declineTarget !== null} onOpenChange={open => { if (!open) setDeclineTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Decline Request</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for declining this request. The requester will be notified.
          </AlertDialogDescription>
          <Textarea
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (required)…"
            rows={3}
            className="mt-2"
          />
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setDeclineReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
              onClick={handleDecline}
              disabled={!declineReason.trim()}
            >
              Decline request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}

// ── Request row ───────────────────────────────────────────────────────────────

function RequestRow({ request, isLast, onOpen, onFulfil, onDecline }: {
  request: ResourceRequest
  isLast: boolean
  onOpen: () => void
  onFulfil: () => void
  onDecline: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const rs = ROLE_STYLE[request.role]
  const ss = STATUS_CONFIG[request.status]
  const ts = REQ_TYPE_STYLE[request.requestType]

  return (
    <div
      className="flex items-center gap-3 px-6 cursor-pointer"
      style={{
        paddingTop: 14, paddingBottom: 14,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: hovered ? 'var(--muted)' : 'transparent',
        transition: 'background-color 100ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      <span className="t-caption flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', width: 88, fontSize: 10 }}>
        {request.requestId}
      </span>
      <div className="flex flex-col flex-shrink-0" style={{ minWidth: 120 }}>
        <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)', maxWidth: 120 }}>{request.requester}</span>
        <span className="t-label px-1.5 py-0.5 w-fit mt-0.5" style={{ backgroundColor: rs.bg, color: rs.color, borderRadius: 'var(--radius-sm)', fontSize: 9 }}>{request.role}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{request.resourceTitle}</p>
      </div>
      <span className="t-label px-1.5 py-0.5 flex-shrink-0 hidden xl:block" style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)', fontSize: 9, width: 92, textAlign: 'center' }}>
        {request.requestType === 'New Resource' ? 'NEW' : 'EXISTING'}
      </span>
      <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 80, fontSize: '0.75rem' }}>{request.dateSubmitted}</span>
      <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)', fontSize: 9, width: 72, textAlign: 'center' }}>
        {request.status}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 120, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
        {request.status === 'Pending' ? (
          <>
            <Button size="sm" variant="outline" style={{ fontSize: '0.75rem', height: 26, borderColor: 'var(--brand)', color: 'var(--brand)', padding: '0 8px' }} onClick={onFulfil}>Fulfil</Button>
            <Button size="sm" variant="outline" style={{ fontSize: '0.75rem', height: 26, padding: '0 8px' }} onClick={onDecline}>Decline</Button>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>View</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Request detail Sheet content ──────────────────────────────────────────────

function RequestDetailSheet({ request, onClose }: { request: ResourceRequest; onClose: () => void }) {
  const rs = ROLE_STYLE[request.role]
  const ss = STATUS_CONFIG[request.status]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)' }}>{request.status}</span>
          <span className="t-caption" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', fontSize: 11 }}>{request.requestId}</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>
          {request.resourceTitle}
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-6 py-5">
        <DataRow label="Requester" value={
          <span className="flex items-center gap-2">
            {request.requester}
            <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: rs.bg, color: rs.color, borderRadius: 'var(--radius-sm)', fontSize: 9 }}>{request.role}</span>
          </span>
        } />
        {request.studentId && <DataRow label="Student ID" value={<span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{request.studentId}</span>} />}
        <DataRow label="Request type" value={request.requestType} />
        <DataRow label="Date submitted" value={request.dateSubmitted} />
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>DESCRIPTION</p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.75 }}>{request.description}</p>
        </div>
        {request.resolution && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>RESOLUTION</p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.75 }}>{request.resolution}</p>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 mt-auto">
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', minWidth: 100, paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}
