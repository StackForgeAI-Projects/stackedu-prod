import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { formatAppDateDdMmYyyy, RESOURCE_TYPE_LABELS } from '@stackedu/shared'
import { DataTable } from '@/components/DataTable'
import { LibrarianShell } from '@/components/LibrarianShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api/client'
import {
  addLibrarianCollectionItem,
  getLibrarianCollection,
  librarianCollectionQueryKey,
  librarianResourcesQueryKey,
  listLibrarianResources,
  removeLibrarianCollectionItem,
} from '@/lib/api/library'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/librarian/collection')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: CollectionDetailPage,
})

function CollectionDetailPage() {
  const { id } = Route.useSearch()
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: librarianCollectionQueryKey(id),
    queryFn: () => getLibrarianCollection(id),
    enabled: Boolean(id),
  })
  const catalogue = useQuery({
    queryKey: librarianResourcesQueryKey,
    queryFn: () => listLibrarianResources(),
  })
  const [addingId, setAddingId] = useState('')

  const addMutation = useMutation({
    mutationFn: () => addLibrarianCollectionItem(id, addingId),
    onSuccess: async () => {
      toast.success('Resource added to the collection.')
      setAddingId('')
      await queryClient.invalidateQueries({ queryKey: librarianCollectionQueryKey(id) })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not add that resource.')),
  })

  const removeMutation = useMutation({
    mutationFn: (resourceId: string) => removeLibrarianCollectionItem(id, resourceId),
    onSuccess: async () => {
      toast.success('Resource removed from the collection.')
      await queryClient.invalidateQueries({ queryKey: librarianCollectionQueryKey(id) })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not remove that resource.')),
  })

  const inCollection = new Set((data?.resources ?? []).map((row) => row.id))
  const addable = (catalogue.data ?? []).filter((row) => !inCollection.has(row.id))

  return (
    <LibrarianShell pageTitle="Collection">
      <div className="animate-fade-up px-4 py-6 sm:px-8" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link to="/librarian/collections" className="t-caption mb-3 inline-block" style={{ color: 'var(--brand)' }}>
          ← Collections
        </Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose a collection to open.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading collection…</p>
        ) : error || !data ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that collection.')}</p>
        ) : (
          <>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{data.name}</h1>
            <p className="t-caption mb-5" style={{ color: 'var(--muted-foreground)' }}>
              {data.resourceCount} resource{data.resourceCount === 1 ? '' : 's'} · Updated {formatAppDateDdMmYyyy(data.updatedAt)}
            </p>
            {data.description ? <p className="t-body mb-5">{data.description}</p> : null}

            <div className="mb-5 flex flex-col gap-2 sm:flex-row">
              <select
                className="rounded-lg px-3 py-2 text-sm"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                value={addingId}
                onChange={(event) => setAddingId(event.target.value)}
              >
                <option value="">Add a catalogue resource…</option>
                {addable.map((row) => (
                  <option key={row.id} value={row.id}>{row.title}</option>
                ))}
              </select>
              <ConfirmAlertDialog
                tone="success"
                title="Add this resource to the collection?"
                headline="Add to collection"
                summary="It stays in the catalogue and also appears on this list."
                confirmLabel="Add to collection"
                onConfirm={async () => { await addMutation.mutateAsync() }}
                trigger={<Button disabled={!addingId || addMutation.isPending}>Add</Button>}
              />
            </div>

            <DataTable
              rows={data.resources}
              rowKey={(row) => row.id}
              empty="This collection is empty."
              columns={[
                { id: 'title', header: 'Title', cell: (row) => row.title },
                { id: 'type', header: 'Type', cell: (row) => RESOURCE_TYPE_LABELS[row.type] },
                {
                  id: 'actions',
                  header: '',
                  cell: (row) => (
                    <ConfirmAlertDialog
                      tone="warning"
                      title="Remove from this collection?"
                      headline="Remove resource"
                      summary={`"${row.title}" stays in the catalogue.`}
                      confirmLabel="Remove"
                      onConfirm={async () => { await removeMutation.mutateAsync(row.id) }}
                      trigger={<Button variant="outline" size="sm">Remove</Button>}
                    />
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    </LibrarianShell>
  )
}
