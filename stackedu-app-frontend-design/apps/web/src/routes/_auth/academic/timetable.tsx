import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, TIMETABLE_SLOTS, COURSES, LECTURERS, type TimetableSlot, type SessionType } from '@/data/academic'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/timetable')({
  component: TimetableManagerPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const DAYS      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_ABBR  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS     = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const PROGRAMMES = ['Computer Science Year 1', 'Computer Science Year 2', 'Business Administration Year 1']
const SEMESTERS  = ['Semester 1 · 2024/2025', 'Semester 2 · 2024/2025']
const SESSION_TYPES: SessionType[] = ['Lecture', 'Tutorial', 'Lab']

function fmt(h: number) { return `${String(h).padStart(2, '0')}:00` }

// ─────────────────────────────────────────────────────────────────────────────

function TimetableManagerPage() {
  const [slots, setSlots]         = useState(TIMETABLE_SLOTS)
  const [programme, setProgramme] = useState(PROGRAMMES[0])
  const [semester, setSemester]   = useState(SEMESTERS[0])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selSlot, setSelSlot]     = useState<{ day: number; hour: number } | null>(null)
  const [editSlot, setEditSlot]   = useState<TimetableSlot | null>(null)

  const [form, setForm] = useState({ courseCode: '', courseName: '', lecturer: '', room: '', type: 'Lecture' as SessionType })

  const conflict = slots.some((a, i) =>
    slots.some((b, j) => i !== j && a.day === b.day && a.hour === b.hour && (a.lecturer === b.lecturer || a.room === b.room))
  )

  const openEmpty = (day: number, hour: number) => {
    setEditSlot(null); setSelSlot({ day, hour })
    setForm({ courseCode: '', courseName: '', lecturer: '', room: '', type: 'Lecture' })
    setSheetOpen(true)
  }

  const openEdit = (s: TimetableSlot) => {
    setEditSlot(s); setSelSlot({ day: s.day, hour: s.hour })
    setForm({ courseCode: s.courseCode, courseName: s.courseName, lecturer: s.lecturer, room: s.room, type: s.type })
    setSheetOpen(true)
  }

  const saveSlot = () => {
    const course = COURSES.find((c) => c.code === form.courseCode)
    const newSlot: TimetableSlot = {
      id: editSlot ? editSlot.id : Date.now(),
      day: selSlot!.day, hour: selSlot!.hour,
      courseCode: form.courseCode, courseName: form.courseName,
      lecturer: form.lecturer, room: form.room, type: form.type,
      dept: course?.department.slice(0, 3).toUpperCase() ?? 'GEN',
      color: '#6366F1',
    }
    if (editSlot) {
      setSlots((prev) => prev.map((s) => s.id === editSlot.id ? newSlot : s))
    } else {
      setSlots((prev) => [...prev, newSlot])
    }
    setSheetOpen(false)
  }

  const removeSlot = () => {
    if (editSlot) setSlots((prev) => prev.filter((s) => s.id !== editSlot.id))
    setSheetOpen(false)
  }

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Timetable"
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
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Timetable Manager</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Manage weekly class schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={programme} onChange={(e) => setProgramme(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {PROGRAMMES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                >
                  Publish timetable
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish timetable?</AlertDialogTitle>
                  <AlertDialogDescription>This will publish the timetable and notify all students and lecturers.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toast.success('Timetable published. Students and lecturers have been notified.')}>Publish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Conflict banner */}
        {conflict && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error)' }}>
            <AlertCircle style={{ width: 16, height: 16, color: 'var(--error)', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: 'var(--error)' }}>Conflict detected: a lecturer or room is double-booked. Please resolve before publishing.</p>
          </div>
        )}

        {/* Grid */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th className="t-label" style={{ color: 'var(--muted-foreground)', padding: '12px 16px', width: 72, borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 }}>Time</th>
                  {DAY_ABBR.map((d) => (
                    <th key={d} className="t-label text-center" style={{ color: 'var(--muted-foreground)', padding: '12px 8px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="t-mono" style={{ color: 'var(--muted-foreground)', padding: '8px 16px', fontSize: 11, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{fmt(hour)}</td>
                    {[1, 2, 3, 4, 5].map((day) => {
                      const slot = slots.find((s) => s.day === day && s.hour === hour)
                      return (
                        <td key={day} style={{ padding: 4, verticalAlign: 'top' }}>
                          {slot ? (
                            <button onClick={() => openEdit(slot)} className="w-full text-left p-2.5 rounded-lg transition-all duration-150"
                              style={{ backgroundColor: `${slot.color}18`, border: `1px solid ${slot.color}40`, cursor: 'pointer', minHeight: 64 }}
                              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                            >
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: slot.color, marginBottom: 2 }}>{slot.courseCode}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--foreground)', fontWeight: 500, marginBottom: 2 }}>{slot.courseName}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{slot.room}</p>
                              <span style={{ fontSize: 9, fontWeight: 600, color: slot.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{slot.type}</span>
                            </button>
                          ) : (
                            <button onClick={() => openEmpty(day, hour)} className="w-full rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-150 flex items-center justify-center"
                              style={{ height: 64, border: '1px dashed var(--border)', color: 'var(--muted-foreground)', background: 'none', cursor: 'pointer', fontSize: 20 }}>
                              +
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slot Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {editSlot ? 'Edit Session' : 'Assign Session'}
              {selSlot && <span className="ml-2 text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>— {DAY_ABBR[selSlot.day - 1]} {fmt(selSlot.hour)}</span>}
            </SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">
            {[
              { label: 'Course', node:
                <select value={form.courseCode} onChange={(e) => {
                  const c = COURSES.find((x) => x.code === e.target.value)
                  setForm({ ...form, courseCode: e.target.value, courseName: c?.name ?? '', lecturer: c?.lecturer ?? '' })
                }}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>
                  <option value="">Select course</option>
                  {COURSES.filter((c) => c.status === 'Active').map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              },
              { label: 'Lecturer', node: <input value={form.lecturer} readOnly className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} /> },
              { label: 'Room', node: <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. Lab 3" className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} /> },
              { label: 'Session Type', node:
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SessionType })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>
                  {SESSION_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              },
            ].map((f) => (
              <div key={f.label} className="mb-4">
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>{f.label}</label>
                {f.node}
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              {editSlot && (
                <button onClick={removeSlot} className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                  style={{ border: '1px solid var(--error)', color: 'var(--error)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                  Remove session
                </button>
              )}
              <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveSlot} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
                {editSlot ? 'Save changes' : 'Assign'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}
