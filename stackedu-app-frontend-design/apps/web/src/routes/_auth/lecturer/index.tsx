import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/lecturer/')({
  component: LecturerDashboardPlaceholder,
})

function LecturerDashboardPlaceholder() {
  return <div className="p-8 t-h2">Lecturer dashboard — coming soon.</div>
}
