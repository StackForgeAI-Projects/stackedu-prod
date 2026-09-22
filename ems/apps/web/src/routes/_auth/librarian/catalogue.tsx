import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Archive, Download, Pencil } from 'lucide-react'
import type { LibraryResource } from '@stackedu/shared'
import { formatAppDateDdMmYyyy, RESOURCE_TYPE_LABELS } from '@stackedu/shared'
import { DataTable } from '@/components/DataTable'
import { LibrarianShell } from '@/components/LibrarianShell'
import { LibraryResourceForm } from '@/components/library/LibraryResourceForm'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { IconActionButton } from '@/components/IconActionButton'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLibraryAccessOptions,
  getLibrarianDownload,
  librarianAccessOptionsQueryKey,
  librarianResourcesQueryKey,
  listLibrarianResources,
  updateLibrarianResource,
} from '@/lib/api/library'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/librarian/catalogue')({
  component: CataloguePage,
})

function CataloguePage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: librarianResourcesQueryKey,
    queryFn: () => listLibrarianResources(),
  })
  const accessQuery = useQuery({
    queryKey: librarianAccessOptionsQueryKey,
    queryFn: getLibraryAccessOptions,
  })
  const [editing, setEditing] = useState<LibraryResource | null | 'new'>(null)
  const [unpublishTarget, setUnpublishTarget] = useState<LibraryResource | null>(null)

  const archiveMutation = useMutation({
    mutationFn: (id: string) => updateLibrarianResource(id, { isPublished: false }),
    onSuccess: async () => {
      toast.success('Resource unpublished.')
      setUnpublishTarget(null)
      await queryClient.invalidateQueries({ queryKey: librarianResourcesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not unpublish that resource.')),
  })

  return (
    <LibrarianShell
      pageTitle="Resource Catalogue"
      guide="Add e-books in PDF, Word, EPUB or other formats. Saving a file drafts a description and subject tags, then students can download a signed copy after you publish."
    >
      <div className="px-4 sm:px-8 py-6 animate-fade-up" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Resource Catalogue</h1>
          <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} onClick={() => setEditing('new')}>
            Add resource
          </Button>
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading catalogue…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the catalogue.')}</p>
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(row) => row.id}
            searchPlaceholder="Search title or author…"
            searchFilter={(row, query) => `${row.title} ${row.author ?? ''}`.toLowerCase().includes(query)}
            filters={[
              { id: 'type', label: 'types', getValue: (row) => RESOURCE_TYPE_LABELS[row.type] },
              { id: 'status', label: 'status', allLabel: 'All statuses', getValue: (row) => (row.isPublished ? 'Published' : 'Draft') },
            ]}
            empty="No resources in the catalogue yet."
            columns={[
              {
                id: 'title',
                header: 'Title',
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{row.author ?? '—'}</p>
                  </div>
                ),
              },
              {
                id: 'type',
                header: 'Type',
                cell: (row) => RESOURCE_TYPE_LABELS[row.type],
              },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => (row.isPublished ? 'Published' : 'Draft'),
              },
              {
                id: 'added',
                header: 'Added',
                cell: (row) => formatAppDateDdMmYyyy(row.createdAt),
              },
              {
                id: 'actions',
                header: '',
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  {row.files[0] ? (
                    <IconActionButton
                      label="Download file"
                      icon={Download}
                      onClick={() => {
                        void (async () => {
                          try {
                            const target = await getLibrarianDownload(row.id)
                            window.open(target.url, '_blank', 'noopener,noreferrer')
                          } catch (err) {
                            toast.error(apiErrorMessage(err, 'Could not open that file.'))
                          }
                        })()
                      }}
                    />
                  ) : null}
                  <IconActionButton label="Edit resource" icon={Pencil} onClick={() => setEditing(row)} />
                  {row.isPublished ? (
                    <IconActionButton label="Unpublish resource" icon={Archive} onClick={() => setUnpublishTarget(row)} />
                  ) : null}
                </div>
              ),
              },
            ]}
          />
        )}
      </div>

      <ConfirmAlertDialog
        open={unpublishTarget !== null}
        onOpenChange={(open) => { if (!open) setUnpublishTarget(null) }}
        tone="warning"
        title="Unpublish this resource?"
        headline="Unpublish"
        summary={`"${unpublishTarget?.title}" will leave the student and lecturer catalogues.`}
        confirmLabel={archiveMutation.isPending ? 'Unpublishing…' : 'Unpublish'}
        loading={archiveMutation.isPending}
        onConfirm={() => { if (unpublishTarget) archiveMutation.mutate(unpublishTarget.id) }}
      />

      <Sheet open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          <div className="px-6 pt-6 pb-4 pr-12" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetHeader className="text-left">
              <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>
                {editing && editing !== 'new' ? 'Edit resource' : 'Add resource'}
              </SheetTitle>
              <FormInfoBox lines={editing && editing !== 'new' ? formInfo.editLibraryResource : formInfo.addLibraryResource} />
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <LibraryResourceForm
              key={editing === 'new' ? 'new' : editing?.id}
              resource={editing && editing !== 'new' ? editing : null}
              accessOptions={accessQuery.data}
              onSaved={async () => {
                setEditing(null)
                await queryClient.invalidateQueries({ queryKey: librarianResourcesQueryKey })
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </LibrarianShell>
  )
}
