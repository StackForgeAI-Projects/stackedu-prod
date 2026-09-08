import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'
import type { BursarFeeItem } from '@stackedu/shared'
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BursarShell } from '@/components/BursarShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { IconActionButton } from '@/components/IconActionButton'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateShort, getActiveCurrency, setActiveCurrency } from '@/lib/utils'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'
import {
  bursarAcademicYearsQueryKey,
  bursarFeeItemsQueryKey,
  bursarProgrammesQueryKey,
  bursarSemestersQueryKey,
  createBursarFeeItem,
  deleteBursarFeeItem,
  issueSemesterFeeInvoices,
  listBursarAcademicYears,
  listBursarFeeItems,
  listBursarProgrammes,
  listBursarSemesters,
  updateBursarFeeItem,
} from '@/lib/api/bursar'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/bursar/fee-structure')({
  component: FeeStructurePage,
})

const BASE_CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Tuition: { bg: 'var(--info-bg)', color: 'var(--info)' },
  Levy: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  Other: { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
}

const YEAR_GROUPS = ['All Years', 'Year 1', 'Year 2', 'Year 3', 'Year 4'] as const
const BASE_CATEGORIES = ['Tuition', 'Levy', 'Other']
const TYPE_NEW_SENTINEL = '__type_new__'
const ALL_PROGRAMMES = '__all_programmes__'

type YearGroup = (typeof YEAR_GROUPS)[number]

type FormState = {
  name: string
  category: string
  amount: string
  dueDate: string
  academicYearId: string
  semesterId: string
  programmeId: string
  yearGroup: YearGroup
  active: boolean
}

const DEFAULT_FORM: FormState = {
  name: '',
  category: 'Tuition',
  amount: '',
  dueDate: '',
  academicYearId: '',
  semesterId: '',
  programmeId: ALL_PROGRAMMES,
  yearGroup: 'All Years',
  active: true,
}

function yearGroupToStudyYear(group: YearGroup): number | null {
  if (group === 'All Years') return null
  const match = group.match(/Year (\d+)/)
  return match ? Number(match[1]) : null
}

function studyYearToGroup(year: number | null): YearGroup {
  if (!year) return 'All Years'
  return `Year ${year}` as YearGroup
}

