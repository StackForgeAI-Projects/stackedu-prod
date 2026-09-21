import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/academic/')({
  component: AcademicAdminDashboardPlaceholder,
})

function AcademicAdminDashboardPlaceholder() {
  return <div className="p-8 t-h2">Academic Admin dashboard — coming soon.</div>
}
