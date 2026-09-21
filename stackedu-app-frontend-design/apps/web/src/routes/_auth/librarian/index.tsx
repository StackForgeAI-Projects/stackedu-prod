import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/librarian/')({
  component: () => <Navigate to="/librarian/dashboard" />,
})
