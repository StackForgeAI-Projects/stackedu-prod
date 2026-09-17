import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { AcademicProgrammeRow } from '@stackedu/shared'
import { Eye, Pencil, Trash2, Plus } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Switch } from '@/components/ui/switch'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import {
  academicDepartmentsQueryKey,
  academicProgrammesQueryKey,
  createAcademicProgramme,
  listAcademicDepartments,
  listAcademicProgrammes,
  updateAcademicProgramme,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'
import { DepartmentPicker } from '@/components/DepartmentPicker'

export const Route = createFileRoute('/_auth/academic/programmes')({
  component: ProgrammesPage,
})

function parseDurationYears(duration: string): number {
  const match = duration.match(/\d+/)
  const years = match ? Number.parseInt(match[0], 10) : 3
  return Number.isFinite(years) && years >= 1 ? years : 3
}

function deptBadgeColors(dept: string) {
  if (dept.includes('Computer') || dept.includes('Computing')) return { bg: 'var(--info-bg)', color: 'var(--info)' }
  if (dept.includes('Math') || dept.includes('Science')) return { bg: 'rgba(var(--brand-rgb),0.10)', color: '#16A34A' }
  if (dept.includes('Engineer') || dept.includes('Mechanical')) return { bg: 'rgba(124,58,237,0.10)', color: '#7C3AED' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function ProgrammesPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: academicProgrammesQueryKey,
    queryFn: listAcademicProgrammes,
  })
  const departmentsQuery = useQuery({
    queryKey: academicDepartmentsQueryKey,
    queryFn: listAcademicDepartments,
  })

  const programmes = data ?? []
  const departmentNames = (departmentsQuery.data ?? []).map((d) => d.name)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editProg, setEditProg] = useState<AcademicProgrammeRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AcademicProgrammeRow | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [form, setForm] = useState({
    name: '', department: '', duration: '', totalCredits: '', description: '', status: true,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalCredits = Number.parseInt(form.totalCredits, 10)
      if (!form.name.trim()) throw new Error('Programme name is required.')
      if (!Number.isFinite(totalCredits) || totalCredits < 1) throw new Error('Total credits must be a positive number.')

      const durationYears = parseDurationYears(form.duration)

      if (editProg) {
        return updateAcademicProgramme(editProg.id, {
          name: form.name.trim(),
          departmentName: form.department.trim(),
          durationYears,
          totalCredits,
          isActive: form.status,
        })
      }

      return createAcademicProgramme({
        name: form.name.trim(),
        departmentName: form.department.trim(),
        durationYears,
        totalCredits,
      })
    },
    onSuccess: async () => {
      toast.success(editProg ? 'Programme updated.' : 'Programme created.')
      setSheetOpen(false)
      setConfirmSave(false)
      setEditProg(null)
      await queryClient.invalidateQueries({ queryKey: academicProgrammesQueryKey })
      await queryClient.invalidateQueries({ queryKey: academicDepartmentsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save programme.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (prog: AcademicProgrammeRow) => updateAcademicProgramme(prog.id, { isActive: false }),
    onSuccess: async () => {
      toast.success('Programme deactivated.')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: academicProgrammesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete programme.')),
  })

  const openAdd = () => {
    setEditProg(null)
    setForm({
      name: '',
      department: '',
      duration: '3 years',
      totalCredits: '120',
      description: '',
      status: true,
    })
    setSheetOpen(true)
  }

  const openEdit = (p: AcademicProgrammeRow) => {
    setEditProg(p)
    setForm({
      name: p.name,
      department: p.department,
      duration: p.duration,
      totalCredits: String(p.totalCredits),
      description: p.description ?? '',
      status: p.status === 'Active',
    })
    setSheetOpen(true)
  }

  const requestSave = () => {
    if (!form.name.trim()) {
      toast.error('Programme name is required.')
      return
    }
    if (!form.department.trim()) {
      toast.error('Department is required.')
      return
    }
    const totalCredits = Number.parseInt(form.totalCredits, 10)
    if (!Number.isFinite(totalCredits) || totalCredits < 1) {
      toast.error('Total credits must be a positive number.')
      return
    }
    setConfirmSave(true)
  }

  const inputStyle = { border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }

  return (
    <AcademicShell pageTitle="Programmes">
      <div className="page-body animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Programmes</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {isPending ? 'Loading…' : `${programmes.filter((p) => p.status === 'Active').length} active programmes`}
            </p>
          </div>
          <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
            <Plus style={{ width: 15, height: 15 }} />Add programme
          </button>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load programmes.')}</p>
        ) : null}

        <DataTable
          rows={programmes}
          rowKey={(prog) => prog.id}
          searchPlaceholder="Search by programme name…"
          searchFilter={(p, query) => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)}
          filters={[{ id: 'department', label: 'departments', getValue: (p) => p.department }]}
          empty={isPending ? 'Loading programmes…' : 'No programmes found'}
          columns={[
            { id: 'name', header: 'Programme Name', value: (prog) => prog.name, cell: (prog) => <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{prog.name}</span> },
            {
              id: 'department', header: 'Department', value: (prog) => prog.department,
              cell: (prog) => {
                const dc = deptBadgeColors(prog.department)
                return <span className="t-label px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: dc.bg, color: dc.color, borderRadius: 'var(--radius-sm)' }}>{prog.department}</span>
              },
            },
            { id: 'duration', header: 'Duration', value: (prog) => prog.duration, cell: (prog) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{prog.duration}</span> },
            { id: 'credits', header: 'Credits / Units', value: (prog) => prog.totalCredits, cell: (prog) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{prog.totalCredits} cr</span> },
            { id: 'enrolled', header: 'Enrolled', value: (prog) => prog.enrolled, cell: (prog) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{prog.enrolled}</span> },
            {
              id: 'status', header: 'Status', value: (prog) => prog.status,
              cell: (prog) => {
                const sc = prog.status === 'Active'
                  ? { bg: 'var(--success-bg)', color: 'var(--success)' }
                  : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{prog.status}</span>
              },
            },
            {
              id: 'actions', header: '', className: 'text-right',
              cell: (prog) => (
                <div className="flex items-center gap-0.5">
                  <Link to="/academic/programme" search={{ id: prog.id }}>
                    <button type="button" title="View" className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Eye style={{ width: 14, height: 14 }} />
                    </button>
                  </Link>
                  <button type="button" onClick={() => openEdit(prog)} title="Edit" className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, color: 'var(--muted-foreground)', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(prog)} title="Delete" className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, color: 'var(--error)', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Delete ${deleteTarget?.name}?`}
        tone="destructive"
        headlineLabel="Action"
        headline="Deactivate programme"
        summary="This will deactivate the programme."
        notices={[
          { icon: 'user', label: 'Enrolled students will remain on record.' },
          { icon: 'info', label: 'The programme will no longer appear as active.' },
        ]}
        caution="This cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget) }}
      />

      <ConfirmAlertDialog
        open={confirmSave}
        onOpenChange={(open) => { if (!open) setConfirmSave(false) }}
        title={editProg ? 'Save these programme changes?' : 'Create this programme?'}
        tone="success"
        headlineLabel="Action"
        headline={editProg ? 'Update programme' : 'Create programme'}
        summary={
          editProg
            ? `${form.name.trim()} will be updated in ${form.department.trim()}.`
            : `${form.name.trim()} will be created in ${form.department.trim()}.`
        }
        notices={[
          { icon: 'info', label: 'This programme will appear in admissions choices when it is active.' },
          { icon: 'file', label: 'If this department does not exist yet, it will be created.' },
        ]}
        confirmLabel={saveMutation.isPending ? 'Saving…' : 'Confirm'}
        confirmVariant="brand"
        loading={saveMutation.isPending}
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => saveMutation.mutate()}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {editProg ? 'Edit Programme' : 'Add Programme'}
            </SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-4">
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Programme Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={inputStyle}
                placeholder="e.g. BSc Computer Science"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Department</label>
              <DepartmentPicker
                value={form.department}
                onChange={(department) => setForm((f) => ({ ...f, department }))}
                departments={departmentNames}
              />
              <p className="t-caption mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Choose a department from the list, or add a new one in the dropdown. A new name is created when you save.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Duration</label>
                <input
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                  placeholder="3 years"
                />
              </div>
              <div>
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Total Credits</label>
                <input
                  type="number"
                  min={1}
                  value={form.totalCredits}
                  onChange={(e) => setForm((f) => ({ ...f, totalCredits: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                  placeholder="120"
                />
              </div>
            </div>
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                style={inputStyle}
                placeholder="Optional programme description"
              />
            </div>
            {editProg ? (
              <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Status</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{form.status ? 'Active' : 'Inactive'}</p>
                </div>
                <Switch checked={form.status} onCheckedChange={(checked) => setForm((f) => ({ ...f, status: checked }))} />
              </div>
            ) : null}
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button
                type="button"
                onClick={requestSave}
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
    </AcademicShell>
  )
}
