import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/ict/')({
  beforeLoad: () => { throw redirect({ to: '/ict/dashboard' }) },
  component: () => null,
})
