import { createFileRoute } from '@tanstack/react-router'
import { LecturerShell } from '@/components/LecturerShell'
import { ClassroomRoomView } from '@/components/classroom/ClassroomRoomView'

export const Route = createFileRoute('/_auth/lecturer/classroom-session')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: LecturerClassroomSessionPage,
})

function LecturerClassroomSessionPage() {
  const { id } = Route.useSearch()
  return (
    <LecturerShell pageTitle="Live class" guide="Start the class, join the room, record if storage is configured, and draft a summary after you end it.">
      <ClassroomRoomView role="lecturer" sessionId={id} />
    </LecturerShell>
  )
}
