import { createFileRoute, Link, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/bursar/')({
  beforeLoad: () => { throw redirect({ to: '/bursar/dashboard' }) },
  component: () => null,
})
