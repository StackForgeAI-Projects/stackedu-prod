import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, AlertTriangle, CheckCircle2, MessageSquare,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { LECTURER, LECTURER_COURSES, AT_RISK_STUDENTS, type AtRiskStudent } from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/at-risk')({
  component: AtRiskPage,
})

const LECTURER_NAV = [
  { label: 'Dashboard',     to: '/lecturer/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/lecturer/courses',       icon: BookOpen        },
  { label: 'Attendance',    to: '/lecturer/attendance',    icon: ClipboardList   },
  { label: 'Results',       to: '/lecturer/results',       icon: BarChart2       },
  { label: 'Assignments',   to: '/lecturer/assignments',   icon: FileText        },
  { label: 'Analytics',     to: '/lecturer/analytics',     icon: TrendingUp      },
  { label: 'Notifications', to: '/lecturer/notifications', icon: Bell            },
]

const RISK_STYLE: Record<'High' | 'Medium' | 'Low', { bg: string; color: string; iconColor: string }> = {
  High:   { bg: 'var(--error-bg)',   color: 'var(--error)',   iconColor: 'var(--error)'   },
  Medium: { bg: 'var(--warning-bg)', color: 'var(--warning)', iconColor: 'var(--warning)' },
  Low:    { bg: 'var(--info-bg)',    color: 'var(--info)',    iconColor: 'var(--info)'    },
}

// ─────────────────────────────────────────────────────────────────────────────

function AtRiskPage() {
  const [courseFilter, setCourseFilter]   = useState('all')
  const [riskTab,      setRiskTab]        = useState('all')
  const [students,     setStudents]       = useState<AtRiskStudent[]>(AT_RISK_STUDENTS)

  const markResolved = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, resolved: true } : s))
    toast.success('Student marked as resolved')
  }

  const filtered = students.filter(s => {
    if (s.resolved) return false
    if (courseFilter !== 'all' && s.courseId !== courseFilter) return false
    if (riskTab === 'High' && s.riskLevel !== 'High') return false
    if (riskTab === 'Medium' && s.riskLevel !== 'Medium') return false
    if (riskTab === 'Low' && s.riskLevel !== 'Low') return false
    return true
  })

  const resolved = students.filter(s => s.resolved)

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="At-Risk Students"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>At-Risk Students</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {filtered.length} active alert{filtered.length !== 1 ? 's' : ''} across your courses.
            </p>
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Risk level tabs */}
        <div className="mb-6">
          <Tabs value={riskTab} onValueChange={setRiskTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="High">High Risk</TabsTrigger>
              <TabsTrigger value="Medium">Medium Risk</TabsTrigger>
              <TabsTrigger value="Low">Low Risk</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Active alerts */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center mb-8">
            <div style={{ width: 56, height: 56, backgroundColor: 'var(--success-bg)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <CheckCircle2 style={{ width: 24, height: 24, color: 'var(--success)' }} />
            </div>
            <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No alerts</p>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 300 }}>
              No at-risk students match your current filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {filtered.map(s => <AtRiskCard key={s.id} student={s} onResolve={() => markResolved(s.id)} />)}
          </div>
        )}

        {/* Resolved section */}
        {resolved.length > 0 && (
          <div>
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Resolved</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {resolved.map(s => {
                const course = LECTURER_COURSES.find(c => c.id === s.courseId)
                return (
                  <div key={s.id} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '14px 20px', opacity: 0.6 }}>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--success)', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)', textDecoration: 'line-through' }}>{s.name}</p>
                        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{course?.code} · Resolved</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── At-risk student card ──────────────────────────────────────────────────────

function AtRiskCard({ student: s, onResolve }: { student: AtRiskStudent; onResolve: () => void }) {
  const [hovered, setHovered] = useState(false)
  const course = LECTURER_COURSES.find(c => c.id === s.courseId)
  const rs     = RISK_STYLE[s.riskLevel]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: '18px 20px',
        transition: 'box-shadow 150ms ease-out',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Risk icon */}
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: rs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <AlertTriangle style={{ width: 18, height: 18, color: rs.iconColor }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{s.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
            <span className="t-label px-2 py-0.5" style={{ backgroundColor: rs.bg, color: rs.color, borderRadius: 'var(--radius-sm)' }}>{s.riskLevel} Risk</span>
            {course && (
              <span className="t-label px-2 py-0.5" style={{ backgroundColor: course.color + '18', color: course.color, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{course.code}</span>
            )}
          </div>

          {/* Reason tags */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {s.reasons.map((r, i) => (
              <span key={i} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1" style={{ fontSize: '0.8125rem' }} onClick={() => toast.success(`Message sent to ${s.name}`)}>
            <MessageSquare style={{ width: 12, height: 12 }} /> Send message
          </Button>
          <Button variant="outline" size="sm" className="gap-1" style={{ fontSize: '0.8125rem' }} onClick={onResolve}>
            <CheckCircle2 style={{ width: 12, height: 12 }} /> Mark resolved
          </Button>
        </div>
      </div>
    </div>
  )
}
