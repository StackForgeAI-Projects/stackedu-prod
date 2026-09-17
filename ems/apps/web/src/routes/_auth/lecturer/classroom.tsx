import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LecturerShell } from '@/components/LecturerShell'
import { ClassroomSessionList } from '@/components/classroom/ClassroomSessionList'
import { apiErrorMessage } from '@/lib/api/client'
import {
  lecturerClassroomQueryKey,
  lecturerCoursesQueryKey,
  listLecturerClassroomSessions,
  listLecturerCourses,
} from '@/lib/api/lecturer'

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

  return (
    <LecturerShell pageTitle="Classroom" guide="Schedule and run live classes for the courses assigned to you. Students join once a class is live. Recordings and summaries stay on the class page.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px', maxWidth: 900, margin: '0 auto' }}>
        <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Classroom</h1>
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>Live video, whiteboard, recording and class summaries.</p>
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
