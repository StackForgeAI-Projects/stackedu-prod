import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { formatAppDateDdMmYyyy } from '@stackedu/shared'
import { DataTable } from '@/components/DataTable'
import { LibrarianShell } from '@/components/LibrarianShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { apiErrorMessage } from '@/lib/api/client'
import {
  declineLibrarianRequest,
  fulfilLibrarianRequest,
  librarianRequestsQueryKey,
  librarianResourcesQueryKey,
  listLibrarianRequests,
  listLibrarianResources,
} from '@/lib/api/library'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/librarian/requests')({
  component: RequestsPage,
})

function RequestsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: librarianRequestsQueryKey,
    queryFn: listLibrarianRequests,
  })
  const catalogue = useQuery({
    queryKey: librarianResourcesQueryKey,
    queryFn: () => listLibrarianResources(),
  })
  const [fulfilId, setFulfilId] = useState<string | null>(null)
  const [declineId, setDeclineId] = useState<string | null>(null)
  const [linkedId, setLinkedId] = useState('')
  const [declineReason, setDeclineReason] = useState('')

  const fulfilMutation = useMutation({
    mutationFn: () => fulfilLibrarianRequest(fulfilId!, { resourceId: linkedId || undefined }),
    onSuccess: async () => {
      toast.success('Request fulfilled. The requester has been notified.')
      setFulfilId(null)
      setLinkedId('')
      await queryClient.invalidateQueries({ queryKey: librarianRequestsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not fulfil that request.')),
  })

  const declineMutation = useMutation({
    mutationFn: () => declineLibrarianRequest(declineId!, { reason: declineReason.trim() }),
    onSuccess: async () => {
      toast.success('Request declined. The requester has been notified.')
      setDeclineId(null)
      setDeclineReason('')
      await queryClient.invalidateQueries({ queryKey: librarianRequestsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not decline that request.')),
  })

  const pending = (data ?? []).filter((row) => row.status === 'Pending').length

  return (
    <LibrarianShell pageTitle="Resource Requests" guide="Students and lecturers ask for titles the catalogue does not hold. Fulfil by linking an existing resource, or decline with a reason.">
      <div className="animate-fade-up px-4 py-6 sm:px-8" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Resource Requests</h1>
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{pending} pending</p>
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading requests…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load requests.')}</p>
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(row) => row.id}
            searchPlaceholder="Search title or requester…"
            searchFilter={(row, query) => `${row.title} ${row.requesterName}`.toLowerCase().includes(query)}
            filters={[{ id: 'status', label: 'status', allLabel: 'All statuses', getValue: (row) => row.status }]}
            empty="No requests yet."
            columns={[
              {
                id: 'title',
                header: 'Title',
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{row.author ?? row.reason ?? '—'}</p>
                  </div>
                ),
              },
              { id: 'who', header: 'From', cell: (row) => `${row.requesterName} · ${row.requesterRole}` },
              { id: 'status', header: 'Status', cell: (row) => row.status },
              { id: 'date', header: 'Submitted', cell: (row) => formatAppDateDdMmYyyy(row.createdAt) },
              {
                id: 'actions',
                header: '',
                cell: (row) => row.status === 'Pending' ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => setFulfilId(row.id)}>Fulfil</Button>
                    <Button size="sm" variant="outline" onClick={() => setDeclineId(row.id)}>Decline</Button>
                  </div>
                ) : null,
              },
            ]}
          />
        )}
      </div>

      <Sheet open={Boolean(fulfilId)} onOpenChange={(open) => { if (!open) setFulfilId(null) }}>
        <SheetContent side="right" className="p-0 border-l flex flex-col sheet-md">
          <div className="px-6 pt-6 pb-4 pr-12" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetHeader className="text-left">
              <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>Fulfil request</SheetTitle>
              <FormInfoBox lines={formInfo.fulfilRequest} />
            </SheetHeader>
          </div>
          <div className="flex flex-col gap-4 px-6 py-5">
            <div>
              <Label>Link an existing resource (optional)</Label>
              <select
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
                value={linkedId}
                onChange={(event) => setLinkedId(event.target.value)}
              >
                <option value="">Mark fulfilled without linking</option>
                {(catalogue.data ?? []).map((row) => (
                  <option key={row.id} value={row.id}>{row.title}</option>
                ))}
              </select>
            </div>
            <ConfirmAlertDialog
              tone="success"
              title="Fulfil this request?"
              headline="Fulfil request"
              summary="The requester is notified in the app."
              confirmLabel="Fulfil"
              onConfirm={async () => { await fulfilMutation.mutateAsync() }}
              trigger={<Button disabled={fulfilMutation.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Fulfil</Button>}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(declineId)} onOpenChange={(open) => { if (!open) setDeclineId(null) }}>
        <SheetContent side="right" className="p-0 border-l flex flex-col sheet-md">
          <div className="px-6 pt-6 pb-4 pr-12" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetHeader className="text-left">
              <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>Decline request</SheetTitle>
              <FormInfoBox lines={formInfo.declineRequest} />
            </SheetHeader>
          </div>
          <div className="flex flex-col gap-4 px-6 py-5">
            <div>
              <Label htmlFor="decline-reason">Reason</Label>
              <Textarea id="decline-reason" className="mt-1" rows={4} value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} />
            </div>
            <ConfirmAlertDialog
              tone="destructive"
              title="Decline this request?"
              headline="Decline request"
              summary="The requester is notified with your reason."
              confirmVariant="destructive"
              confirmLabel="Decline"
              onConfirm={async () => { await declineMutation.mutateAsync() }}
              trigger={<Button disabled={!declineReason.trim() || declineMutation.isPending}>Decline</Button>}
            />
          </div>
        </SheetContent>
      </Sheet>
    </LibrarianShell>
  )
}
