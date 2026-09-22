import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LecturerShell } from '@/components/LecturerShell'
import { ClassroomSessionList } from '@/components/classroom/ClassroomSessionList'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Switch } from '@/components/ui/switch'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerClassroomPreferences,
  lecturerClassroomPreferencesQueryKey,
  lecturerClassroomQueryKey,
  lecturerCoursesQueryKey,
  listLecturerClassroomSessions,
  listLecturerCourses,
  saveLecturerClassroomPreferences,
} from '@/lib/api/lecturer'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/lecturer/classroom')({
  component: LecturerClassroomPage,
})

function LecturerClassroomPage() {
  const queryClient = useQueryClient()
  const { data: courses = [] } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const { data: sessions = [], isPending, error } = useQuery({
    queryKey: lecturerClassroomQueryKey(),
    queryFn: () => listLecturerClassroomSessions(),
  })
  const { data: preferences } = useQuery({
    queryKey: lecturerClassroomPreferencesQueryKey,
    queryFn: getLecturerClassroomPreferences,
  })
  const autoRecord = Boolean(preferences?.autoRecord)
  const autoRecordMutation = useMutation({
    mutationFn: (next: boolean) => saveLecturerClassroomPreferences({ autoRecord: next }),
    onSuccess: async (saved) => {
      toast.success(saved.autoRecord ? 'New live classes will record automatically.' : 'New live classes will not record automatically.')
      await queryClient.invalidateQueries({ queryKey: lecturerClassroomPreferencesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save that setting.')),
  })

  return (
    <LecturerShell pageTitle="Classroom" guide="Schedule and run live classes for the courses assigned to you. Students join once a class is live. Recordings and summaries stay on the class page.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px', maxWidth: 900, margin: '0 auto' }}>
        <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Classroom</h1>
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>Live video, whiteboard, recording and class summaries.</p>
        <div
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Automatically record live classes</p>
            <FormInfoBox lines={formInfo.autoRecordClassroom} />
          </div>
          <ConfirmAlertDialog
            trigger={
              <div className="flex items-center gap-2 shrink-0">
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{autoRecord ? 'On' : 'Off'}</span>
                <Switch checked={autoRecord} disabled={autoRecordMutation.isPending} onCheckedChange={() => undefined} />
              </div>
            }
            title={autoRecord ? 'Turn off automatic recording?' : 'Turn on automatic recording?'}
            tone="info"
            headlineLabel="Action"
            headline="Automatic class recording"
            summary={autoRecord
              ? 'New live classes will not start a recording unless you press Record.'
              : 'When you start a live class, a recording will start if storage is configured.'}
            notices={[{ icon: 'file', label: 'You can still start or stop a recording during a class.' }]}
            confirmLabel={autoRecord ? 'Turn off' : 'Turn on'}
            confirmVariant="brand"
            loading={autoRecordMutation.isPending}
            onConfirm={async () => { await autoRecordMutation.mutateAsync(!autoRecord) }}
          />
        </div>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading classes…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load classes.')}</p>
        ) : (
          <ClassroomSessionList
            role="lecturer"
            sessions={sessions}
            courses={courses}
            empty="No live classes yet. Schedule one for a course assigned to you."
            onChanged={async () => {
              await queryClient.invalidateQueries({ queryKey: lecturerClassroomQueryKey() })
            }}
          />
        )}
      </div>
    </LecturerShell>
  )
}
