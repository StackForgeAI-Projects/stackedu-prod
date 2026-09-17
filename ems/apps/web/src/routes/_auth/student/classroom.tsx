import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { StudentShell } from '@/components/StudentShell'
import { ClassroomSessionList } from '@/components/classroom/ClassroomSessionList'
import { apiErrorMessage } from '@/lib/api/client'
import { listStudentClassroomSessions, studentClassroomQueryKey } from '@/lib/api/student'

export const Route = createFileRoute('/_auth/student/classroom')({
  component: StudentClassroomPage,
})

function StudentClassroomPage() {
  const queryClient = useQueryClient()
  const { data: sessions = [], isPending, error } = useQuery({
    queryKey: studentClassroomQueryKey,
    queryFn: listStudentClassroomSessions,
  })

  return (
    <StudentShell pageTitle="Classroom" guide="Join a live class once your lecturer starts it. After class, published summaries and recordings appear here.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px', maxWidth: 900, margin: '0 auto' }}>
        <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Classroom</h1>
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>Live classes for the courses you are enrolled on.</p>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading classes…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load classes.')}</p>
        ) : (
          <ClassroomSessionList
            role="student"
            sessions={sessions}
            empty="No live classes yet."
            onChanged={async () => {
              await queryClient.invalidateQueries({ queryKey: studentClassroomQueryKey })
            }}
          />
        )}
      </div>
    </StudentShell>
  )
}
