import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, ACADEMIC_STUDENTS, type StudentStatus, studentStatusColors } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/students')({
  component: StudentRegistryPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const PROGRAMMES_FILTER = ['All Programmes', 'Computer Science', 'Information Technology', 'Mathematics', 'Business Administration']
const YEARS_FILTER      = ['All Years', 'Year 1', 'Year 2', 'Year 3', 'Year 4']
const STATUSES_FILTER   = ['All Statuses', 'Active', 'Suspended', 'Graduated', 'Deferred']
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─────────────────────────────────────────────────────────────────────────────

function StudentRegistryPage() {
  const [search, setProg]       = useState('')
  const [programme, setProgramme] = useState('All Programmes')
  const [year, setYear]         = useState('All Years')
  const [status, setStatus]     = useState('All Statuses')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage]         = useState(1)

  const filtered = ACADEMIC_STUDENTS.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    const matchProg   = programme === 'All Programmes' || s.programme === programme
    const matchYear   = year === 'All Years' || s.year === Number(year.replace('Year ', ''))
    const matchStatus = status === 'All Statuses' || s.status === status
    return matchSearch && matchProg && matchYear && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Students"
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
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Student Registry</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{ACADEMIC_STUDENTS.length} enrolled students</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
          >
            <Download style={{ width: 14, height: 14 }} />Export
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 h-9 flex-1 min-w-52 max-w-xs" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input type="text" placeholder="Search name or student ID…" value={search} onChange={(e) => { setProg(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
          </div>
          {[
            { value: programme, set: (v: string) => { setProgramme(v); setPage(1) }, options: PROGRAMMES_FILTER },
            { value: year,      set: (v: string) => { setYear(v);      setPage(1) }, options: YEARS_FILTER      },
            { value: status,    set: (v: string) => { setStatus(v);    setPage(1) }, options: STATUSES_FILTER   },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={(e) => f.set(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Student ID', 'Name', 'Programme', 'Year', 'Enrollment Date', 'Status'].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 t-body" style={{ color: 'var(--muted-foreground)' }}>No students found</td></tr>
                ) : paginated.map((s, i) => {
                  const sc = studentStatusColors(s.status)
                  return (
                    <tr key={s.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {}}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <Link to="/academic/student" search={{ id: s.id }} style={{ textDecoration: 'none' }}>
                          <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{s.id}</span>
                        </Link>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link to="/academic/student" search={{ id: s.id }} style={{ textDecoration: 'none' }}>
                          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.fullName}</span>
                        </Link>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{s.programme}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px' }}>Year {s.year}</td>
                      <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{s.enrollmentDate}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{s.status}</span>
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
