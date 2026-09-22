import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, X, BookOpen } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency, getActiveCurrency, setActiveCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV, FEE_ITEMS,
  type FeeItem, type FeeCategory, type YearGroup,
} from '@/data/bursar'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/fee-structure')({
  component: FeeStructurePage,
})

const BASE_CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Tuition: { bg: 'var(--info-bg)',    color: 'var(--info)'             },
  Levy:    { bg: 'var(--warning-bg)', color: 'var(--warning)'          },
  Other:   { bg: 'var(--muted)',      color: 'var(--muted-foreground)' },
}

const BASE_PROGRAMMES = ['Computer Science', 'Business Administration']
const YEAR_GROUPS: YearGroup[] = ['All Years', 'Year 1', 'Year 2', 'Year 3', 'Year 4']
const BASE_CATEGORIES = ['Tuition', 'Levy', 'Other']

const TYPE_NEW_SENTINEL = '__type_new__'

type FormState = {
  name: string
  category: string
  amount: string
  dueDate: string
  programme: string
  yearGroup: YearGroup
  active: boolean
}

const DEFAULT_FORM: FormState = {
  name: '', category: 'Tuition', amount: '', dueDate: '',
  programme: 'Computer Science', yearGroup: 'All Years', active: true,
}

// ─────────────────────────────────────────────────────────────────────────────

