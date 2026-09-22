import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/student/')({
  component: StudentDashboardPlaceholder,
})

function StudentDashboardPlaceholder() {
  return <div className="p-8 t-h2">Student dashboard — coming soon.</div>
}
