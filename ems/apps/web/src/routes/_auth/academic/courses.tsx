import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import type { AcademicCourseRow, CreateAcademicCourseRequest } from '@stackedu/shared'
import { LECTURER_ASSIGNMENT_REQUIRES_SEMESTER } from '@stackedu/shared'
import { Pencil, Archive, Plus, Trash2, Upload } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FileTooLargeDialog, useOversizeUpload } from '@/components/FileTooLargeDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { IconActionButton } from '@/components/IconActionButton'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import { DepartmentPicker } from '@/components/DepartmentPicker'
import {
  academicCoursesQueryKey,
  academicDepartmentsQueryKey,
  academicLecturersQueryKey,
  academicSemestersQueryKey,
  bulkCreateAcademicCourses,
  createAcademicCourse,
  deleteAcademicCourse,
  listAcademicCourses,
  listAcademicDepartments,
  listAcademicLecturers,
  listAcademicSemesters,
  updateAcademicCourse,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { parseCourseSpreadsheet } from '@/lib/parse-course-spreadsheet'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/academic/courses')({
  component: CoursesCataloguePage,
})

type CourseFormData = {
  code: string
  name: string
  department: string
  credits: number
  type: 'Compulsory' | 'Elective'
  description: string
  prerequisites: string[]
  semesterId: string
  lecturerId: string
  status: 'Active' | 'Inactive'
  openForRegistration: boolean
}

function blankForm(): CourseFormData {
  return {
    code: '',
    name: '',
    department: '',
    credits: 3,
    type: 'Compulsory',
    description: '',
    prerequisites: [],
    semesterId: '',
    lecturerId: '',
    status: 'Active',
    openForRegistration: true,
  }
}

function yearOfStudyForType(type: 'Compulsory' | 'Elective'): number {
  return type === 'Compulsory' ? 1 : 2
}

function defaultSemesterId(semesters: { id: string; isCurrent: boolean }[]): string {
  return semesters.find((semester) => semester.isCurrent)?.id ?? ''
}

