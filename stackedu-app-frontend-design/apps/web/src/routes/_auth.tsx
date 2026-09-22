import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

// Pathless layout route — wraps all authenticated routes.
// TODO: Replace stub auth check with real session validation.
export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const isAuthenticated = true // stub — replace with session check
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return <Outlet />
}
