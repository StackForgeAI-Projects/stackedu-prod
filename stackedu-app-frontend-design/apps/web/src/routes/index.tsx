import { createFileRoute, redirect } from '@tanstack/react-router'

// Root index — redirects to the demo role switcher during development.
// Once auth is wired, check session and redirect to role dashboard instead.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/demo' })
  },
  component: () => null,
})
