import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import {
  ACADEMIC_ADMIN, ACADEMIC_NAV, APPLICATIONS,
  type AppStatus, appStatusColors,
} from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/applications')({
  component: ApplicationsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: AppStatus | 'All' }[] = [
  { label: 'All',         value: 'All'         },
  { label: 'Pending',     value: 'Pending'     },
  { label: 'Approved',    value: 'Approved'    },
  { label: 'Conditional', value: 'Conditional' },
  { label: 'Accepted',    value: 'Accepted'    },
  { label: 'Declined',    value: 'Declined'    },
  { label: 'Rejected',    value: 'Rejected'    },
  { label: 'Withdrawn',   value: 'Withdrawn'   },
]

const INTAKES = ['Intake 2025 (Current)', 'Intake 2024', 'Intake 2023']
const PROGRAMMES_LIST = ['All Programmes', 'Computer Science', 'Information Technology', 'Mathematics', 'Business Administration']
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─────────────────────────────────────────────────────────────────────────────

function ApplicationsPage() {
  const [search, setSearch]         = useState('')
  const [activeTab, setActiveTab]   = useState<AppStatus | 'All'>('All')
  const [intake, setIntake]         = useState(INTAKES[0])
  const [programme, setProgramme]   = useState('All Programmes')
  const [pageSize, setPageSize]     = useState(10)
  const [page, setPage]             = useState(1)

  const filtered = APPLICATIONS.filter((a) => {
    const matchSearch = a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.appId.toLowerCase().includes(search.toLowerCase()) ||
      a.programme.toLowerCase().includes(search.toLowerCase())
    const matchStatus  = activeTab === 'All' || a.status === activeTab
    const matchProg    = programme === 'All Programmes' || a.programme === programme
    return matchSearch && matchStatus && matchProg
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const countFor = (s: AppStatus | 'All') =>
    s === 'All' ? APPLICATIONS.length : APPLICATIONS.filter((a) => a.status === s).length

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Applications"
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
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Applications</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Review and manage student admission applications</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={programme} onChange={(e) => { setProgramme(e.target.value); setPage(1) }}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {PROGRAMMES_LIST.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={intake} onChange={(e) => setIntake(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {INTAKES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 rounded-lg px-3 h-9 flex-1 max-w-xs" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input type="text" placeholder="Search applicant, ID or programme…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.value
            const cnt    = countFor(tab.value)
            return (
              <button key={tab.value} onClick={() => { setActiveTab(tab.value); setPage(1) }}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{ backgroundColor: active ? 'var(--foreground)' : 'transparent', color: active ? 'var(--ink-foreground)' : 'var(--muted-foreground)', border: active ? '1px solid var(--foreground)' : '1px solid var(--border)', cursor: 'pointer' }}
              >
                {tab.label}
                <span className="t-label px-1.5 py-0.5 rounded-full" style={{ backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'var(--muted)', color: active ? '#fff' : 'var(--muted-foreground)', fontSize: 10 }}>
                  {cnt}
                </span>
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Application ID', 'Applicant Name', 'Programme', 'Date Submitted', 'Documents', 'Status', ''].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 t-body" style={{ color: 'var(--muted-foreground)' }}>
                      No applications found
                    </td>
                  </tr>
                ) : paginated.map((app, i) => {
                  const sc  = appStatusColors(app.status)
                  const doc = app.docsComplete
                    ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Complete'   }
                    : { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Incomplete' }
                  return (
                    <tr key={app.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{app.appId}</span>
                      </td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{app.fullName}</td>
                      <td className="text-sm"             style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{app.programme}</td>
                      <td className="t-caption"           style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{app.submittedDate}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: doc.bg, color: doc.color, borderRadius: 'var(--radius-sm)' }}>{doc.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{app.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link to="/academic/application" search={{ id: app.id }}>
                          <button className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            Review
                          </button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="text-sm rounded-lg px-2 h-8 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n}>{n}</option>)}
              </select>
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page · {filtered.length} total</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className="h-8 w-8 rounded-lg text-sm transition-colors duration-150"
                  style={{ backgroundColor: p === page ? 'var(--foreground)' : 'transparent', color: p === page ? 'var(--ink-foreground)' : 'var(--muted-foreground)', border: 'none', cursor: 'pointer' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
