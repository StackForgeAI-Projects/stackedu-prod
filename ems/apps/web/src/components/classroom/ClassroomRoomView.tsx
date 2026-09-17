import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { ClassroomJoin, ClassroomSessionDetail } from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { ClassroomWhiteboard } from '@/components/classroom/ClassroomWhiteboard'
import { classroomStatusStyle } from '@/components/classroom/ClassroomSessionList'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api/client'
import {
  draftLecturerClassroomSummary,
  endLecturerClassroomSession,
  getLecturerClassroomSession,
  getLecturerClassroomWhiteboard,
  getLecturerRecordingDownloadUrl,
  joinLecturerClassroomSession,
  lecturerClassroomQueryKey,
  lecturerClassroomSessionQueryKey,
  publishLecturerClassroomSummary,
  saveLecturerClassroomWhiteboard,
  startLecturerClassroomSession,
  startLecturerRecording,
  stopLecturerRecording,
} from '@/lib/api/lecturer'
import {
  getStudentClassroomSession,
  getStudentClassroomWhiteboard,
  getStudentRecordingDownloadUrl,
  joinStudentClassroomSession,
  saveStudentClassroomWhiteboard,
  studentClassroomQueryKey,
  studentClassroomSessionQueryKey,
} from '@/lib/api/student'
import { formatDateShort, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

export function ClassroomRoomView({
  role,
  sessionId,
}: {
  role: 'lecturer' | 'student'
  sessionId: string
}) {
  const queryClient = useQueryClient()
  const [join, setJoin] = useState<ClassroomJoin | null>(null)
  const sessionQuery = useQuery({
    queryKey: role === 'lecturer' ? lecturerClassroomSessionQueryKey(sessionId) : studentClassroomSessionQueryKey(sessionId),
    queryFn: () =>
      role === 'lecturer' ? getLecturerClassroomSession(sessionId) : getStudentClassroomSession(sessionId),
    enabled: Boolean(sessionId),
  })
  const session = join?.session ?? sessionQuery.data

  const refresh = async (next?: ClassroomSessionDetail) => {
    if (next) {
      queryClient.setQueryData(
        role === 'lecturer' ? lecturerClassroomSessionQueryKey(sessionId) : studentClassroomSessionQueryKey(sessionId),
        next,
      )
    }
    await queryClient.invalidateQueries({ queryKey: lecturerClassroomQueryKey() })
    await queryClient.invalidateQueries({ queryKey: studentClassroomQueryKey })
  }

  const joinMutation = useMutation({
    mutationFn: () =>
      role === 'lecturer' ? joinLecturerClassroomSession(sessionId) : joinStudentClassroomSession(sessionId),
    onSuccess: async (payload) => {
      setJoin(payload)
      await refresh(payload.session)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not join that class.')),
  })

  const canEditBoard = Boolean(session && session.status === 'Live')
  const showLive = Boolean(join?.media && session?.status === 'Live')

  return (
    <div className="animate-fade-up" style={{ padding: '24px 16px 56px', maxWidth: 1100, margin: '0 auto' }}>
      {role === 'lecturer' ? (
        <Link to="/lecturer/classroom" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Classroom</Link>
      ) : (
        <Link to="/student/classroom" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Classroom</Link>
      )}
      {!sessionId ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose a class from Classroom.</p>
      ) : sessionQuery.isPending && !session ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading class…</p>
      ) : sessionQuery.error ? (
        <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(sessionQuery.error, 'Could not load that class.')}</p>
      ) : session ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{session.title}</h1>
                <span
                  className="t-label px-2 py-0.5"
                  style={{
                    backgroundColor: classroomStatusStyle(session.status).bg,
                    color: classroomStatusStyle(session.status).color,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {session.status}
                </span>
              </div>
              <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                {session.courseCode} {session.courseName}
                {session.scheduledAt ? ` · ${formatDateShort(session.scheduledAt)} ${formatTime(session.scheduledAt)}` : ''}
              </p>
            </div>
            <HostControls
              role={role}
              session={session}
              joined={Boolean(join)}
              joining={joinMutation.isPending}
              onJoin={() => joinMutation.mutate()}
              onChanged={refresh}
            />
          </div>

          {!session.mediaConfigured && session.status !== 'Ended' ? (
            <p className="t-body-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Live video is not configured yet. The whiteboard still works.
            </p>
          ) : null}

          {showLive ? (
            <div className="mb-4 overflow-hidden" style={{ minHeight: 280, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }} data-lk-theme="default">
              <LiveKitRoom
                serverUrl={join!.media!.url}
                token={join!.media!.token}
                connect
                audio
                video
                style={{ height: 420 }}
              >
                <VideoConference />
              </LiveKitRoom>
            </div>
          ) : session.status === 'Scheduled' && role === 'student' ? (
            <p className="t-body mb-4" style={{ color: 'var(--muted-foreground)' }}>This class has not started yet.</p>
          ) : null}

          <section className="mb-6">
            <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Whiteboard</h2>
            <ClassroomWhiteboard
              sessionId={sessionId}
              canEdit={canEditBoard}
              collab={join?.collab ?? null}
              loadScene={role === 'lecturer' ? getLecturerClassroomWhiteboard : getStudentClassroomWhiteboard}
              saveScene={role === 'lecturer' ? saveLecturerClassroomWhiteboard : saveStudentClassroomWhiteboard}
            />
          </section>

          {session.recordings.length > 0 ? (
            <section className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Recordings</h2>
              {session.recordings.map((row) => (
                <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="t-body-sm" style={{ color: 'var(--foreground)' }}>
                    {row.status} · {formatDateShort(row.createdAt)} {formatTime(row.createdAt)}
                    {row.durationSeconds ? ` · ${row.durationSeconds}s` : ''}
                  </p>
                  {row.status === 'Ready' ? (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const download = role === 'lecturer'
                            ? await getLecturerRecordingDownloadUrl(row.id)
                            : await getStudentRecordingDownloadUrl(row.id)
                          window.open(download.url, '_blank', 'noopener')
                        } catch (err) {
                          toast.error(apiErrorMessage(err, 'Could not open that recording.'))
                        }
                      }}
                    >
                      Download
                    </Button>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          {session.summaryText || (role === 'lecturer' && session.status === 'Ended') ? (
            <section className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Class summary</h2>
              {session.summaryText ? (
                <p className="t-body whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{session.summaryText}</p>
              ) : (
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No summary yet.</p>
              )}
              {role === 'lecturer' && session.status === 'Ended' ? (
                <SummaryControls session={session} onChanged={refresh} />
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function HostControls({
  role,
  session,
  joined,
  joining,
  onJoin,
  onChanged,
}: {
  role: 'lecturer' | 'student'
  session: ClassroomSessionDetail
  joined: boolean
  joining: boolean
  onJoin: () => void
  onChanged: (next?: ClassroomSessionDetail) => Promise<void>
}) {
  const queryClient = useQueryClient()
  const recording = session.recordings.some((row) => row.status === 'Pending')

  if (role === 'student') {
    if (session.status !== 'Live') return null
    return (
      <Button
        onClick={onJoin}
        disabled={joining || joined}
        style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
      >
        {joined ? 'In class' : joining ? 'Joining…' : 'Join class'}
      </Button>
    )
  }

  const startMutation = useMutation({
    mutationFn: () => startLecturerClassroomSession(session.id),
    onSuccess: async (next) => {
      toast.success('Class is live.')
      await onChanged(next)
      onJoin()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not start that class.')),
  })
  const endMutation = useMutation({
    mutationFn: () => endLecturerClassroomSession(session.id),
    onSuccess: async (next) => {
      toast.success('Class ended.')
      await queryClient.invalidateQueries({ queryKey: lecturerClassroomQueryKey() })
      await onChanged(next)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not end that class.')),
  })
  const recordMutation = useMutation({
    mutationFn: () => (recording ? stopLecturerRecording(session.id) : startLecturerRecording(session.id)),
    onSuccess: async (next) => {
      toast.success(recording ? 'Recording stopped.' : 'Recording started.')
      await onChanged(next)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update the recording.')),
  })

  return (
    <div className="flex flex-wrap gap-2">
      {session.status === 'Scheduled' ? (
        <ConfirmAlertDialog
          trigger={
            <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Start class</Button>
          }
          title="Start this class?"
          tone="success"
          headlineLabel="Action"
          headline="Go live"
          summary={`"${session.title}" will open for enrolled students.`}
          notices={[{ icon: 'lock', label: 'Students can join once the class is live.' }]}
          confirmLabel="Start"
          confirmVariant="brand"
          loading={startMutation.isPending}
          onConfirm={async () => { await startMutation.mutateAsync() }}
        />
      ) : null}
      {session.status === 'Live' && !joined ? (
        <Button onClick={onJoin} disabled={joining} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
          {joining ? 'Joining…' : 'Join as host'}
        </Button>
      ) : null}
      {session.status === 'Live' ? (
        <>
          <ConfirmAlertDialog
            trigger={<Button variant="outline">{recording ? 'Stop recording' : 'Record'}</Button>}
            title={recording ? 'Stop recording?' : 'Start recording?'}
            tone={recording ? 'warning' : 'info'}
            headlineLabel="Action"
            headline={recording ? 'Stop recording' : 'Record this class'}
            summary={recording ? 'The recording will be stored and offered to enrolled students when it is ready.' : 'The recording is written to object storage, not to the database.'}
            notices={[{ icon: 'file', label: 'Recordings need R2 object storage. Local disk cannot receive a live recording.' }]}
            confirmLabel={recording ? 'Stop' : 'Record'}
            confirmVariant={recording ? 'warning' : 'brand'}
            loading={recordMutation.isPending}
            onConfirm={async () => { await recordMutation.mutateAsync() }}
          />
          <ConfirmAlertDialog
            trigger={<Button variant="outline">End class</Button>}
            title="End this class?"
            tone="destructive"
            headlineLabel="Action"
            headline="End live class"
            summary={`"${session.title}" will close. Students will drop from the room.`}
            notices={[{ icon: 'clock', label: 'You can draft a summary after the class ends.' }]}
            confirmLabel="End class"
            confirmVariant="destructive"
            loading={endMutation.isPending}
            onConfirm={async () => { await endMutation.mutateAsync() }}
          />
        </>
      ) : null}
    </div>
  )
}

function SummaryControls({
  session,
  onChanged,
}: {
  session: ClassroomSessionDetail
  onChanged: (next?: ClassroomSessionDetail) => Promise<void>
}) {
  const draftMutation = useMutation({
    mutationFn: () => draftLecturerClassroomSummary(session.id),
    onSuccess: async (next) => {
      toast.success('Summary drafted.')
      await onChanged(next)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not draft that summary.')),
  })
  const publishMutation = useMutation({
    mutationFn: () => publishLecturerClassroomSummary(session.id),
    onSuccess: async (next) => {
      toast.success('Summary published to students.')
      await onChanged(next)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not publish that summary.')),
  })

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <ConfirmAlertDialog
        trigger={<Button variant="outline">Draft summary</Button>}
        title="Draft a class summary?"
        tone="info"
        headlineLabel="Action"
        headline="Write summary"
        summary="A short recap is drafted for you to review before students can see it."
        notices={[{ icon: 'lock', label: 'Students only see the summary after you publish it.' }]}
        confirmLabel="Draft"
        confirmVariant="brand"
        loading={draftMutation.isPending}
        onConfirm={async () => { await draftMutation.mutateAsync() }}
      />
      {session.summaryText && !session.summaryPublished ? (
        <ConfirmAlertDialog
          trigger={<Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Publish to students</Button>}
          title="Publish this summary?"
          tone="success"
          headlineLabel="Action"
          headline="Publish summary"
          summary="Enrolled students will see this recap on the class page."
          notices={[{ icon: 'file', label: 'You can draft again later if you need to replace it.' }]}
          confirmLabel="Publish"
          confirmVariant="brand"
          loading={publishMutation.isPending}
          onConfirm={async () => { await publishMutation.mutateAsync() }}
        />
      ) : null}
    </div>
  )
}
