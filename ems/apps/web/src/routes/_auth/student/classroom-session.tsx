import { createFileRoute } from '@tanstack/react-router'
import { StudentShell } from '@/components/StudentShell'
import { ClassroomRoomView } from '@/components/classroom/ClassroomRoomView'

export const Route = createFileRoute('/_auth/student/classroom-session')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: StudentClassroomSessionPage,
})

function StudentClassroomSessionPage() {
  const { id } = Route.useSearch()
  return (
    <StudentShell pageTitle="Live class" guide="Join the live room, use the whiteboard, and open published summaries or recordings after class.">
      <ClassroomRoomView role="student" sessionId={id} />
    </StudentShell>
  )
}
