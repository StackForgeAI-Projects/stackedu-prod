import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Download, Info, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { RegisterCoursesRequest, StudentOfferingOption } from '@stackedu/shared'
import { toast } from 'sonner'
import { StudentShell } from '@/components/StudentShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { IconActionButton } from '@/components/IconActionButton'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useInstitutionBranding } from '@/hooks/useInstitutionBranding'
import { courseRegistrationTotalsLabel, downloadCourseRegistrationPdf } from '@/lib/course-registration-pdf'
import {
  getStudentProfile,
  getStudentRegistration,
  registerStudentCourses,
  studentCoursesQueryKey,
  studentDashboardQueryKey,
  studentProfileQueryKey,
  studentRegistrationQueryKey,
} from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/student/course-registration')({
  component: CourseRegistrationPage,
})

function CourseRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: studentRegistrationQueryKey,
    queryFn: getStudentRegistration,
  })
  const profileQuery = useQuery({
    queryKey: studentProfileQueryKey,
    queryFn: getStudentProfile,
  })
  const branding = useInstitutionBranding()
  const [selected, setSelected] = useState<string[]>([])
  const [dropTarget, setDropTarget] = useState<StudentOfferingOption | null>(null)
  const [confirmAdd, setConfirmAdd] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const mutation = useMutation({
    mutationFn: registerStudentCourses,
    onSuccess: async (_result, vars) => {
      const droppedOnly = (vars.dropOfferingIds?.length ?? 0) > 0 && (vars.offeringIds?.length ?? 0) === 0
      toast.success(droppedOnly ? 'Course dropped.' : 'Registration updated.')
      setSelected([])
      setDropTarget(null)
      setConfirmAdd(false)
      await queryClient.invalidateQueries({ queryKey: studentRegistrationQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentCoursesQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey })
      if (!droppedOnly) void navigate({ to: '/student/courses' })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update your registration.')),
  })

  const registered = data?.offerings.filter((row) => row.registered) ?? []
  const available = data?.offerings.filter((row) => !row.registered) ?? []
  const extraCredits = available
    .filter((row) => selected.includes(row.offeringId) && row.openForRegistration !== false)
    .reduce((sum, row) => sum + row.credits, 0)
  const overCredit = Boolean(data && data.registeredCredits + extraCredits > data.maxCredits)
  const overCapNow = Boolean(data && data.registeredCredits > data.maxCredits)
  const canSelect = Boolean(data?.registrationOpen && !data.feeHold)
  const canDrop = Boolean(data && (data.registrationOpen || overCapNow))
  const closedOfferings = available.filter((row) => row.openForRegistration === false)
  const addIds = available
    .filter((row) => selected.includes(row.offeringId) && row.openForRegistration !== false)
    .map((row) => row.offeringId)
  const totalsLabel = data
    ? courseRegistrationTotalsLabel(registered.length, data.registeredCredits, data.maxCredits)
    : null

  const downloadPdf = async () => {
    const profile = profileQuery.data
    if (!data || !profile || registered.length === 0) return
    setDownloadingPdf(true)
    try {
      await downloadCourseRegistrationPdf({
        institutionName: branding.institutionName,
        logoUrl: branding.logoUrl,
        studentName: profile.fullName,
        studentNumber: profile.studentNumber,
        email: profile.email,
        programmeName: profile.programmeName,
        programmeCode: profile.programmeCode,
        departmentName: profile.departmentName,
        facultyName: profile.facultyName,
        yearOfStudy: profile.yearOfStudy,
        sessionName: data.academicYearName,
        semesterName: data.semesterName,
        registeredCredits: data.registeredCredits,
        maxCredits: data.maxCredits,
        courses: registered.map((row) => ({
          code: row.code,
          name: row.name,
          credits: row.credits,
          type: row.type,
          lecturerName: row.lecturerName,
        })),
      })
      toast.success('Course registration downloaded.')
    } catch {
      toast.error('Could not download the registration PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <StudentShell pageTitle="Course registration" guide="Add offerings while registration is open and you have no fee hold. Academic Admin opens the semester; the Bursar clears holds.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        {isPending ? (
          <>
            <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Register for courses</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading offerings…</p>
          </>
        ) : error ? (
          <>
            <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Register for courses</h1>
            <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load registration.')}</p>
          </>
        ) : data ? (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Register for courses</h1>
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{totalsLabel}</p>
                {profileQuery.data?.programmeName ? (
                  <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {profileQuery.data.programmeName}
                    {profileQuery.data.departmentName ? ` · ${profileQuery.data.departmentName}` : ''}
                  </p>
                ) : null}
              </div>
              <Button
                variant="outline"
                className="shrink-0 self-start"
                disabled={registered.length === 0 || downloadingPdf || !profileQuery.data}
                onClick={() => { void downloadPdf() }}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadingPdf ? 'Preparing PDF…' : 'Download PDF'}
              </Button>
            </div>
            {data.feeHold ? (
              <RegistrationStatusNotice
                tone="error"
                title="Fee hold"
                body="A fee hold is blocking new registration. Pay fees, then ask the Bursar to release the hold. You can still drop a course if you are over the credit cap."
              />
            ) : null}
            {data.registrationOpen ? (
              <RegistrationStatusNotice
                tone="info"
                title="Registration is open"
                body={
                  data.registrationClosesAt
                    ? `You can add or drop offerings for this semester. Registration closes on ${formatDateShort(data.registrationClosesAt)}.`
                    : 'You can add or drop offerings for this semester.'
                }
              />
            ) : (
              <RegistrationStatusNotice
                tone="info"
                title="Registration is closed"
                body={
                  overCapNow
                    ? 'Course registration is closed. Drop courses until you are within the credit cap. Academic Admin sets that cap on the calendar.'
                    : 'Course registration is closed for this semester. Academic Admin opens it on the calendar. You can still see what you already registered.'
                }
              />
            )}
            {overCredit ? (
              <RegistrationStatusNotice
                tone="warning"
                title="Credit limit"
                body={
                  extraCredits > 0
                    ? `You cannot register more than ${data.maxCredits} credits. Uncheck a course, or drop one you already registered.`
                    : `You have ${data.registeredCredits} of ${data.maxCredits} credits. Drop a course before you add another.`
                }
              />
            ) : null}

            <div className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3">Already registered</h2>
              {registered.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>None yet.</p>
              ) : (
                <>
                  {registered.map((row) => (
                    <div
                      key={row.offeringId}
                      className="flex items-center gap-3 py-2"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <p className="text-sm flex-1 min-w-0">
                        {row.code} · {row.name} · {row.credits} cr
                      </p>
                      {canDrop ? (
                        <IconActionButton
                          label={`Drop ${row.code}`}
                          icon={Trash2}
                          danger
                          disabled={mutation.isPending}
                          onClick={() => setDropTarget(row)}
                        />
                      ) : null}
                    </div>
                  ))}
                  <p
                    className="t-caption pt-3"
                    style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    {totalsLabel}
                  </p>
                </>
              )}
            </div>

            <div className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3">Available</h2>
              <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
                These are the courses for your programme and department this semester.
              </p>
              {available.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No extra offerings for your programme this semester.</p>
              ) : (
                <>
                  {closedOfferings.length > 0 && data.registrationOpen ? (
                    <p className="t-caption mb-2" style={{ color: 'var(--muted-foreground)' }}>
                      A course marked Closed is off for this offering. Academic Admin opens it on Edit Course.
                    </p>
                  ) : null}
                  {available.map((row) => {
                    const rowOpen = canSelect && row.openForRegistration !== false
                    return (
                      <label key={row.offeringId} className="flex items-center gap-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <Checkbox
                          checked={selected.includes(row.offeringId)}
                          disabled={!rowOpen}
                          onCheckedChange={(checked) => {
                            setSelected((prev) =>
                              checked ? [...prev, row.offeringId] : prev.filter((id) => id !== row.offeringId),
                            )
                          }}
                        />
                        <span className="text-sm flex-1 min-w-0">
                          {row.code} · {row.name} · {row.credits} cr · {row.type}
                        </span>
                        {row.openForRegistration === false ? (
                          <span className="t-label px-2 py-0.5 shrink-0" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                            Closed
                          </span>
                        ) : null}
                      </label>
                    )
                  })}
                </>
              )}
            </div>

            <Button
              disabled={!addIds.length || data.feeHold || !data.registrationOpen || overCredit || mutation.isPending}
              onClick={() => setConfirmAdd(true)}
            >
              Confirm registration
            </Button>
          </>
        ) : null}
      </div>

      <ConfirmAlertDialog
        open={dropTarget !== null}
        onOpenChange={(open) => { if (!open) setDropTarget(null) }}
        title={`Drop ${dropTarget?.code}?`}
        tone="destructive"
        headline="Drop course"
        summary={`${dropTarget?.code} · ${dropTarget?.name} will be removed from this semester (${dropTarget?.credits} credits).`}
        notices={[
          { icon: 'trash', label: 'You can add it again while registration is open, if you still have credit room.' },
        ]}
        confirmLabel={mutation.isPending ? 'Dropping…' : 'Drop course'}
        confirmVariant="destructive"
        loading={mutation.isPending}
        onConfirm={() => {
          if (!dropTarget) return
          mutation.mutate({ offeringIds: [], dropOfferingIds: [dropTarget.offeringId] })
        }}
      />

      <ConfirmAlertDialog
        open={confirmAdd}
        onOpenChange={(open) => { if (!open) setConfirmAdd(false) }}
        title="Save these courses?"
        tone="success"
        headline="Update registration"
        summary={`Add ${addIds.length} offering${addIds.length === 1 ? '' : 's'} to your semester list.`}
        notices={[
          { icon: 'info', label: 'You can drop a registered course from this page while registration is open.' },
        ]}
        confirmLabel={mutation.isPending ? 'Saving…' : 'Confirm'}
        confirmVariant="brand"
        loading={mutation.isPending}
        onConfirm={() => {
          const input: RegisterCoursesRequest = { offeringIds: addIds, dropOfferingIds: [] }
          mutation.mutate(input)
        }}
      />
    </StudentShell>
  )
}

function RegistrationStatusNotice({
  tone,
  title,
  body,
}: {
  tone: 'info' | 'warning' | 'error'
  title: string
  body: string
}) {
  const palette =
    tone === 'error'
      ? { bg: 'var(--error-bg)', border: 'var(--error)', color: 'var(--error)' }
      : tone === 'warning'
        ? { bg: 'var(--warning-bg)', border: 'var(--warning)', color: 'var(--warning)' }
        : { bg: 'var(--info-bg)', border: 'var(--info)', color: 'var(--info)' }
  const Icon = tone === 'info' ? Info : AlertCircle

  return (
    <div
      className="mb-4 flex gap-3 p-4"
      style={{
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 'var(--radius-xl)',
      }}
    >
      <Icon className="shrink-0 mt-0.5" style={{ width: 18, height: 18, color: palette.color }} />
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: palette.color }}>{title}</p>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--foreground)' }}>{body}</p>
      </div>
    </div>
  )
}
