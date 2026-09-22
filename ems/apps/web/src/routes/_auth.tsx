import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { ClassroomLiveProvider } from '@/components/classroom/ClassroomLiveProvider'
import { loadSession } from '@/lib/auth/guards'
import { dashboardFor, roleForPath } from '@/lib/auth/portals'

/**
 * Guards every signed-in route.
 *
 * Runs before the screen loads, so a protected page is never rendered — even
 * briefly — to someone who may not see it. The server enforces the same rules
 * on every request; this check exists so the user is redirected somewhere
 * sensible rather than shown a screen full of failed calls.
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const user = await loadSession()
    if (!user) throw redirect({ to: '/login' })

    // Wrong portal for this role — send them to their own.
    const required = roleForPath(location.pathname)
    if (required && required !== user.role) {
      throw redirect({ to: dashboardFor(user.role) })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <ClassroomLiveProvider>
      <Outlet />
    </ClassroomLiveProvider>
  )
}