function FeeStructurePage() {
  const [items, setItems]             = useState<FeeItem[]>(FEE_ITEMS)
  const [academicYear, setAcYear]     = useState('2024/2025')
  const [currency, setCurrency]       = useState(() => getActiveCurrency())
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [editItem, setEditItem]       = useState<FeeItem | null>(null)
  const [deleteItem, setDeleteItem]   = useState<FeeItem | null>(null)
  const [form, setForm]               = useState<FormState>(DEFAULT_FORM)

  // 'Type new' state for category and programme
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customProgrammes, setCustomProgrammes] = useState<string[]>([])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [newProgrammeInput, setNewProgrammeInput] = useState('')

  const allCategories = [...BASE_CATEGORIES, ...customCategories]
  const allProgrammes = [...BASE_PROGRAMMES, ...customProgrammes]

  const categoryColors = (cat: string) =>
    BASE_CATEGORY_COLORS[cat] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  const handleCurrencyChange = (v: string) => {
    setCurrency(v)
    setActiveCurrency(v)
  }

  const grouped = useMemo(() => {
    return items.reduce<Record<string, FeeItem[]>>((acc, item) => {
      if (!acc[item.programme]) acc[item.programme] = []
      acc[item.programme].push(item)
      return acc
    }, {})
  }, [items])

  const activeItems  = items.filter((i) => i.status === 'Active')
  const totalTuition = activeItems.filter((i) => i.category === 'Tuition').reduce((s, i) => s + i.amount, 0)
  const totalLevies  = activeItems.filter((i) => i.category !== 'Tuition').reduce((s, i) => s + i.amount, 0)
  const grandTotal   = totalTuition + totalLevies

  const openAdd = () => {
    setEditItem(null)
    setForm(DEFAULT_FORM)
    setNewCategoryInput('')
    setNewProgrammeInput('')
    setSheetOpen(true)
  }

  const openEdit = (item: FeeItem) => {
    setEditItem(item)
    setForm({
      name: item.name,
      category: item.category,
      amount: String(item.amount),
      dueDate: '',
      programme: item.programme,
      yearGroup: item.yearGroup,
      active: item.status === 'Active',
    })
    setNewCategoryInput('')
    setNewProgrammeInput('')
    setSheetOpen(true)
  }

  const handleSave = () => {
    // Resolve 'Type new' selections
    const resolvedCategory = form.category === TYPE_NEW_SENTINEL
      ? newCategoryInput.trim()
      : form.category
    const resolvedProgramme = form.programme === TYPE_NEW_SENTINEL
      ? newProgrammeInput.trim()
      : form.programme

    const amount = parseInt(form.amount, 10)
    if (!form.name || isNaN(amount) || amount <= 0 || !resolvedCategory || !resolvedProgramme) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Register custom category/programme for future use
    if (form.category === TYPE_NEW_SENTINEL && resolvedCategory && !allCategories.includes(resolvedCategory)) {
      setCustomCategories((prev) => [...prev, resolvedCategory])
    }
    if (form.programme === TYPE_NEW_SENTINEL && resolvedProgramme && !allProgrammes.includes(resolvedProgramme)) {
      setCustomProgrammes((prev) => [...prev, resolvedProgramme])
    }

    if (editItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editItem.id
            ? { ...i, name: form.name, category: resolvedCategory as FeeCategory, amount, programme: resolvedProgramme, yearGroup: form.yearGroup, status: form.active ? 'Active' : 'Inactive' }
            : i
        )
      )
      toast.success(`Fee item "${form.name}" updated.`)
    } else {
      const newItem: FeeItem = {
        id: Math.max(...items.map((i) => i.id)) + 1,
        name: form.name,
        category: resolvedCategory as FeeCategory,
        amount,
        dueDate: '30 Sep 2024',
        programme: resolvedProgramme,
        yearGroup: form.yearGroup,
        status: form.active ? 'Active' : 'Inactive',
      }
      setItems((prev) => [...prev, newItem])
      toast.success(`Fee item "${form.name}" added.`)
    }
    setSheetOpen(false)
  }

  const handleDelete = () => {
    if (!deleteItem) return
    setItems((prev) => prev.filter((i) => i.id !== deleteItem.id))
    toast.success(`"${deleteItem.name}" deleted.`)
    setDeleteItem(null)
  }

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Fee Structure"
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
                Fee Structure
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Define tuition fees, levies, and payment deadlines by programme
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency selector */}
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-44 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RWF">RWF — Rwandan Franc</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                </SelectContent>
              </Select>

              {/* Academic year selector */}
              <Select value={academicYear} onValueChange={setAcYear}>
                <SelectTrigger className="w-36 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                <Plus style={{ width: 15, height: 15 }} />
                Add fee item
              </button>
            </div>
          </div>

          {/* Summary StatTiles */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatTile
              icon={BookOpen}
              iconColor="var(--info)" iconBg="var(--info-bg)"
              label="TOTAL TUITION (CS)"
              value={formatCurrency(totalTuition)}
              delta="Per student per semester"
              deltaColor="var(--muted-foreground)"
              animationDelay={0}
            />
            <StatTile
              icon={BookOpen}
              iconColor="var(--warning)" iconBg="var(--warning-bg)"
              label="TOTAL LEVIES"
              value={formatCurrency(totalLevies)}
              delta="Active levies only"
              deltaColor="var(--muted-foreground)"
              animationDelay={60}
            />
            <StatTile
              icon={BookOpen}
              iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
              label="GRAND TOTAL PER STUDENT"
              value={formatCurrency(grandTotal)}
              delta={`Academic Year ${academicYear}`}
              deltaColor="var(--muted-foreground)"
              animationDelay={120}
            />
          </div>

          {/* Fee items grouped by programme */}
          <div className="flex flex-col gap-8">
            {Object.entries(grouped).map(([programme, progItems]) => {
              const progTotal = progItems.filter((i) => i.status === 'Active').reduce((s, i) => s + i.amount, 0)
              return (
                <div key={programme}>
                  <div className="flex items-center gap-4 mb-4">
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {programme}
                    </h3>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
                    <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                      Total: {formatCurrency(progTotal)}
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'var(--card)',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Fee Name', 'Category', 'Amount', 'Due Date', 'Applies To', 'Status', ''].map((h) => (
                            <th
                              key={h}
                              className="t-label text-left"
                              style={{ color: 'var(--muted-foreground)', padding: '12px 16px', fontWeight: 600 }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {progItems.map((item, i) => {
                          const cc = categoryColors(item.category)
                          const sc = item.status === 'Active'
                            ? { bg: 'var(--success-bg)', color: 'var(--success)' }
                            : { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                          return (
                            <tr
                              key={item.id}
                              style={{ borderBottom: i < progItems.length - 1 ? '1px solid var(--border)' : 'none' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 500 }}>
                                {item.name}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  className="t-label px-2 py-0.5"
                                  style={{ backgroundColor: cc.bg, color: cc.color, borderRadius: 'var(--radius-sm)' }}
                                >
                                  {item.category}
                                </span>
                              </td>
                              <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 600 }}>
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px' }}>
                                {item.dueDate}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  className="t-label px-2 py-0.5"
                                  style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}
                                >
                                  {item.yearGroup}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  className="t-label px-2 py-0.5"
                                  style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEdit(item)}
                                    className="flex items-center justify-center rounded-lg transition-colors duration-150"
                                    style={{ width: 30, height: 30, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                                    title="Edit fee item"
                                  >
                                    <Pencil style={{ width: 14, height: 14 }} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteItem(item)}
                                    className="flex items-center justify-center rounded-lg transition-colors duration-150"
                                    style={{ width: 30, height: 30, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)'; e.currentTarget.style.color = 'var(--error)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                                    title="Delete fee item"
                                  >
                                    <Trash2 style={{ width: 14, height: 14 }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto" style={{ width: 'min(860px, 55vw)', padding: 0 }}>
          <div style={{ padding: '28px 28px 40px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  letterSpacing: '-0.015em',
                }}
              >
                {editItem ? 'Edit Fee Item' : 'Add Fee Item'}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Fee name */}
              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Fee Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Tuition Fee"
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                />
              </div>

              {/* Category with 'Type new' */}
              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Category *
                </label>
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, category: v }))
                    if (v !== TYPE_NEW_SENTINEL) setNewCategoryInput('')
                  }}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value={TYPE_NEW_SENTINEL}>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>+ Type new category</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.category === TYPE_NEW_SENTINEL && (
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Enter new category name…"
                    autoFocus
                    className="w-full text-sm rounded-xl px-3 py-2.5 outline-none mt-2"
                    style={{ border: '1px solid var(--brand)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Amount (RWF) *
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 650000"
                  min={0}
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                />
              </div>

              {/* Due date */}
              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                />
              </div>

              {/* Programme with 'Type new' */}
              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Programme
                </label>
                <Select
                  value={form.programme}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, programme: v }))
                    if (v !== TYPE_NEW_SENTINEL) setNewProgrammeInput('')
                  }}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allProgrammes.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                    <SelectItem value={TYPE_NEW_SENTINEL}>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>+ Type new programme</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.programme === TYPE_NEW_SENTINEL && (
                  <input
                    type="text"
                    value={newProgrammeInput}
                    onChange={(e) => setNewProgrammeInput(e.target.value)}
                    placeholder="Enter new programme name…"
                    autoFocus
                    className="w-full text-sm rounded-xl px-3 py-2.5 outline-none mt-2"
                    style={{ border: '1px solid var(--brand)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                )}
              </div>

              {/* Year group */}
              <div>
                <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Year Group
                </label>
                <Select value={form.yearGroup} onValueChange={(v) => setForm((f) => ({ ...f, yearGroup: v as YearGroup }))}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_GROUPS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  id="active-toggle"
                  checked={form.active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                />
                <Label htmlFor="active-toggle" className="text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
                  {form.active ? 'Active' : 'Inactive'}
                </Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                >
                  {editItem ? 'Save changes' : 'Add fee item'}
                </button>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this fee item?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteItem?.name}"</strong> will be permanently removed from the fee structure.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
