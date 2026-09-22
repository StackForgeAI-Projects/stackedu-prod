import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  Building2,
  GraduationCap,
  Megaphone,
  Search,
  Send,
  Users,
  UserRound,
  BookOpen,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { DataTable } from '@/components/DataTable'
import { IconActionButton } from '@/components/IconActionButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'
import {
  bursarAudienceOptionsQueryKey,
  bursarFeeMessagesQueryKey,
  createBursarAnnouncement,
  getBursarAudienceOptions,
  listBursarFeeMessages,
} from '@/lib/api/bursar'
import { apiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/bursar/announcements')({
  component: BursarAnnouncementsPage,
})

type AudienceSection = 'all' | 'departments' | 'years' | 'courses' | 'students'

function formatMessageTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toggleId(list: string[], id: string, on: boolean) {
  return on ? [...list.filter((item) => item !== id), id] : list.filter((item) => item !== id)
}

function toggleYear(list: number[], year: number, on: boolean) {
  return on ? [...list.filter((item) => item !== year), year] : list.filter((item) => item !== year)
}

function AudienceRow({
  checked,
  onCheckedChange,
  label,
  meta,
  icon: Icon,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  meta?: string
  icon?: typeof Users
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
        checked ? 'border' : 'hover:bg-[var(--muted)]',
      )}
      style={{
        backgroundColor: checked ? 'var(--success-bg)' : 'transparent',
        borderColor: checked ? 'var(--success)' : 'transparent',
      }}
    >
      <span
        className="flex items-center justify-center flex-shrink-0 rounded-full"
        style={{
          width: 36,
          height: 36,
          backgroundColor: checked ? 'var(--success)' : 'var(--muted)',
          color: checked ? 'var(--brand-ink)' : 'var(--muted-foreground)',
        }}
      >
        {Icon ? <Icon style={{ width: 16, height: 16 }} /> : <Users style={{ width: 16, height: 16 }} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{label}</span>
        {meta ? <span className="block t-caption truncate" style={{ color: 'var(--muted-foreground)' }}>{meta}</span> : null}
      </span>
      <span
        className="flex items-center justify-center flex-shrink-0 rounded-full"
        style={{
          width: 22,
          height: 22,
          border: checked ? 'none' : '1.5px solid var(--border)',
          backgroundColor: checked ? 'var(--success)' : 'transparent',
          color: checked ? 'var(--brand-ink)' : 'transparent',
        }}
      >
        {checked ? <Check style={{ width: 12, height: 12 }} /> : null}
      </span>
    </button>
  )
}

