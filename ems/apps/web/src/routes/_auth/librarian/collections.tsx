import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { formatAppDateDdMmYyyy } from '@stackedu/shared'
import { LibrarianShell } from '@/components/LibrarianShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { apiErrorMessage } from '@/lib/api/client'
import {
  createLibrarianCollection,
  deleteLibrarianCollection,
  librarianCollectionsQueryKey,
  listLibrarianCollections,
  updateLibrarianCollection,
} from '@/lib/api/library'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/librarian/collections')({
  component: CollectionsPage,
})

function CollectionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: librarianCollectionsQueryKey,
    queryFn: listLibrarianCollections,
  })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const editing = data?.find((item) => item.id === editId) ?? null

  const saveMutation = useMutation({
    mutationFn: () => (
      editing
        ? updateLibrarianCollection(editing.id, { name: name.trim(), description: description.trim() || undefined })
        : createLibrarianCollection({ name: name.trim(), description: description.trim() || undefined })
    ),
    onSuccess: async () => {
      toast.success(editing ? 'Collection updated.' : 'Collection created.')
      setSheetOpen(false)
      await queryClient.invalidateQueries({ queryKey: librarianCollectionsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save that collection.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLibrarianCollection,
    onSuccess: async () => {
      toast.success('Collection removed.')
      await queryClient.invalidateQueries({ queryKey: librarianCollectionsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that collection.')),
  })

  const openCreate = () => {
    setEditId(null)
    setName('')
    setDescription('')
    setSheetOpen(true)
  }

  return (
    <LibrarianShell pageTitle="Collections" guide="Group catalogue items into reading lists. Removing a collection does not delete the resources in it.">
      <div className="animate-fade-up px-4 py-6 sm:px-8" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Collections</h1>
          <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} onClick={openCreate}>
            Create collection
          </Button>
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading collections…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load collections.')}</p>
        ) : (data ?? []).length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No collections yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(data ?? []).map((item) => (
              <article
                key={item.id}
                className="p-5"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
              >
                <h2 className="text-sm font-semibold">{item.name}</h2>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {item.resourceCount} resource{item.resourceCount === 1 ? '' : 's'} · Updated {formatAppDateDdMmYyyy(item.updatedAt)}
                </p>
                {item.description ? <p className="mt-2 text-sm">{item.description}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate({ to: '/librarian/collection', search: { id: item.id } })}>
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditId(item.id)
                      setName(item.name)
                      setDescription(item.description ?? '')
                      setSheetOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <ConfirmAlertDialog
                    tone="destructive"
                    title="Delete this collection?"
                    headline="Delete collection"
                    summary={`"${item.name}" will be removed. Resources in it stay in the catalogue.`}
                    confirmVariant="destructive"
                    confirmLabel="Delete collection"
                    onConfirm={async () => { await deleteMutation.mutateAsync(item.id) }}
                    trigger={<Button variant="outline" size="sm">Delete</Button>}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 border-l flex flex-col sheet-md">
          <div className="px-6 pt-6 pb-4 pr-12" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetHeader className="text-left">
              <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>{editing ? 'Edit collection' : 'Create collection'}</SheetTitle>
              <FormInfoBox lines={editing ? formInfo.editCollection : formInfo.addCollection} />
            </SheetHeader>
          </div>
          <div className="flex flex-col gap-4 px-6 py-5">
            <div>
              <Label htmlFor="col-name">Name</Label>
              <Input id="col-name" className="mt-1" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="col-desc">Description</Label>
              <Textarea id="col-desc" className="mt-1" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <ConfirmAlertDialog
              tone={editing ? 'info' : 'success'}
              title={editing ? 'Save this collection?' : 'Create this collection?'}
              headline={editing ? 'Save collection' : 'Create collection'}
              summary={`"${name.trim() || 'This collection'}" will appear on the collections list.`}
              confirmLabel={editing ? 'Save' : 'Create'}
              onConfirm={async () => { await saveMutation.mutateAsync() }}
              trigger={
                <Button disabled={!name.trim() || saveMutation.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
                  {editing ? 'Save' : 'Create'}
                </Button>
              }
            />
          </div>
        </SheetContent>
      </Sheet>
    </LibrarianShell>
  )
}
