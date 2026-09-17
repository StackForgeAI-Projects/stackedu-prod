import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { StudentShell } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getStudentRegistration,
  registerStudentCourses,
  studentCoursesQueryKey,
  studentDashboardQueryKey,
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
  const [selected, setSelected] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: registerStudentCourses,
    onSuccess: async () => {
      toast.success('Courses registered.')
      await queryClient.invalidateQueries({ queryKey: studentRegistrationQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentCoursesQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey })
      void navigate({ to: '/student/courses' })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not register those courses.')),
  })

  const available = data?.offerings.filter((row) => !row.registered) ?? []
  const extraCredits = available
    .filter((row) => selected.includes(row.offeringId) && row.openForRegistration)
    .reduce((sum, row) => sum + row.credits, 0)
  const overCredit = Boolean(data && data.registeredCredits + extraCredits > data.maxCredits)
  const canSelect = Boolean(data?.registrationOpen && !data.feeHold)
  const closedOfferings = available.filter((row) => !row.openForRegistration)

  return (
    <StudentShell pageTitle="Course registration" guide="Add offerings while registration is open and you have no fee hold. Academic Admin opens the semester; the Bursar clears holds.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Register for courses</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading offerings…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load registration.')}</p>
        ) : data ? (
          <>
            <p className="t-body mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {data.registeredCredits} of {data.maxCredits} credits used
            </p>
            {data.feeHold ? (
              <RegistrationStatusNotice
                tone="error"
                title="Fee hold"
                body="A fee hold is blocking registration. Pay fees, then ask the Bursar to release the hold."
              />
            ) : null}
            {data.registrationOpen ? (
              <RegistrationStatusNotice
                tone="info"
                title="Registration is open"
                body={
                  data.registrationClosesAt
                    ? `You can add offerings for this semester. Registration closes on ${formatDateShort(data.registrationClosesAt)}.`
                    : 'You can add offerings for this semester.'
                }
              />
            ) : (
              <RegistrationStatusNotice
                tone="info"
                title="Registration is closed"
                body="Course registration is closed for this semester. Academic Admin opens it on the calendar. You can still see what you already registered."
              />
            )}
            {overCredit ? (
              <RegistrationStatusNotice
                tone="warning"
                title="Credit limit"
                body={
                  extraCredits > 0
                    ? `You cannot register more than ${data.maxCredits} credits. Uncheck a course to continue.`
                    : `You already have ${data.registeredCredits} of ${data.maxCredits} credits. You cannot add more courses.`
                }
              />
            ) : null}

            <div className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3">Already registered</h2>
              {data.offerings.filter((row) => row.registered).length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>None yet.</p>
              ) : data.offerings.filter((row) => row.registered).map((row) => (
                <p key={row.offeringId} className="text-sm py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  {row.code} · {row.name} · {row.credits} cr
                </p>
              ))}
            </div>

            <div className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3">Available</h2>
              {available.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No extra offerings to add.</p>
              ) : (
                <>
                  {closedOfferings.length > 0 && data.registrationOpen ? (
                    <p className="t-caption mb-2" style={{ color: 'var(--muted-foreground)' }}>
                      A course marked Closed is off for this offering. Academic Admin opens it on Edit Course.
                    </p>
                  ) : null}
                  {available.map((row) => {
                    const rowOpen = canSelect && row.openForRegistration
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
                        {!row.openForRegistration ? (
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
              disabled={!selected.length || data.feeHold || !data.registrationOpen || data.registeredCredits + extraCredits > data.maxCredits || mutation.isPending}
              onClick={() => mutation.mutate(selected)}
            >
              Confirm registration
            </Button>
          </>
        ) : null}
      </div>
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
