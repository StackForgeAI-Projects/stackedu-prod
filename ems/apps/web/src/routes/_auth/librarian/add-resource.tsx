import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LibrarianShell } from '@/components/LibrarianShell'
import { LibraryResourceForm } from '@/components/library/LibraryResourceForm'
import {
  getLibraryAccessOptions,
  librarianAccessOptionsQueryKey,
  librarianResourcesQueryKey,
} from '@/lib/api/library'

export const Route = createFileRoute('/_auth/librarian/add-resource')({
  component: AddResourcePage,
})

function AddResourcePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accessQuery = useQuery({
    queryKey: librarianAccessOptionsQueryKey,
    queryFn: getLibraryAccessOptions,
  })

  return (
    <LibrarianShell
      pageTitle="Add resource"
      guide="Create the catalogue record first, attach the e-book file, and publish when it is ready for students."
    >
      <div className="animate-fade-up px-4 py-6 sm:px-8" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Add resource</h1>
        <LibraryResourceForm
          accessOptions={accessQuery.data}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: librarianResourcesQueryKey })
            await navigate({ to: '/librarian/catalogue' })
          }}
        />
      </div>
    </LibrarianShell>
  )
}
