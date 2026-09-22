import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronDown, ChevronRight, Pencil, Trash2, Plus, Check, X, AlertTriangle } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, PROGRAMMES, COURSES, type CourseType } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/programme')({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) || '1' }),
  component: ProgrammeDetailPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function courseCodeColor(code: string) {
  const prefix = code.split(' ')[0]
  switch (prefix) {
    case 'CSC': return { bg: 'var(--info-bg)',           color: 'var(--info)'             }
    case 'MTH': return { bg: 'var(--warning-bg)',         color: 'var(--warning)'          }
    case 'ENG': return { bg: 'rgba(32,244,78,0.10)',     color: '#16A34A'                 }
    case 'BUS': return { bg: 'var(--error-bg)',           color: 'var(--error)'            }
    case 'ITN': return { bg: 'rgba(124,58,237,0.10)',    color: '#7C3AED'                 }
    default:    return { bg: 'var(--muted)',              color: 'var(--muted-foreground)' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

type SemCourse = { code: string; name: string; type: CourseType; credits: number }
type SemData   = { name: string; courses: SemCourse[] }
type YearData  = { year: number; semesters: SemData[] }

interface AddSlot      { yearNum: number; semName: string }
interface DeleteTarget { yearNum: number; semName: string; code: string; name: string }
interface EditTypeTarget { yearNum: number; semName: string; code: string }

// ─────────────────────────────────────────────────────────────────────────────

function ProgrammeDetailPage() {
  const { id } = Route.useSearch()
  const prog   = PROGRAMMES.find((p) => String(p.id) === id) ?? PROGRAMMES[0]

  const [openYears, setOpenYears]   = useState<number[]>([1])
  const [editMode, setEditMode]     = useState(false)
  const [progYears, setProgYears]   = useState<YearData[]>(() => prog.years)

  // Add course state
  const [addSlot, setAddSlot]           = useState<AddSlot | null>(null)
  const [addCode, setAddCode]           = useState('')
  const [addType, setAddType]           = useState<CourseType>('Compulsory')
  const [addError, setAddError]         = useState<string | null>(null)
  const [addWarning, setAddWarning]     = useState<string | null>(null)
  const [addWarningCode, setAddWarningCode] = useState('')

  // Edit type state (pencil inline)
  const [editTypeTarget, setEditTypeTarget] = useState<EditTypeTarget | null>(null)
  const [editTypeValue, setEditTypeValue]   = useState<CourseType>('Compulsory')

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const toggleYear = (y: number) =>
    setOpenYears((prev) => prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y])

  const statusColors = prog.status === 'Active'
    ? { bg: 'var(--success-bg)', color: 'var(--success)' }
    : { bg: 'var(--muted)',       color: 'var(--muted-foreground)' }

  const catalogueCourses = COURSES.filter((c) => c.status === 'Active')

  const getLecturer = (code: string) =>
    COURSES.find((c) => c.code === code)?.lecturer ?? 'Unassigned'

  // Find where a course already lives within this programme's local state
  const findCourseLocation = (code: string): { yearNum: number; semName: string } | null => {
    for (const yr of progYears) {
      for (const sem of yr.semesters) {
        if (sem.courses.some((c) => c.code === code)) {
          return { yearNum: yr.year, semName: sem.name }
        }
      }
    }
    return null
  }

  // Handle course selector change in add form
  const handleCourseSelect = (code: string) => {
    setAddError(null)
    setAddWarning(null)
    setAddWarningCode('')
    setAddCode(code)
    if (!code || !addSlot) return

    const existing = findCourseLocation(code)
    if (!existing) return

    if (existing.yearNum === addSlot.yearNum && existing.semName === addSlot.semName) {
      setAddError('This course is already in this semester.')
      return
    }
    if (existing.yearNum === addSlot.yearNum) {
      setAddError(`This course is already assigned to Year ${existing.yearNum} · ${existing.semName} in this programme.`)
      return
    }
    // Different year — show warning but allow
    setAddWarning(`This course is already assigned to Year ${existing.yearNum} · ${existing.semName}. Add it again?`)
    setAddWarningCode(code)
  }

  const doAddCourse = (code: string) => {
    if (!addSlot) return
    const found = COURSES.find((c) => c.code === code)
    if (!found) return
    const course: SemCourse = { code: found.code, name: found.name, type: addType, credits: found.credits }
    setProgYears((prev) => prev.map((yr) =>
      yr.year !== addSlot.yearNum ? yr : {
        ...yr,
        semesters: yr.semesters.map((sem) =>
          sem.name !== addSlot.semName ? sem : { ...sem, courses: [...sem.courses, course] }
        ),
      }
    ))
    resetAdd()
  }

  const resetAdd = () => {
    setAddSlot(null)
    setAddCode('')
    setAddType('Compulsory')
    setAddError(null)
    setAddWarning(null)
    setAddWarningCode('')
  }

  const openAddSlot = (yearNum: number, semName: string) => {
    setAddSlot({ yearNum, semName })
    setAddCode('')
    setAddType('Compulsory')
    setAddError(null)
    setAddWarning(null)
    setAddWarningCode('')
  }

  const saveTypeEdit = () => {
    if (!editTypeTarget) return
    setProgYears((prev) => prev.map((yr) =>
      yr.year !== editTypeTarget.yearNum ? yr : {
        ...yr,
        semesters: yr.semesters.map((sem) =>
          sem.name !== editTypeTarget.semName ? sem : {
            ...sem,
            courses: sem.courses.map((c) =>
              c.code !== editTypeTarget.code ? c : { ...c, type: editTypeValue }
            ),
          }
        ),
      }
    ))
    setEditTypeTarget(null)
  }

  const confirmRemove = () => {
    if (!deleteTarget) return
    setProgYears((prev) => prev.map((yr) =>
      yr.year !== deleteTarget.yearNum ? yr : {
        ...yr,
        semesters: yr.semesters.map((sem) =>
          sem.name !== deleteTarget.semName ? sem : {
            ...sem,
            courses: sem.courses.filter((c) => c.code !== deleteTarget.code),
          }
        ),
      }
    ))
    setDeleteTarget(null)
  }

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Programme"
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
          <Link to="/academic/programmes" className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--success)', textDecoration: 'none' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />Programmes
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{prog.name}</span>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{prog.name}</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{prog.department}</p>
          </div>
          <button
            onClick={() => { setEditMode((e) => !e); setEditTypeTarget(null); setAddSlot(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: editMode ? 'var(--foreground)' : 'var(--brand)', color: editMode ? 'var(--ink-foreground)' : 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            {editMode ? <><Check style={{ width: 14, height: 14 }} />Save changes</> : <><Pencil style={{ width: 14, height: 14 }} />Edit programme</>}
          </button>
        </div>

        {/* Overview card */}
        <div className="mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
          <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Programme Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <div>
              <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Department</p>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{prog.department}</p>
            </div>
            <div>
              <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Duration</p>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{prog.duration}</p>
            </div>
            <div>
              <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Total Credits</p>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{prog.totalCredits} credit units</p>
            </div>
            <div>
              <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Enrolled</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{prog.enrolled} students</p>
                <span className="t-label px-2 py-0.5" style={{ backgroundColor: statusColors.bg, color: statusColors.color, borderRadius: 'var(--radius-sm)' }}>{prog.status}</span>
              </div>
            </div>
          </div>
          {prog.description && (
            <p className="t-body mt-4" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: 16 }}>{prog.description}</p>
          )}
        </div>

        {/* Courses by year */}
        <h2 className="t-h2 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Courses by Year</h2>
        <div className="flex flex-col gap-4">
          {progYears.map((yr) => {
            const isOpen  = openYears.includes(yr.year)
            const totalCr = yr.semesters.reduce((acc, sem) => acc + sem.courses.reduce((a, c) => a + c.credits, 0), 0)

            return (
              <div key={yr.year} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>

                {/* Year accordion header */}
                <button
                  onClick={() => toggleYear(yr.year)}
                  className="w-full flex items-center justify-between px-6 py-4 transition-colors duration-150"
                  style={{ backgroundColor: isOpen ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                  onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Year {yr.year}</h3>
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{totalCr} credits</span>
                  </div>
                  {isOpen
                    ? <ChevronDown style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                    : <ChevronRight style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />}
                </button>

                {/* Semester sub-sections */}
                {isOpen && yr.semesters.map((sem, si) => {
                  const semCr = sem.courses.reduce((a, c) => a + c.credits, 0)
                  const isAddingHere = addSlot?.yearNum === yr.year && addSlot?.semName === sem.name
                  const selectedCourse = addCode ? COURSES.find((c) => c.code === addCode) : null
                  const showFields = !!addCode && !addError

                  return (
                    <div key={si} style={{ borderTop: '1px solid var(--border)' }}>

                      {/* Semester header */}
                      <div className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: 'rgba(241,245,249,0.6)', borderBottom: '1px solid var(--border)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{sem.name} · {semCr} credits</p>
                      </div>

                      {/* Course table */}
                      <div style={{ overflowX: 'auto', padding: '0 24px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {[
                                'Course Code', 'Course Name', 'Type', 'Credit Units', 'Assigned Lecturer', 'Status',
                                ...(editMode ? [''] : []),
                              ].map((h) => (
                                <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingTop: 12, paddingBottom: 8, paddingRight: 16, borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sem.courses.length === 0 ? (
                              <tr>
                                <td colSpan={editMode ? 7 : 6} className="text-center py-6 t-caption" style={{ color: 'var(--muted-foreground)' }}>
                                  No courses assigned yet
                                </td>
                              </tr>
                            ) : sem.courses.map((c, ci) => {
                              const typeColors = c.type === 'Compulsory'
                                ? { bg: 'var(--info-bg)', color: 'var(--info)' }
                                : { bg: 'var(--muted)',   color: 'var(--muted-foreground)' }
                              const cc  = courseCodeColor(c.code)
                              const lec = getLecturer(c.code)
                              const isEditingType = editTypeTarget?.code === c.code
                                && editTypeTarget.yearNum === yr.year
                                && editTypeTarget.semName === sem.name

                              return (
                                <tr key={ci}
                                  style={{ borderBottom: ci < sem.courses.length - 1 ? '1px solid var(--border)' : 'none' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  {/* Course Code */}
                                  <td style={{ padding: '11px 16px 11px 0' }}>
                                    <span style={{ backgroundColor: cc.bg, color: cc.color, borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', padding: '2px 6px' }}>{c.code}</span>
                                  </td>
                                  {/* Course Name */}
                                  <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '11px 16px 11px 0', whiteSpace: 'nowrap' }}>{c.name}</td>
                                  {/* Type */}
                                  <td style={{ padding: '11px 16px 11px 0' }}>
                                    {editMode && isEditingType ? (
                                      <select
                                        value={editTypeValue}
                                        onChange={(e) => setEditTypeValue(e.target.value as CourseType)}
                                        className="text-sm rounded-lg px-2 h-7 outline-none"
                                        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                                        autoFocus
                                      >
                                        <option value="Compulsory">Compulsory</option>
                                        <option value="Elective">Elective</option>
                                      </select>
                                    ) : (
                                      <span className="t-label px-2 py-0.5" style={{ backgroundColor: typeColors.bg, color: typeColors.color, borderRadius: 'var(--radius-sm)' }}>{c.type}</span>
                                    )}
                                  </td>
                                  {/* Credits */}
                                  <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '11px 16px 11px 0', whiteSpace: 'nowrap' }}>{c.credits} cr</td>
                                  {/* Lecturer */}
                                  <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '11px 16px 11px 0', whiteSpace: 'nowrap', minWidth: 160 }}>{lec}</td>
                                  {/* Status */}
                                  <td style={{ padding: '11px 16px 11px 0' }}>
                                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Active</span>
                                  </td>
                                  {/* Edit mode actions */}
                                  {editMode && (
                                    <td style={{ padding: '11px 0', whiteSpace: 'nowrap' }}>
                                      {isEditingType ? (
                                        <div className="flex items-center gap-0.5">
                                          <button
                                            onClick={saveTypeEdit}
                                            title="Save"
                                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                                            style={{ width: 26, height: 26, color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: 'none', cursor: 'pointer' }}
                                          ><Check style={{ width: 12, height: 12 }} /></button>
                                          <button
                                            onClick={() => setEditTypeTarget(null)}
                                            title="Cancel"
                                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                                            style={{ width: 26, height: 26, color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                          ><X style={{ width: 12, height: 12 }} /></button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-0.5">
                                          <button
                                            onClick={() => { setEditTypeTarget({ yearNum: yr.year, semName: sem.name, code: c.code }); setEditTypeValue(c.type) }}
                                            title="Edit type"
                                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                                            style={{ width: 26, height: 26, color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                                          ><Pencil style={{ width: 12, height: 12 }} /></button>
                                          <button
                                            onClick={() => setDeleteTarget({ yearNum: yr.year, semName: sem.name, code: c.code, name: c.name })}
                                            title="Remove from semester"
                                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                                            style={{ width: 26, height: 26, color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)'; e.currentTarget.style.color = 'var(--error)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                                          ><Trash2 style={{ width: 12, height: 12 }} /></button>
                                        </div>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Add course section — edit mode only */}
                      {editMode && (
                        <div style={{ padding: '12px 24px 20px' }}>
                          {isAddingHere ? (
                            <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>

                              {/* Course selector */}
                              <div>
                                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Select course from catalogue</label>
                                <select
                                  value={addCode}
                                  onChange={(e) => handleCourseSelect(e.target.value)}
                                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                                  style={{ border: `1px solid ${addError ? 'var(--error)' : 'var(--border)'}`, backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
                                >
                                  <option value="">Select from catalogue…</option>
                                  {catalogueCourses.map((c) => (
                                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                                  ))}
                                </select>
                                {addError && (
                                  <p className="t-caption mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                                    <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />{addError}
                                  </p>
                                )}
                              </div>

                              {/* Duplicate-in-different-year warning */}
                              {addWarning && !addError && (
                                <div className="flex flex-col gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(202,138,4,0.25)' }}>
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle style={{ width: 14, height: 14, color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                                    <p className="text-xs font-medium" style={{ color: 'var(--warning)' }}>{addWarning}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => doAddCourse(addWarningCode)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                                      style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                                    >Add anyway</button>
                                    <button
                                      onClick={() => { setAddWarning(null); setAddWarningCode(''); setAddCode('') }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
                                      style={{ border: '1px solid rgba(202,138,4,0.4)', color: 'var(--warning)', backgroundColor: 'transparent', cursor: 'pointer' }}
                                    >Cancel</button>
                                  </div>
                                </div>
                              )}

                              {/* Auto-filled read-only fields + editable Type */}
                              {showFields && selectedCourse && (
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Course Code — read-only */}
                                  <div>
                                    <label className="t-label mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Course Code</label>
                                    <input
                                      readOnly value={selectedCourse.code}
                                      className="w-full text-sm rounded-lg px-3 h-8 outline-none"
                                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--border)', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', cursor: 'default' }}
                                    />
                                  </div>
                                  {/* Credit Units — read-only */}
                                  <div>
                                    <label className="t-label mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Credit Units</label>
                                    <input
                                      readOnly value={`${selectedCourse.credits} cr`}
                                      className="w-full text-sm rounded-lg px-3 h-8 outline-none"
                                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--border)', color: 'var(--muted-foreground)', cursor: 'default' }}
                                    />
                                  </div>
                                  {/* Course Name — read-only, spans 2 cols */}
                                  <div className="col-span-2">
                                    <label className="t-label mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Course Name</label>
                                    <input
                                      readOnly value={selectedCourse.name}
                                      className="w-full text-sm rounded-lg px-3 h-8 outline-none"
                                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--border)', color: 'var(--muted-foreground)', cursor: 'default' }}
                                    />
                                  </div>
                                  {/* Type — editable */}
                                  <div>
                                    <label className="t-label mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Type <span style={{ color: 'var(--brand)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>editable</span></label>
                                    <select
                                      value={addType}
                                      onChange={(e) => setAddType(e.target.value as CourseType)}
                                      className="w-full text-sm rounded-lg px-3 h-8 outline-none"
                                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
                                    >
                                      <option value="Compulsory">Compulsory</option>
                                      <option value="Elective">Elective</option>
                                    </select>
                                  </div>
                                  {/* Assigned Lecturer — read-only */}
                                  <div>
                                    <label className="t-label mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Assigned Lecturer</label>
                                    <input
                                      readOnly value={selectedCourse.lecturer || 'Unassigned'}
                                      className="w-full text-sm rounded-lg px-3 h-8 outline-none"
                                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--border)', color: 'var(--muted-foreground)', cursor: 'default' }}
                                    />
                                    <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                      Lecturer auto-assigned from course catalogue. To change, update the course in the catalogue.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Helper text */}
                              <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                                Can't find the course? Go to{' '}
                                <Link
                                  to="/academic/courses"
                                  className="font-medium transition-opacity hover:opacity-70"
                                  style={{ color: '#16A34A', textDecoration: 'none' }}
                                >
                                  Manage Courses
                                </Link>
                                {' '}to create a new one.
                              </p>

                              {/* Action buttons — only shown when no warning (warning has its own buttons) */}
                              {!addWarning && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={resetAdd}
                                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
                                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                  >Cancel</button>
                                  <button
                                    onClick={() => doAddCourse(addCode)}
                                    disabled={!addCode || !!addError}
                                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
                                    style={{
                                      backgroundColor: (!addCode || !!addError) ? 'var(--muted)' : 'var(--brand)',
                                      color: (!addCode || !!addError) ? 'var(--muted-foreground)' : 'var(--brand-ink)',
                                      border: 'none', cursor: (!addCode || !!addError) ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={(e) => { if (addCode && !addError) e.currentTarget.style.opacity = '0.9' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                                  >Add</button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => openAddSlot(yr.year, sem.name)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
                              style={{ border: '1px solid var(--brand)', color: 'var(--brand)', backgroundColor: 'transparent', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(32,244,78,0.06)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                            >
                              <Plus style={{ width: 14, height: 14 }} />Add course to {sem.name}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

      </div>

      {/* Remove course AlertDialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.code}</strong> from <strong>{deleteTarget?.semName}</strong>? The course will remain in the course catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppShell>
  )
}
