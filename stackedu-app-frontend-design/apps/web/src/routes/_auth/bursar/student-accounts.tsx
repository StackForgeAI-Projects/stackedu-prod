import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV, BURSAR_STUDENTS, statusColors,
  type BursarStudent,
} from '@/data/bursar'
import { toast } from 'sonner'
import { Users, AlertCircle, Lock } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/student-accounts')({
  component: StudentAccountsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function StudentAccountsPage() {
  const navigate = useNavigate()

  const [search, setSearch]        = useState('')
  const [programmeFilter, setProg] = useState('all')
  const [statusFilter, setStatus]  = useState('all')
  const [page, setPage]            = useState(1)
  const [pageSize, setPageSize]    = useState(10)

  const filtered = useMemo(() => {
    return BURSAR_STUDENTS.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.includes(search)) return false
      if (programmeFilter !== 'all' && s.programme !== programmeFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      return true
    })
  }, [search, programmeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const totalOutstanding = BURSAR_STUDENTS.reduce((s, st) => s + st.outstanding, 0)
  const holdCount        = BURSAR_STUDENTS.filter((s) => s.hasHold).length
  const paidCount        = BURSAR_STUDENTS.filter((s) => s.status === 'Paid').length

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Student Accounts"
      userName={BURSAR.fullName}
      userRole="Bursar"
      userInitials={BURSAR.initials}
      unreadCount={2}
      infoCardLabel="BURSAR"
      infoCardValue={BURSAR.institution}
      infoCardSubtext="Finance Office"
    >
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - var(--header-height))' }}>
        <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

          {/* Section header */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1
                className="t-h1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
              >
                Student Accounts
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                View and manage fee accounts for all enrolled students
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast.success('Export started. CSV will download shortly.')}
            >
              <Download style={{ width: 14, height: 14 }} />
              Export
            </Button>
          </div>

          {/* StatTiles */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatTile
              icon={Users}
              iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
              label="TOTAL STUDENTS"
              value={String(BURSAR_STUDENTS.length)}
              delta={`${paidCount} fully paid`}
              deltaColor="var(--success)"
              animationDelay={0}
            />
            <StatTile
              icon={AlertCircle}
              iconColor="var(--warning)" iconBg="var(--warning-bg)"
              label="TOTAL OUTSTANDING"
              value={formatCurrency(totalOutstanding)}
              delta="Across all students"
              deltaColor="var(--warning)"
              animationDelay={60}
            />
            <StatTile
              icon={Lock}
              iconColor="var(--error)" iconBg="var(--error-bg)"
              label="FEE HOLDS ACTIVE"
              value={String(holdCount)}
              delta="Students blocked"
              deltaColor="var(--error)"
              animationDelay={120}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div
              className="flex items-center gap-2 rounded-xl px-3 h-9 flex-1"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                minWidth: 220,
                maxWidth: 320,
              }}
            >
              <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
            <Select value={programmeFilter} onValueChange={(v) => { setProg(v); setPage(1) }}>
              <SelectTrigger className="w-44 text-sm h-9">
                <SelectValue placeholder="Programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programmes</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Business Administration">Business Administration</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-36 text-sm h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Outstanding">Outstanding</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Student ID', 'Name', 'Programme', 'Year', 'Total Fees', 'Amount Paid', 'Outstanding', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="t-label text-left"
                        style={{ color: 'var(--muted-foreground)', padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((student, i) => {
                    const sc = statusColors(student.status)
                    const outstandingColor = student.outstanding > 0 ? 'var(--warning)' : 'var(--success)'
                    return (
                      <tr
                        key={student.id}
                        onClick={() => navigate({ to: '/bursar/student-account', search: { id: student.id } })}
                        style={{
                          borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{student.id}</span>
                        </td>
                        <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {student.name}
                        </td>
                        <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          {student.programme}
                        </td>
                        <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', textAlign: 'center' }}>
                          {student.year}
                        </td>
                        <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 500 }}>
                          {formatCurrency(student.totalFees)}
                        </td>
                        <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 500 }}>
                          {formatCurrency(student.amountPaid)}
                        </td>
                        <td className="text-sm" style={{ color: outstandingColor, padding: '14px 16px', fontWeight: 600 }}>
                          {formatCurrency(student.outstanding)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className="t-label px-2 py-0.5"
                            style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}
                          >
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-sm text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                        No students match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page</span>
                <span className="t-caption" style={{ color: 'var(--muted-foreground)', marginLeft: 12 }}>
                  {filtered.length === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)}`} of {filtered.length} entries
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
                <span className="t-caption px-1" style={{ color: 'var(--muted-foreground)' }}>{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next</Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
