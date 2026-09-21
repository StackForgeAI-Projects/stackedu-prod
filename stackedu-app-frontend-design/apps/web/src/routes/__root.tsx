import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}
