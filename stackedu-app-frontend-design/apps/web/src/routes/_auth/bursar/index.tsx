import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/bursar/')({
  component: BursarDashboardPlaceholder,
})

function BursarDashboardPlaceholder() {
  return <div className="p-8 t-h2">Bursar dashboard — coming soon.</div>
}