function FeeStructurePage() {
  const queryClient = useQueryClient()
  const [academicYearId, setAcademicYearId] = useState('')
  const [currency, setCurrency] = useState(() => getActiveCurrency())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<BursarFeeItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<BursarFeeItem | null>(null)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategoryInput, setNewCategoryInput] = useState('')

  const { data: items = [], isPending, error } = useQuery({
    queryKey: bursarFeeItemsQueryKey,
    queryFn: listBursarFeeItems,
  })

  const { data: programmes = [] } = useQuery({
    queryKey: bursarProgrammesQueryKey,
    queryFn: listBursarProgrammes,
  })

  const { data: academicYears = [] } = useQuery({
    queryKey: bursarAcademicYearsQueryKey,
    queryFn: listBursarAcademicYears,
  })

  const { data: formSemesters = [] } = useQuery({
    queryKey: bursarSemestersQueryKey(form.academicYearId || 'none'),
    queryFn: () => listBursarSemesters(form.academicYearId),
    enabled: Boolean(form.academicYearId),
  })

  useEffect(() => {
    if (!academicYears.length) return
    if (!academicYearId || !academicYears.some((year) => year.id === academicYearId)) {
      setAcademicYearId(academicYears.find((year) => year.isCurrent)?.id ?? academicYears[0]!.id)
    }
  }, [academicYears, academicYearId])

  useEffect(() => {
    if (!sheetOpen || editItem || !academicYears.length) return
    const defaultYearId = academicYears.find((year) => year.isCurrent)?.id ?? academicYears[0]!.id
    setForm((current) => ({
      ...current,
      academicYearId: current.academicYearId || defaultYearId,
    }))
  }, [sheetOpen, editItem, academicYears])

  useEffect(() => {
    if (!sheetOpen || editItem || !formSemesters.length) return
    const defaultSemesterId = formSemesters.find((semester) => semester.isCurrent)?.id ?? formSemesters[0]!.id
    setForm((current) => ({
      ...current,
      semesterId: current.semesterId && formSemesters.some((semester) => semester.id === current.semesterId)
        ? current.semesterId
        : defaultSemesterId,
    }))
  }, [sheetOpen, editItem, formSemesters, form.academicYearId])

  const selectedAcademicYear = academicYears.find((year) => year.id === academicYearId)

  const yearItems = useMemo(() => {
    if (!academicYearId) return items
    return items.filter((item) => item.academicYearId === academicYearId)
  }, [items, academicYearId])

  const allCategories = [...BASE_CATEGORIES, ...customCategories]
  const categoryColors = (cat: string) => BASE_CATEGORY_COLORS[cat] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  const grouped = useMemo(() => {
    return yearItems.reduce<Record<string, BursarFeeItem[]>>((acc, item) => {
      const key = item.programmeName || 'All Programmes'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [yearItems])

  const activeItems = yearItems.filter((i) => i.isActive)
  const totalTuition = activeItems.filter((i) => i.category === 'Tuition').reduce((s, i) => s + i.amount, 0)
  const totalLevies = activeItems.filter((i) => i.category !== 'Tuition').reduce((s, i) => s + i.amount, 0)
  const grandTotal = totalTuition + totalLevies

  const saveMutation = useMutation({
    mutationFn: async () => {
      const resolvedCategory = form.category === TYPE_NEW_SENTINEL ? newCategoryInput.trim() : form.category
      const amount = parseInt(form.amount, 10)
      if (!form.name || isNaN(amount) || amount <= 0 || !resolvedCategory || !form.dueDate.trim() || !form.semesterId) {
        throw new Error('Please fill in all required fields.')
      }
      const payload = {
        name: form.name.trim(),
        category: resolvedCategory,
        amount,
        dueDate: form.dueDate,
        programmeId: form.programmeId === ALL_PROGRAMMES ? undefined : form.programmeId,
        yearOfStudy: yearGroupToStudyYear(form.yearGroup),
        isActive: form.active,
      }
      if (editItem) return updateBursarFeeItem(editItem.id, payload)
      return createBursarFeeItem({
        name: payload.name,
        category: payload.category,
        amount: payload.amount,
        dueDate: payload.dueDate,
        programmeId: payload.programmeId,
        yearOfStudy: payload.yearOfStudy,
        semesterId: form.semesterId,
        isMandatory: true,
      })
    },
    onSuccess: async (saved) => {
      toast.success(
        editItem
          ? `Fee item "${saved.name}" updated.`
          : `Fee item "${saved.name}" added. Matching students were charged for ${saved.semesterName ?? 'the selected semester'}.`,
      )
      if (form.category === TYPE_NEW_SENTINEL && newCategoryInput.trim()) {
        setCustomCategories((prev) => prev.includes(newCategoryInput.trim()) ? prev : [...prev, newCategoryInput.trim()])
      }
      setSheetOpen(false)
      await queryClient.invalidateQueries({ queryKey: bursarFeeItemsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save fee item.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (item: BursarFeeItem) => deleteBursarFeeItem(item.id),
    onSuccess: async () => {
      toast.success(`"${deleteItem?.name}" deleted.`)
      setDeleteItem(null)
      await queryClient.invalidateQueries({ queryKey: bursarFeeItemsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete fee item.')),
  })

  const issueMutation = useMutation({
    mutationFn: issueSemesterFeeInvoices,
    onSuccess: (result) => {
      const parts = [
        result.issuedCount ? `${result.issuedCount} new invoice${result.issuedCount === 1 ? '' : 's'}` : null,
        result.updatedCount ? `${result.updatedCount} updated invoice${result.updatedCount === 1 ? '' : 's'}` : null,
      ].filter(Boolean)
      toast.success(
        parts.length
          ? `${parts.join(' and ')} for ${result.semesterLabel}.`
          : `No new charges for ${result.semesterLabel}. All matching students are already billed.`,
      )
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not issue semester fees.')),
  })

  const openAdd = () => {
    setEditItem(null)
    const defaultYearId = academicYears.find((year) => year.isCurrent)?.id ?? academicYears[0]?.id ?? ''
    setForm({
      ...DEFAULT_FORM,
      academicYearId: defaultYearId,
      programmeId: programmes[0]?.id ?? ALL_PROGRAMMES,
    })
    setNewCategoryInput('')
    setSheetOpen(true)
  }

  const openEdit = (item: BursarFeeItem) => {
    setEditItem(item)
    setForm({
      name: item.name,
      category: item.category,
      amount: String(item.amount),
      dueDate: item.dueDate ?? '',
      academicYearId: item.academicYearId ?? academicYearId,
      semesterId: item.semesterId ?? '',
      programmeId: item.programmeId ?? programmes.find((p) => p.name === item.programmeName)?.id ?? ALL_PROGRAMMES,
      yearGroup: studyYearToGroup(item.yearOfStudy),
      active: item.isActive,
    })
    setNewCategoryInput('')
    setSheetOpen(true)
  }

  const requestSaveConfirm = () => {
    const resolvedCategory = form.category === TYPE_NEW_SENTINEL ? newCategoryInput.trim() : form.category
    const amount = parseInt(form.amount, 10)
    if (!form.name.trim() || isNaN(amount) || amount <= 0 || !resolvedCategory || !form.dueDate.trim() || (!editItem && !form.semesterId)) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSaveConfirmOpen(true)
  }

  const saveSummaryName = form.name.trim() || 'Fee item'
  const saveSummaryAmount = form.amount ? formatCurrency(parseInt(form.amount, 10) || 0) : formatCurrency(0)

  return (
    <BursarShell pageTitle="Fee Structure" guide={BURSAR_GUIDES.feeStructure}>
      <div className="page-scroll">
        <div className="page-body animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                Fee Structure
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Define tuition fees, levies, and payment deadlines by programme
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={currency} onValueChange={(v) => { setCurrency(v); setActiveCurrency(v) }}>
                <SelectTrigger className="w-44 text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RWF">RWF — Rwandan Franc</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={academicYearId || undefined}
                onValueChange={setAcademicYearId}
                disabled={!academicYears.length}
              >
                <SelectTrigger className="w-36 text-sm h-9"><SelectValue placeholder="Academic year" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}{year.isCurrent ? ' · current' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => setIssueConfirmOpen(true)}
                disabled={issueMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
              >
                Apply to semester
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
              >
                <Plus style={{ width: 15, height: 15 }} />
                Add fee item
              </button>
            </div>
          </div>

          {isPending ? (
            <p className="t-body py-8" style={{ color: 'var(--muted-foreground)' }}>Loading fee structure…</p>
          ) : error ? (
            <PortalErrorPanel error={error} onRetry={() => queryClient.invalidateQueries({ queryKey: bursarFeeItemsQueryKey })} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatTile icon={BookOpen} iconColor="var(--info)" iconBg="var(--info-bg)" label="TOTAL TUITION" value={formatCurrency(totalTuition)} delta="Active tuition items" deltaColor="var(--muted-foreground)" animationDelay={0} />
                <StatTile icon={BookOpen} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="TOTAL LEVIES" value={formatCurrency(totalLevies)} delta="Active levies only" deltaColor="var(--muted-foreground)" animationDelay={60} />
                <StatTile icon={BookOpen} iconColor="var(--brand)" iconBg="rgba(15, 189, 59,0.08)" label="GRAND TOTAL PER STUDENT" value={formatCurrency(grandTotal)} delta={selectedAcademicYear ? `Academic Year ${selectedAcademicYear.name}` : 'Select an academic year'} deltaColor="var(--muted-foreground)" animationDelay={120} />
              </div>

              <div className="flex flex-col gap-8">
                {Object.entries(grouped).map(([programme, progItems]) => {
                  const progTotal = progItems.filter((i) => i.isActive).reduce((s, i) => s + i.amount, 0)
                  return (
                    <div key={programme}>
                      <div className="flex items-center gap-4 mb-4">
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                          {programme}
                        </h3>
                        <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
                        <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>Total: {formatCurrency(progTotal)}</span>
                      </div>

                      <DataTable
                        rows={progItems}
                        rowKey={(item) => item.id}
                        searchPlaceholder="Search fee items…"
                        empty="No fee items."
                        columns={[
                          { id: 'name', header: 'Fee Name', value: (item) => item.name, cell: (item) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.name}</span> },
                          {
                            id: 'category',
                            header: 'Category',
                            value: (item) => item.category,
                            cell: (item) => {
                              const cc = categoryColors(item.category)
                              return <span className="t-label px-2 py-0.5" style={{ backgroundColor: cc.bg, color: cc.color, borderRadius: 'var(--radius-sm)' }}>{item.category}</span>
                            },
                          },
                          { id: 'amount', header: 'Amount', value: (item) => item.amount, cell: (item) => <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{formatCurrency(item.amount)}</span> },
                          {
                            id: 'added',
                            header: 'Date added',
                            value: (item) => item.createdAt,
                            cell: (item) => (
                              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                                {formatDateShort(item.createdAt.slice(0, 10))}
                              </span>
                            ),
                          },
                          {
                            id: 'dueDate',
                            header: 'Due date',
                            value: (item) => item.dueDate ?? '',
                            cell: (item) => (
                              <span className="t-caption font-medium" style={{ color: item.dueDate ? 'var(--foreground)' : 'var(--warning)' }}>
                                {item.dueDate ? formatDateShort(item.dueDate) : 'Not set'}
                              </span>
                            ),
                          },
                          {
                            id: 'yearGroup',
                            header: 'Applies To',
                            value: (item) => studyYearToGroup(item.yearOfStudy),
                            cell: (item) => (
                              <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                                {studyYearToGroup(item.yearOfStudy)}
                              </span>
                            ),
                          },
                          {
                            id: 'status',
                            header: 'Status',
                            value: (item) => (item.isActive ? 'Active' : 'Inactive'),
                            cell: (item) => {
                              const sc = item.isActive ? { bg: 'var(--success-bg)', color: 'var(--success)' } : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                              return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{item.isActive ? 'Active' : 'Inactive'}</span>
                            },
                          },
                          {
                            id: 'actions',
                            header: '',
                            className: 'text-right',
                            cell: (item) => (
                              <div className="flex items-center gap-1.5">
                                <IconActionButton label="Edit fee item" icon={Pencil} onClick={() => openEdit(item)} />
                                <IconActionButton label="Delete fee item" icon={Trash2} danger onClick={() => setDeleteItem(item)} />
                              </div>
                            ),
                          },
                        ]}
                      />
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sheet-lg" style={{ padding: 0 }}>
          <div style={{ padding: '28px 28px 40px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                {editItem ? 'Edit Fee Item' : 'Add Fee Item'}
              </h2>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Fee Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tuition Fee" className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }} />
              </div>

              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Category *</label>
                <Select value={form.category} onValueChange={(v) => { setForm((f) => ({ ...f, category: v })); if (v !== TYPE_NEW_SENTINEL) setNewCategoryInput('') }}>
                  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value={TYPE_NEW_SENTINEL}><span style={{ color: 'var(--success)', fontWeight: 600 }}>+ Type new category</span></SelectItem>
                  </SelectContent>
                </Select>
                {form.category === TYPE_NEW_SENTINEL ? (
                  <input type="text" value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} placeholder="Enter new category name…" autoFocus className="w-full text-sm rounded-xl px-3 py-2.5 outline-none mt-2" style={{ border: '1px solid var(--brand)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }} />
                ) : null}
              </div>

              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Amount (RWF) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 650000" min={0} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }} />
              </div>

              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment due date *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                />
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Students are reminded 1 week, 72 hours, 48 hours, and 24 hours before this date.
                </p>
              </div>

              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Academic year *</label>
                <Select
                  value={form.academicYearId || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, academicYearId: v, semesterId: '' }))}
                  disabled={Boolean(editItem) || !academicYears.length}
                >
                  <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select academic year…" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}{year.isCurrent ? ' · current' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Semester *</label>
                {editItem ? (
                  <p className="text-sm rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                    {editItem.semesterName ?? 'Current semester'}
                  </p>
                ) : (
                  <Select
                    value={form.semesterId || undefined}
                    onValueChange={(v) => setForm((f) => ({ ...f, semesterId: v }))}
                    disabled={!form.academicYearId || !formSemesters.length}
                  >
                    <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select semester…" /></SelectTrigger>
                    <SelectContent>
                      {formSemesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.name}{semester.isCurrent ? ' · current' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Programme</label>
                <Select value={form.programmeId} onValueChange={(v) => setForm((f) => ({ ...f, programmeId: v }))}>
                  <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select programme…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_PROGRAMMES}>All Programmes</SelectItem>
                    {programmes.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Year Group</label>
                <Select value={form.yearGroup} onValueChange={(v) => setForm((f) => ({ ...f, yearGroup: v as YearGroup }))}>
                  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEAR_GROUPS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="active-toggle" checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
                <Label htmlFor="active-toggle" className="text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
                  {form.active ? 'Active' : 'Inactive'}
                </Label>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={requestSaveConfirm} disabled={saveMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer', opacity: saveMutation.isPending ? 0.7 : 1 }}>
                  {editItem ? 'Save changes' : 'Add fee item'}
                </button>
                <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title={editItem ? 'Save fee item changes?' : 'Add this fee item?'}
        tone="warning"
        headlineLabel="Confirm"
        headline={editItem ? 'Update fee item' : 'Add fee item'}
        summary={
          <>
            <strong>{saveSummaryName}</strong> ({saveSummaryAmount}) will be {editItem ? 'updated in' : 'added to'} the fee structure
            {form.active ? ' and marked active.' : ' as inactive.'}
          </>
        }
        notices={[
          {
            icon: 'file',
            label: editItem
              ? 'Changes update the fee structure. Existing student invoices are not changed automatically.'
              : 'Matching students are charged immediately for the selected semester.',
          },
        ]}
        confirmLabel={editItem ? 'Save changes' : 'Add fee item'}
        confirmVariant="brand"
        loading={saveMutation.isPending}
        onConfirm={() => {
          saveMutation.mutate(undefined, {
            onSuccess: () => setSaveConfirmOpen(false),
          })
        }}
      />

      <ConfirmAlertDialog
        open={issueConfirmOpen}
        onOpenChange={setIssueConfirmOpen}
        title="Apply fees to the current semester?"
        tone="warning"
        headlineLabel="Confirm"
        headline="Issue semester invoices"
        summary="All active fee items for the current semester will be applied to matching students. New invoices are created where needed; existing semester invoices get any missing fees added."
        notices={[
          { icon: 'bell', label: 'Use this at the start of term or to catch up if any students were missed.' },
          { icon: 'bell', label: 'Students receive automatic reminders 1 week, 72h, 48h, and 24h before each fee due date.' },
        ]}
        confirmLabel="Apply to semester"
        confirmVariant="brand"
        loading={issueMutation.isPending}
        onConfirm={() => {
          issueMutation.mutate(undefined, {
            onSuccess: () => setIssueConfirmOpen(false),
          })
        }}
      />

      <ConfirmAlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete this fee item?"
        tone="destructive"
        headlineLabel="Action"
        headline="Delete fee item"
        summary={`"${deleteItem?.name}" will be permanently removed from the fee structure.`}
        notices={[{ icon: 'trash', label: 'This fee will no longer appear on student accounts or receipts.' }]}
        caution="This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => { if (deleteItem) deleteMutation.mutate(deleteItem) }}
      />
    </BursarShell>
  )
}