function CoursesCataloguePage() {
  const queryClient = useQueryClient()
  const coursesQuery = useQuery({ queryKey: academicCoursesQueryKey, queryFn: listAcademicCourses })
  const lecturersQuery = useQuery({ queryKey: academicLecturersQueryKey, queryFn: listAcademicLecturers })
  const semestersQuery = useQuery({ queryKey: academicSemestersQueryKey, queryFn: listAcademicSemesters })
  const departmentsQuery = useQuery({ queryKey: academicDepartmentsQueryKey, queryFn: listAcademicDepartments })

  const courses = coursesQuery.data ?? []
  const lecturers = lecturersQuery.data ?? []
  const semesters = semestersQuery.data ?? []
  const departmentNames = (departmentsQuery.data ?? []).map((d) => d.name)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicCourseRow | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AcademicCourseRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AcademicCourseRow | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)
  const [form, setForm] = useState<CourseFormData>(() => blankForm())
  const [prereqInput, setPrereqInput] = useState('')
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [parsedImport, setParsedImport] = useState<CreateAcademicCourseRequest[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { oversizeFile, setOversizeFile, takeFile } = useOversizeUpload()

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim()) throw new Error('Course code is required.')
      if (!form.name.trim()) throw new Error('Course name is required.')
      if (!form.credits || form.credits < 1) throw new Error('Credits must be at least 1.')

      const yearOfStudy = yearOfStudyForType(form.type)
      const prerequisiteCodes = form.prerequisites.filter(Boolean)
      const lecturerId = form.lecturerId || undefined
      const semesterId = form.semesterId || undefined

      if (editing) {
        return updateAcademicCourse(editing.id, {
          code: form.code.trim(),
          name: form.name.trim(),
          departmentName: form.department.trim() || undefined,
          credits: form.credits,
          yearOfStudy,
          description: form.description.trim() || null,
          isActive: form.status === 'Active',
          prerequisiteCodes,
          lecturerId: form.lecturerId || null,
          semesterId,
          openForRegistration: form.openForRegistration,
        })
      }

      return createAcademicCourse({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        departmentName: form.department.trim(),
        credits: form.credits,
        yearOfStudy,
        description: form.description.trim() || undefined,
        prerequisiteCodes: prerequisiteCodes.length > 0 ? prerequisiteCodes : undefined,
        lecturerId,
        semesterId,
        openForRegistration: form.openForRegistration,
      })
    },
    onSuccess: async () => {
      toast.success(editing ? 'Course updated.' : 'Course created.')
      setSheetOpen(false)
      setConfirmSave(false)
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: academicCoursesQueryKey })
      await queryClient.invalidateQueries({ queryKey: academicDepartmentsQueryKey })
    },
    onError: (err) => {
      setConfirmSave(false)
      toast.error(apiErrorMessage(err, 'Could not save course.'))
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (course: AcademicCourseRow) => updateAcademicCourse(course.id, { isActive: false }),
    onSuccess: async () => {
      toast.success('Course archived.')
      setArchiveTarget(null)
      await queryClient.invalidateQueries({ queryKey: academicCoursesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not archive course.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (course: AcademicCourseRow) => deleteAcademicCourse(course.id),
    onSuccess: async () => {
      toast.success('Course deleted.')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: academicCoursesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete course.')),
  })

  const bulkImportMutation = useMutation({
    mutationFn: (rows: CreateAcademicCourseRequest[]) => bulkCreateAcademicCourses({ courses: rows }),
    onSuccess: async (result) => {
      setConfirmImport(false)
      if (result.created === 0) {
        const firstError = result.failed[0]?.error
        toast.error(firstError ? `No courses were imported. ${firstError}` : 'No courses were imported. Check your file and try again.')
        if (result.failed.length > 1) {
          toast.warning(`${result.failed.length} rows could not be imported.`)
        }
        return
      }
      toast.success(`Imported ${result.created} course${result.created === 1 ? '' : 's'}.`)
      if (result.failed.length > 0) {
        toast.warning(
          `${result.failed.length} row${result.failed.length === 1 ? '' : 's'} could not be imported${result.failed[0]?.error ? `: ${result.failed[0].error}` : '.'}`,
        )
      }
      setImportFileName(null)
      setParsedImport([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      await queryClient.invalidateQueries({ queryKey: academicCoursesQueryKey })
      await queryClient.invalidateQueries({ queryKey: academicDepartmentsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not import courses.')),
  })

  const handleImportFile = async (file: File | null) => {
    if (!file) return
    takeFile(file, (next) => { void parseImportFile(next) })
  }

  const parseImportFile = async (file: File) => {
    try {
      const rows = await parseCourseSpreadsheet(file, '')
      if (rows.length === 0) {
        toast.error('No valid course rows found in that file.')
        setImportFileName(null)
        setParsedImport([])
        return
      }
      setImportFileName(file.name)
      setParsedImport(rows)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not read that file.')
      setImportFileName(null)
      setParsedImport([])
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ ...blankForm(), semesterId: defaultSemesterId(semesters) })
    setPrereqInput('')
    setImportFileName(null)
    setParsedImport([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setSheetOpen(true)
  }

  const openEdit = (c: AcademicCourseRow) => {
    setEditing(c)
    setForm({
      code: c.code,
      name: c.name,
      department: c.department,
      credits: c.credits,
      type: c.type,
      description: c.description ?? '',
      prerequisites: c.prerequisites,
      semesterId: c.semesterId ?? defaultSemesterId(semesters),
      lecturerId: c.lecturerId ?? '',
      status: c.status === 'Active' ? 'Active' : 'Inactive',
      openForRegistration: c.openForRegistration ?? true,
    })
    setPrereqInput('')
    setSheetOpen(true)
  }

  const addPrerequisite = () => {
    const code = prereqInput.trim().toUpperCase()
    if (!code || form.prerequisites.includes(code)) return
    setForm((f) => ({ ...f, prerequisites: [...f.prerequisites, code] }))
    setPrereqInput('')
  }

  const removePrerequisite = (code: string) => {
    setForm((f) => ({ ...f, prerequisites: f.prerequisites.filter((p) => p !== code) }))
  }

  const inputStyle = { border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }

  return (
    <AcademicShell pageTitle="Courses">
      <div className="page-body animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Course Catalogue</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {coursesQuery.isPending ? 'Loading…' : `${courses.filter((c) => c.status === 'Active').length} active courses`}
            </p>
          </div>
          <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
            <Plus style={{ width: 15, height: 15 }} />Add course
          </button>
        </div>

        {coursesQuery.error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(coursesQuery.error, 'Could not load courses.')}</p>
        ) : null}

        <DataTable
          rows={courses}
          rowKey={(c) => c.id}
          searchPlaceholder="Search course name or code…"
          searchFilter={(c, query) => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)}
          filters={[
            { id: 'department', label: 'departments', getValue: (c) => c.department },
            { id: 'status', label: 'statuses', getValue: (c) => c.status },
          ]}
          empty={coursesQuery.isPending ? 'Loading courses…' : 'No courses found'}
          defaultPageSize={10}
          columns={[
            { id: 'code', header: 'Code', value: (c) => c.code, cell: (c) => <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{c.code}</span> },
            { id: 'name', header: 'Course Name', value: (c) => c.name, cell: (c) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)', minWidth: 200, display: 'inline-block' }}>{c.name}</span> },
            { id: 'department', header: 'Department', value: (c) => c.department, cell: (c) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{c.department}</span> },
            { id: 'credits', header: 'Credits', value: (c) => c.credits, cell: (c) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.credits}</span> },
            {
              id: 'type', header: 'Type', value: (c) => c.type,
              cell: (c) => {
                const typeColors = c.type === 'Compulsory'
                  ? { bg: 'var(--info-bg)', color: 'var(--info)' }
                  : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: typeColors.bg, color: typeColors.color, borderRadius: 'var(--radius-sm)' }}>{c.type}</span>
              },
            },
            { id: 'lecturer', header: 'Assigned Lecturer', value: (c) => c.lecturerName ?? '', cell: (c) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{c.lecturerName ?? '—'}</span> },
            {
              id: 'registration',
              header: 'Registration',
              value: (c) => (c.semesterId ? ((c.openForRegistration ?? true) ? 'Open' : 'Closed') : ''),
              cell: (c) => {
                if (!c.semesterId) {
                  return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
                }
                const open = c.openForRegistration ?? true
                return (
                  <span
                    className="t-label px-2 py-0.5"
                    style={{
                      backgroundColor: open ? 'var(--success-bg)' : 'var(--muted)',
                      color: open ? 'var(--success)' : 'var(--muted-foreground)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {open ? 'Open' : 'Closed'}
                  </span>
                )
              },
            },
            { id: 'enrolled', header: 'Enrolled', value: (c) => c.enrolled, cell: (c) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{c.enrolled}</span> },
            {
              id: 'status', header: 'Status', value: (c) => c.status,
              cell: (c) => {
                const statusColors = c.status === 'Active'
                  ? { bg: 'var(--success-bg)', color: 'var(--success)' }
                  : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: statusColors.bg, color: statusColors.color, borderRadius: 'var(--radius-sm)' }}>{c.status}</span>
              },
            },
            {
              id: 'actions', header: '', className: 'text-right',
              cell: (c) => (
                <div className="flex items-center gap-2">
                  <IconActionButton label="Edit course" icon={Pencil} onClick={() => openEdit(c)} />
                  {c.status === 'Active' ? (
                    <IconActionButton label="Archive course" icon={Archive} onClick={() => setArchiveTarget(c)} />
                  ) : null}
                  {c.enrolled === 0 ? (
                    <IconActionButton label="Delete course" icon={Trash2} danger onClick={() => setDeleteTarget(c)} />
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConfirmAlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title={`Archive ${archiveTarget?.code}?`}
        tone="warning"
        headlineLabel="Action"
        headline="Archive course"
        summary="This will mark the course as inactive."
        notices={[
          { icon: 'archive', label: 'Students already enrolled will remain on record.' },
          { icon: 'info', label: 'The course will no longer appear as active for new registrations.' },
        ]}
        confirmLabel={archiveMutation.isPending ? 'Archiving…' : 'Archive'}
        confirmVariant="warning"
        loading={archiveMutation.isPending}
        onConfirm={() => { if (archiveTarget) archiveMutation.mutate(archiveTarget) }}
      />

      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Delete ${deleteTarget?.code}?`}
        tone="destructive"
        headlineLabel="Action"
        headline="Delete course"
        summary="This permanently removes the course from the catalogue."
        notices={[
          { icon: 'trash', label: 'The course record and any semester offerings with no enrolments will be removed.' },
          { icon: 'info', label: 'Courses with enrolled students cannot be deleted — archive them instead.' },
        ]}
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget) }}
      />

      <ConfirmAlertDialog
        open={confirmSave}
        onOpenChange={(open) => { if (!open) setConfirmSave(false) }}
        title={editing ? 'Save these course changes?' : 'Create this course?'}
        tone="success"
        headlineLabel="Action"
        headline={editing ? 'Update course' : 'Create course'}
        summary={`${form.code.trim()} ${form.name.trim()} will be saved in ${form.department.trim()}.`}
        notices={[
          { icon: 'info', label: 'The course will appear in the catalogue for this institution.' },
          ...(form.lecturerId && form.semesterId
            ? [{ icon: 'user' as const, label: 'The assigned lecturer will be linked to this course for the selected semester.' }]
            : form.lecturerId
              ? [{ icon: 'info' as const, label: LECTURER_ASSIGNMENT_REQUIRES_SEMESTER }]
              : []),
          ...(form.semesterId
            ? [{
                icon: 'info' as const,
                label: form.openForRegistration
                  ? 'Students can tick this course while semester registration is open.'
                  : 'This course will stay closed for registration even if the semester is open.',
              }]
            : []),
        ]}
        confirmLabel={saveMutation.isPending ? 'Saving…' : 'Confirm'}
        confirmVariant="brand"
        loading={saveMutation.isPending}
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => saveMutation.mutate()}
      />

      <ConfirmAlertDialog
        open={confirmImport}
        onOpenChange={(open) => { if (!open) setConfirmImport(false) }}
        title={`Import ${parsedImport.length} course${parsedImport.length === 1 ? '' : 's'}?`}
        tone="success"
        headlineLabel="Action"
        headline="Bulk import"
        summary="Courses in the file will be added to the catalogue."
        notices={[
          { icon: 'file', label: 'Rows with a code that already exists will be skipped.' },
          { icon: 'info', label: 'A new department name in the file will be created if it does not exist.' },
        ]}
        confirmLabel={bulkImportMutation.isPending ? 'Importing…' : 'Import'}
        confirmVariant="brand"
        loading={bulkImportMutation.isPending}
        onCancel={() => setConfirmImport(false)}
        onConfirm={() => bulkImportMutation.mutate(parsedImport)}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {editing ? `Edit Course — ${editing.code}` : 'Add Course'}
            </SheetTitle>
            <FormInfoBox lines={editing ? formInfo.editCourse : formInfo.addCourse} />
          </SheetHeader>
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Course Code">
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                  placeholder="CSC101"
                />
              </FormField>
              <FormField label="Credit Units">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.credits}
                  onChange={(e) => setForm((f) => ({ ...f, credits: Number.parseInt(e.target.value, 10) || 0 }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                />
              </FormField>
            </div>
            <FormField label="Course Name" className="mb-4">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={inputStyle}
                placeholder="Introduction to Programming"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Department">
                <DepartmentPicker
                  value={form.department}
                  onChange={(department) => setForm((f) => ({ ...f, department }))}
                  departments={departmentNames}
                />
                <p className="t-caption mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Choose a department from the list, or add a new one in the dropdown. A new name is created when you save.
                </p>
              </FormField>
              <FormField label="Type">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'Compulsory' | 'Elective' }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                >
                  <option value="Compulsory">Compulsory</option>
                  <option value="Elective">Elective</option>
                </select>
              </FormField>
            </div>
            <FormField label="Description" className="mb-4">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                style={inputStyle}
                placeholder="Optional course description"
              />
            </FormField>
            <FormField label="Prerequisites" className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  value={prereqInput}
                  onChange={(e) => setPrereqInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPrerequisite() } }}
                  className="flex-1 text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                  placeholder="Course code, press Enter"
                />
                <button type="button" onClick={addPrerequisite} className="px-3 h-9 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}>Add</button>
              </div>
              {form.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.prerequisites.map((code) => (
                    <span key={code} className="t-label px-2 py-1 flex items-center gap-1" style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                      {code}
                      <button type="button" onClick={() => removePrerequisite(code)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 12, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No prerequisites</p>
              )}
            </FormField>
            {!editing ? (
              <FormField label="Bulk import (Excel)" className="mb-4">
                <div
                  className="rounded-xl p-4"
                  style={{ border: '1px dashed var(--border)', backgroundColor: 'var(--muted)' }}
                >
                  <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
                    Upload a .csv or .xlsx file of 14 MB or less with columns: Code, Name, Department, Credits, Type (optional), Description, Prerequisites. Each row needs its own department. A new department name is created if it does not exist.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        event.target.value = ''
                        void handleImportFile(file)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                    >
                      <Upload style={{ width: 14, height: 14 }} />
                      Choose file
                    </button>
                    <button
                      type="button"
                      disabled={parsedImport.length === 0 || bulkImportMutation.isPending}
                      onClick={() => {
                        if (parsedImport.length > 0) setConfirmImport(true)
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: 'var(--brand)',
                        color: 'var(--brand-ink)',
                        border: 'none',
                        cursor: parsedImport.length === 0 || bulkImportMutation.isPending ? 'not-allowed' : 'pointer',
                        opacity: parsedImport.length === 0 || bulkImportMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {bulkImportMutation.isPending ? 'Importing…' : 'Import courses'}
                    </button>
                  </div>
                  {importFileName ? (
                    <p className="t-caption mt-2" style={{ color: 'var(--success)' }}>
                      {importFileName} — {parsedImport.length} course{parsedImport.length === 1 ? '' : 's'} ready to import
                    </p>
                  ) : null}
                </div>
              </FormField>
            ) : null}
            <FormField label="Semester" className="mb-4">
              <select
                value={form.semesterId}
                onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value }))}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={inputStyle}
              >
                <option value="">Select semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.label}{semester.isCurrent ? ' (current)' : ''}
                  </option>
                ))}
              </select>
              {semesters.length === 0 ? (
                <p className="t-caption mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Add semesters in the academic calendar first. A semester is only required when assigning a lecturer.
                </p>
              ) : form.lecturerId && !form.semesterId ? (
                <p className="t-caption mt-1.5" style={{ color: 'var(--warning)' }}>
                  {LECTURER_ASSIGNMENT_REQUIRES_SEMESTER}
                </p>
              ) : null}
            </FormField>
            <FormField label="Assigned Lecturer" className="mb-4">
              <select
                value={form.lecturerId}
                onChange={(e) => setForm((f) => ({ ...f, lecturerId: e.target.value }))}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={inputStyle}
              >
                <option value="">Select lecturer</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {lecturers.length === 0 ? (
                <p className="t-caption mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  No lecturers yet. ICT must add a lecturer account first.
                </p>
              ) : null}
            </FormField>
            <FormField label="Open for registration" className="mb-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="course-open-for-registration"
                  checked={form.openForRegistration}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, openForRegistration: checked }))}
                  className="data-[state=checked]:bg-[var(--brand)]"
                />
                <Label htmlFor="course-open-for-registration" className="text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
                  {form.openForRegistration ? 'Open' : 'Closed'}
                </Label>
              </div>
              <p className="t-caption mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Semester registration is opened on Calendar. This switch opens or closes this course for students to tick.
              </p>
              {form.openForRegistration === false && !form.semesterId ? (
                <p className="t-caption mt-1.5" style={{ color: 'var(--warning)' }}>
                  Choose a semester to close this course for registration.
                </p>
              ) : null}
            </FormField>
            {editing ? (
              <FormField label="Status" className="mb-8">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </FormField>
            ) : (
              <div className="mb-8" />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (!form.code.trim()) {
                    toast.error('Course code is required.')
                    return
                  }
                  if (!form.name.trim()) {
                    toast.error('Course name is required.')
                    return
                  }
                  if (!form.credits || form.credits < 1) {
                    toast.error('Credits must be at least 1.')
                    return
                  }
                  if (!form.department.trim()) {
                    toast.error('Department is required.')
                    return
                  }
                  if (form.lecturerId && !form.semesterId) {
                    toast.error(LECTURER_ASSIGNMENT_REQUIRES_SEMESTER)
                    return
                  }
                  if (!form.openForRegistration && !form.semesterId) {
                    toast.error('Choose a semester to close a course for registration.')
                    return
                  }
                  setConfirmSave(true)
                }}
                disabled={saveMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', opacity: saveMutation.isPending ? 0.7 : 1 }}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <FileTooLargeDialog
        file={oversizeFile}
        onAccept={(next) => {
          setOversizeFile(null)
          void parseImportFile(next)
        }}
        onClose={() => setOversizeFile(null)}
      />
    </AcademicShell>
  )
}

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      {children}
    </div>
  )
}
