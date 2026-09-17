import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { ClassroomSessionSummary, LecturerCourseRow } from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { PagedList } from '@/components/ListPagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  cancelLecturerClassroomSession,
  createLecturerClassroomSession,
  lecturerClassroomQueryKey,
  lecturerCourseQueryKey,
} from '@/lib/api/lecturer'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateShort, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

export function classroomStatusStyle(status: ClassroomSessionSummary['status']) {
  if (status === 'Live') return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (status === 'Scheduled') return { bg: 'var(--info-bg)', color: 'var(--info)' }
  if (status === 'Cancelled') return { bg: 'var(--error-bg)', color: 'var(--error)' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function sessionWhen(row: ClassroomSessionSummary) {
  const stamp = row.startedAt ?? row.scheduledAt ?? row.endedAt
  if (!stamp) return 'Unscheduled'
  return `${formatDateShort(stamp)} · ${formatTime(stamp)}`
}

export function ClassroomSessionList({
  role,
  sessions,
  offeringId,
  courses,
  empty,
  onChanged,
}: {
  role: 'lecturer' | 'student'
  sessions: ClassroomSessionSummary[]
  offeringId?: string
  courses?: LecturerCourseRow[]
  empty: string
  onChanged?: () => Promise<void>
}) {
  const sessionLinkClass = 'text-sm font-medium px-3 py-1.5 rounded-lg'

  return (
    <div>
      {role === 'lecturer' ? (
        <ScheduleClassForm offeringId={offeringId} courses={courses ?? []} onChanged={onChanged} />
      ) : null}
      {sessions.length === 0 ? (
        <div
          className="px-5 py-10 text-center"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
        >
          <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{empty}</p>
        </div>
      ) : (
        <PagedList
          items={sessions}
          getKey={(row) => row.id}
          defaultPageSize={5}
          itemLabel="classes"
          renderItem={(row) => (
            <div
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.title}</p>
                  <span
                    className="t-label px-2 py-0.5"
                    style={{
                      backgroundColor: classroomStatusStyle(row.status).bg,
                      color: classroomStatusStyle(row.status).color,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {row.courseCode} · {sessionWhen(row)}
                  {row.hasRecording ? ' · Recording' : ''}
                  {row.hasSummary ? ' · Summary' : ''}
                  {row.participantCount ? ` · ${row.participantCount} joined` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {role === 'lecturer' && row.status === 'Scheduled' ? (
                  <CancelClassButton session={row} onChanged={onChanged} />
                ) : null}
                {role === 'lecturer' ? (
                  <Link
                    to="/lecturer/classroom-session"
                    search={{ id: row.id }}
                    className={sessionLinkClass}
                    style={{
                      backgroundColor: row.status === 'Live' ? 'var(--brand)' : 'var(--muted)',
                      color: row.status === 'Live' ? 'var(--brand-ink)' : 'var(--foreground)',
                      textDecoration: 'none',
                    }}
                  >
                    {row.status === 'Live' ? 'Join' : 'Open'}
                  </Link>
                ) : (
                  <Link
                    to="/student/classroom-session"
                    search={{ id: row.id }}
                    className={sessionLinkClass}
                    style={{
                      backgroundColor: row.status === 'Live' ? 'var(--brand)' : 'var(--muted)',
                      color: row.status === 'Live' ? 'var(--brand-ink)' : 'var(--foreground)',
                      textDecoration: 'none',
                    }}
                  >
                    {row.status === 'Live' ? 'Join' : 'Open'}
                  </Link>
                )}
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}

function ScheduleClassForm({
  offeringId,
  courses,
  onChanged,
}: {
  offeringId?: string
  courses: LecturerCourseRow[]
  onChanged?: () => Promise<void>
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [courseId, setCourseId] = useState(offeringId ?? '')
  const selected = offeringId || courseId || courses[0]?.offeringId || ''

  const mutation = useMutation({
    mutationFn: () =>
      createLecturerClassroomSession({
        offeringId: selected,
        title: title.trim(),
        scheduledAt: when ? new Date(when).toISOString() : undefined,
      }),
    onSuccess: async () => {
      toast.success('Live class scheduled.')
      setTitle('')
      setWhen('')
      await queryClient.invalidateQueries({ queryKey: lecturerClassroomQueryKey() })
      await queryClient.invalidateQueries({ queryKey: lecturerClassroomQueryKey(selected) })
      await queryClient.invalidateQueries({ queryKey: lecturerCourseQueryKey(selected) })
      await onChanged?.()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not schedule that class.')),
  })

  if (!selected) return null

  return (
    <div
      className="mb-4 p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
    >
      <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>Schedule a live class</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Week 3 live class" />
        <Input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
      </div>
      {!offeringId && courses.length > 0 ? (
        <select
          value={selected}
          onChange={(event) => setCourseId(event.target.value)}
          className="h-10 rounded-lg px-3 text-sm"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          {courses.map((course) => (
            <option key={course.offeringId} value={course.offeringId}>
              {course.code} — {course.name}
            </option>
          ))}
        </select>
      ) : null}
      <ConfirmAlertDialog
        trigger={
          <Button
            disabled={title.trim().length < 2 || mutation.isPending}
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', alignSelf: 'flex-start' }}
          >
            Schedule class
          </Button>
        }
        title="Schedule this live class?"
        tone="success"
        headlineLabel="Action"
        headline="Create live class"
        summary={`"${title.trim() || 'This class'}" will appear for enrolled students.`}
        notices={[
          { icon: 'clock', label: when ? `Starts ${formatDateShort(when)} at ${formatTime(when)}.` : 'You can start it when you are ready.' },
          { icon: 'lock', label: 'Only assigned lecturers can start or record the class.' },
        ]}
        confirmLabel="Schedule"
        confirmVariant="brand"
        loading={mutation.isPending}
        onConfirm={async () => { await mutation.mutateAsync() }}
      />
    </div>
  )
}

function CancelClassButton({
  session,
  onChanged,
}: {
  session: ClassroomSessionSummary
  onChanged?: () => Promise<void>
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => cancelLecturerClassroomSession(session.id),
    onSuccess: async () => {
      toast.success('Class cancelled.')
      await queryClient.invalidateQueries({ queryKey: lecturerClassroomQueryKey() })
      await queryClient.invalidateQueries({ queryKey: lecturerCourseQueryKey(session.offeringId) })
      await onChanged?.()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not cancel that class.')),
  })

  return (
    <ConfirmAlertDialog
      trigger={
        <Button variant="outline" className="text-sm">
          Cancel
        </Button>
      }
      title="Cancel this class?"
      tone="destructive"
      headlineLabel="Action"
      headline="Cancel live class"
      summary={`"${session.title}" will no longer appear for students.`}
      notices={[{ icon: 'trash', label: 'A class that has already started cannot be cancelled. End it instead.' }]}
      confirmLabel="Cancel class"
      confirmVariant="destructive"
      loading={mutation.isPending}
      onConfirm={async () => { await mutation.mutateAsync() }}
    />
  )
}
