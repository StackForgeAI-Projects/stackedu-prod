import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { queryClient } from './lib/query-client'
import { installStaleChunkRecovery } from './lib/chunk-reload'
import { ensureFreshClientBuild } from './lib/client-build'
import { initBrandColor } from './lib/brand-theme'
import { initTheme } from './lib/theme'
import './styles.css'

initTheme()
initBrandColor()
ensureFreshClientBuild()
installStaleChunkRecovery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