function AudiencePanel({
  options,
  allStudents,
  setAllStudents,
  departmentIds,
  setDepartmentIds,
  yearsOfStudy,
  setYearsOfStudy,
  studentIds,
  setStudentIds,
  courseOfferingIds,
  setCourseOfferingIds,
  studentSearch,
  setStudentSearch,
  activeSection,
  setActiveSection,
}: {
  options: NonNullable<Awaited<ReturnType<typeof getBursarAudienceOptions>>>
  allStudents: boolean
  setAllStudents: (value: boolean) => void
  departmentIds: string[]
  setDepartmentIds: React.Dispatch<React.SetStateAction<string[]>>
  yearsOfStudy: number[]
  setYearsOfStudy: React.Dispatch<React.SetStateAction<number[]>>
  studentIds: string[]
  setStudentIds: React.Dispatch<React.SetStateAction<string[]>>
  courseOfferingIds: string[]
  setCourseOfferingIds: React.Dispatch<React.SetStateAction<string[]>>
  studentSearch: string
  setStudentSearch: (value: string) => void
  activeSection: AudienceSection
  setActiveSection: (section: AudienceSection) => void
}) {
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    if (!query) return options.students
    return options.students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.studentNumber.toLowerCase().includes(query),
    )
  }, [options.students, studentSearch])

  const sections: Array<{ key: AudienceSection; label: string; icon: typeof Users; count?: number }> = [
    { key: 'all', label: 'Everyone', icon: Megaphone },
    { key: 'departments', label: 'Departments', icon: Building2, count: departmentIds.length || undefined },
    { key: 'years', label: 'Year groups', icon: GraduationCap, count: yearsOfStudy.length || undefined },
    { key: 'courses', label: 'Courses', icon: BookOpen, count: courseOfferingIds.length || undefined },
    { key: 'students', label: 'Students', icon: UserRound, count: studentIds.length || undefined },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
          Recipients
        </p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Choose who receives this fee message
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-3 py-3 border-b scrollbar-none" style={{ borderColor: 'var(--border)' }}>
        {sections.map((section) => {
          const Icon = section.icon
          const active = activeSection === section.key
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: active ? 'var(--brand)' : 'var(--muted)',
                color: active ? 'var(--brand-ink)' : 'var(--muted-foreground)',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {section.label}
              {section.count ? ` · ${section.count}` : ''}
            </button>
          )
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {activeSection === 'all' ? (
          <AudienceRow
            checked={allStudents}
            onCheckedChange={setAllStudents}
            label="All enrolled students"
            meta={`${options.enrolledStudentCount} students`}
            icon={Megaphone}
          />
        ) : null}

        {activeSection === 'departments'
          ? options.departments.map((dept) => (
              <AudienceRow
                key={dept.id}
                checked={departmentIds.includes(dept.id)}
                onCheckedChange={(checked) => setDepartmentIds((prev) => toggleId(prev, dept.id, checked))}
                label={dept.name}
                meta={`${dept.studentCount} student${dept.studentCount === 1 ? '' : 's'}`}
                icon={Building2}
              />
            ))
          : null}

        {activeSection === 'years'
          ? options.years.map((row) => (
              <AudienceRow
                key={row.year}
                checked={yearsOfStudy.includes(row.year)}
                onCheckedChange={(checked) => setYearsOfStudy((prev) => toggleYear(prev, row.year, checked))}
                label={`Year ${row.year}`}
                meta={`${row.studentCount} student${row.studentCount === 1 ? '' : 's'}`}
                icon={GraduationCap}
              />
            ))
          : null}

        {activeSection === 'courses' ? (
          options.courses.length ? (
            options.courses.map((course) => (
              <AudienceRow
                key={course.offeringId}
                checked={courseOfferingIds.includes(course.offeringId)}
                onCheckedChange={(checked) =>
                  setCourseOfferingIds((prev) => toggleId(prev, course.offeringId, checked))
                }
                label={course.label}
                meta={`${course.enrolledCount} enrolled`}
                icon={BookOpen}
              />
            ))
          ) : (
            <p className="t-caption px-2 py-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
              No course enrolments yet.
            </p>
          )
        ) : null}

        {activeSection === 'students' ? (
          <>
            <div className="relative mb-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }}
              />
              <Input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search by name or ID…"
                className="pl-9 h-9 text-sm"
              />
            </div>
            {filteredStudents.length ? (
              filteredStudents.map((student) => (
                <AudienceRow
                  key={student.id}
                  checked={studentIds.includes(student.id)}
                  onCheckedChange={(checked) => setStudentIds((prev) => toggleId(prev, student.id, checked))}
                  label={student.name}
                  meta={student.studentNumber}
                  icon={UserRound}
                />
              ))
            ) : (
              <p className="t-caption px-2 py-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No students match your search.
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

function BursarAnnouncementsPage() {
  const queryClient = useQueryClient()
  const { data: options, error, refetch } = useQuery({
    queryKey: bursarAudienceOptionsQueryKey,
    queryFn: getBursarAudienceOptions,
  })
  const { data: sentHistory = [] } = useQuery({
    queryKey: bursarFeeMessagesQueryKey,
    queryFn: listBursarFeeMessages,
  })

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [allStudents, setAllStudents] = useState(false)
  const [departmentIds, setDepartmentIds] = useState<string[]>([])
  const [yearsOfStudy, setYearsOfStudy] = useState<number[]>([])
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [courseOfferingIds, setCourseOfferingIds] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [activeSection, setActiveSection] = useState<AudienceSection>('all')
  const [audienceSheetOpen, setAudienceSheetOpen] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)

  const selectionCount =
    (allStudents ? 1 : 0) +
    departmentIds.length +
    yearsOfStudy.length +
    studentIds.length +
    courseOfferingIds.length

  const audienceSummary = useMemo(() => {
    const parts: string[] = []
    if (allStudents) parts.push(`All ${options?.enrolledStudentCount ?? 0} enrolled students`)
    if (departmentIds.length) {
      const names = departmentIds.map((id) => options?.departments.find((d) => d.id === id)?.name).filter(Boolean)
      if (names.length) parts.push(names.join(', '))
    }
    if (yearsOfStudy.length) parts.push(`Year ${yearsOfStudy.sort((a, b) => a - b).join(', ')}`)
    if (courseOfferingIds.length) parts.push(`${courseOfferingIds.length} course${courseOfferingIds.length === 1 ? '' : 's'}`)
    if (studentIds.length) parts.push(`${studentIds.length} student${studentIds.length === 1 ? '' : 's'}`)
    return parts.join(' · ') || 'Select recipients to continue'
  }, [allStudents, courseOfferingIds.length, departmentIds, options, studentIds.length, yearsOfStudy])

  const sendMutation = useMutation({
    mutationFn: () =>
      createBursarAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience: {
          includeEnrolledStudents: allStudents,
          departmentIds: departmentIds.length ? departmentIds : undefined,
          yearsOfStudy: yearsOfStudy.length ? yearsOfStudy : undefined,
          studentIds: studentIds.length ? studentIds : undefined,
          courseOfferingIds: courseOfferingIds.length ? courseOfferingIds : undefined,
        },
      }),
    onSuccess: (result) => {
      const recipientLabel = result.recipientCount === 1
        ? result.audienceLabel
        : `${result.recipientCount} students`
      toast.success(`Fee message sent to ${recipientLabel}.`)
      setTitle('')
      setBody('')
      setAllStudents(false)
      setDepartmentIds([])
      setYearsOfStudy([])
      setStudentIds([])
      setCourseOfferingIds([])
      setStudentSearch('')
      setActiveSection('all')
      setSendConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: bursarAudienceOptionsQueryKey })
      void queryClient.invalidateQueries({ queryKey: bursarFeeMessagesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not send that message.')),
  })

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Add a subject and message before sending.')
      return
    }
    if (!allStudents && !departmentIds.length && !yearsOfStudy.length && !studentIds.length && !courseOfferingIds.length) {
      toast.error('Choose at least one recipient.')
      return
    }
    setSendConfirmOpen(true)
  }

  const audiencePanelProps = options
    ? {
        options,
        allStudents,
        setAllStudents,
        departmentIds,
        setDepartmentIds,
        yearsOfStudy,
        setYearsOfStudy,
        studentIds,
        setStudentIds,
        courseOfferingIds,
        setCourseOfferingIds,
        studentSearch,
        setStudentSearch,
        activeSection,
        setActiveSection,
      }
    : null

  return (
    <BursarShell pageTitle="Fee Messages" guide={BURSAR_GUIDES.announcements}>
      <div className="page-scroll">
        <div className="page-body animate-fade-up px-3 sm:px-4 lg:px-6 pb-6">
          {error ? <PortalErrorPanel error={error} onRetry={() => refetch()} /> : null}

          {!error && options && audiencePanelProps ? (
            <div
              className="flex flex-col lg:flex-row overflow-hidden"
              style={{
                minHeight: 'calc(100dvh - 220px)',
                maxHeight: 'calc(100dvh - 180px)',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Desktop audience sidebar */}
              <aside
                className="hidden lg:flex flex-col w-[320px] flex-shrink-0 border-r min-h-0"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
              >
                <AudiencePanel {...audiencePanelProps} />
              </aside>

              {/* Chat column */}
              <section className="flex flex-col flex-1 min-w-0 min-h-0">
                <div
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-shrink-0"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ width: 40, height: 40, backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
                    >
                      <Megaphone style={{ width: 18, height: 18 }} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                        Compose fee message
                      </p>
                      <p className="t-caption truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {selectionCount ? audienceSummary : 'No recipients selected yet'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="lg:hidden flex-shrink-0"
                    onClick={() => setAudienceSheetOpen(true)}
                  >
                    <Users style={{ width: 14, height: 14 }} />
                    {selectionCount ? `${selectionCount} selected` : 'Recipients'}
                  </Button>
                </div>

                <div className="px-4 pt-3">
                  <FormInfoBox lines={formInfo.composeFeeMessage} />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4" style={{ backgroundColor: 'var(--muted)' }}>
                  {!selectionCount && !title.trim() && !body.trim() ? (
                    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
                      <span
                        className="flex items-center justify-center rounded-full mb-4"
                        style={{ width: 56, height: 56, backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
                      >
                        <Megaphone style={{ width: 24, height: 24 }} />
                      </span>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                        Write a fee update
                      </p>
                      <p className="t-caption max-w-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                        Choose recipients on the left, then send reminders about deadlines, fee updates, or payment channels.
                      </p>
                    </div>
                  ) : null}

                  {(title.trim() || body.trim()) && (
                    <div
                      className="max-w-[min(100%,520px)] rounded-2xl px-4 py-3 border border-dashed mb-4"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    >
                      <p className="t-caption mb-1" style={{ color: 'var(--muted-foreground)' }}>Preview</p>
                      {title.trim() ? (
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{title}</p>
                      ) : null}
                      {body.trim() ? (
                        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>{body}</p>
                      ) : (
                        <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>Your message will appear here…</p>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className="flex-shrink-0 border-t px-3 sm:px-4 py-3"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
                >
                  <div className="flex flex-wrap gap-2 mb-2">
                    {allStudents ? (
                      <span className="t-caption px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                        All students
                      </span>
                    ) : null}
                    {departmentIds.map((id) => {
                      const name = options.departments.find((dept) => dept.id === id)?.name
                      return name ? (
                        <span key={id} className="t-caption px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                          {name}
                        </span>
                      ) : null
                    })}
                    {yearsOfStudy.map((year) => (
                      <span key={year} className="t-caption px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                        Year {year}
                      </span>
                    ))}
                    {courseOfferingIds.length ? (
                      <span className="t-caption px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                        {courseOfferingIds.length} course{courseOfferingIds.length === 1 ? '' : 's'}
                      </span>
                    ) : null}
                    {studentIds.length ? (
                      <span className="t-caption px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                        {studentIds.length} student{studentIds.length === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                  >
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Subject — e.g. Semester 1 fee reminder"
                      className="border-0 border-b rounded-none h-11 focus-visible:ring-0 shadow-none"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'transparent' }}
                    />
                    <div className="flex items-end gap-2 p-2">
                      <Textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="Write your fee update, deadline, or payment instructions…"
                        rows={3}
                        className="min-h-[72px] max-h-40 resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent flex-1"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                            event.preventDefault()
                            handleSend()
                          }
                        }}
                      />
                      <IconActionButton
                        label="Send fee message"
                        icon={Send}
                        onClick={handleSend}
                        disabled={sendMutation.isPending}
                        className="rounded-full mb-1"
                        style={{ width: 42, height: 42, backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none' }}
                      />
                    </div>
                  </div>
                  <p className="t-caption mt-2 px-1 hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                    Press ⌘/Ctrl + Enter to send
                  </p>
                </div>
              </section>
            </div>
          ) : null}

          {!error && options ? (
            <div className="mt-6">
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Sent messages</h2>
              <DataTable
                rows={sentHistory}
                rowKey={(message) => message.id}
                searchPlaceholder="Search sent messages…"
                searchFilter={(message, query) =>
                  message.title.toLowerCase().includes(query)
                  || message.body.toLowerCase().includes(query)
                  || message.audienceLabel.toLowerCase().includes(query)
                }
                empty="No fee messages sent yet."
                defaultPageSize={10}
                columns={[
                  {
                    id: 'sentAt',
                    header: 'Sent',
                    value: (message) => message.sentAt,
                    sortable: true,
                    cell: (message) => (
                      <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                        {formatMessageTime(message.sentAt)}
                      </span>
                    ),
                  },
                  {
                    id: 'title',
                    header: 'Subject',
                    value: (message) => message.title,
                    cell: (message) => <span className="text-sm font-medium">{message.title}</span>,
                  },
                  {
                    id: 'body',
                    header: 'Message',
                    value: (message) => message.body,
                    cell: (message) => (
                      <span className="text-sm truncate block" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
                        {message.body}
                      </span>
                    ),
                  },
                  {
                    id: 'recipients',
                    header: 'Sent to',
                    value: (message) => message.audienceLabel,
                    cell: (message) => (
                      <span className="t-caption whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                        {message.recipientCount === 1
                          ? message.audienceLabel
                          : `${message.recipientCount} · ${message.audienceLabel}`}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}

          {!error && !options ? (
            <p className="t-body px-4 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading recipients…</p>
          ) : null}
        </div>
      </div>

      <ConfirmAlertDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="Send this fee message?"
        tone="warning"
        headlineLabel="Confirm"
        headline="Send fee message"
        summary={
          <>
            <strong>{title.trim()}</strong> will be sent to {audienceSummary}.
          </>
        }
        notices={[
          { icon: 'bell', label: 'Students receive this in their app under Notifications and Fees.' },
        ]}
        confirmLabel="Send message"
        confirmVariant="brand"
        loading={sendMutation.isPending}
        onConfirm={() => sendMutation.mutate()}
      />

      <Sheet open={audienceSheetOpen} onOpenChange={setAudienceSheetOpen}>
        <SheetContent side="left" className="p-0 w-[min(100vw,360px)]">
          <SheetHeader className="px-4 pt-4 pb-0">
              <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>Choose recipients</SheetTitle>
              <FormInfoBox lines={formInfo.chooseFeeRecipients} />
          </SheetHeader>
          <div className="h-[calc(100dvh-72px)]">
            {audiencePanelProps ? <AudiencePanel {...audiencePanelProps} /> : null}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-[var(--card)]" style={{ borderColor: 'var(--border)' }}>
            <Button className="w-full" onClick={() => setAudienceSheetOpen(false)}>
              Done · {selectionCount ? `${selectionCount} selected` : 'No selection'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </BursarShell>
  )
}
