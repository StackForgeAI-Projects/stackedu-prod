import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/DataTable'
import { IctShell } from '@/components/IctShell'
import { AuditEntryPanel, IctDialog, TableActionButton } from '@/components/ict/IctPanels'
import { getIctAudit, ictAuditQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { displayRole } from '@/lib/humanize'
import { formatDateTime } from '@/lib/utils'

export const Route = createFileRoute('/_auth/ict/audit-log')({
  component: AuditLogPage,
})

function AuditLogPage() {
  const { data, isPending, error } = useQuery({ queryKey: ictAuditQueryKey, queryFn: getIctAudit })
  const [entryId, setEntryId] = useState<string | null>(null)
  const selected = data?.find((row) => row.id === entryId)

  return (
    <IctShell
      pageTitle="Audit log"
      guide="Every significant user action across the institution is appended here, including sign-ins and sign-outs. Entries cannot be edited or deleted, including by you."
    >
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Audit log</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading audit log…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the audit log.')}</p>
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(row) => row.id}
            searchPlaceholder="Search action, actor or target…"
            searchFilter={(row, query) =>
              `${row.summary} ${row.actionLabel} ${row.actorEmail ?? ''} ${displayRole(row.actorRole)}`
                .toLowerCase()
                .includes(query)
            }
            // Grouping keys off the stable label: the summary names the record
            // that was touched, so filtering on it would list one option per row.
            filters={[{ id: 'action', label: 'actions', getValue: (row) => row.actionLabel }]}
            empty="No audit entries yet."
            columns={[
              {
                id: 'when',
                header: 'When',
                value: (row) => row.createdAt,
                sortable: true,
                cell: (row) => <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
              },
              { id: 'who', header: 'Who', value: (row) => row.actorEmail ?? 'System', cell: (row) => row.actorEmail ?? 'System' },
              {
                id: 'action',
                header: 'Action',
                value: (row) => row.summary,
                sortable: true,
                cell: (row) => <span className="leading-snug">{row.summary}</span>,
              },
              {
                id: 'open',
                header: '',
                cell: (row) => <TableActionButton onClick={() => setEntryId(row.id)}>View</TableActionButton>,
                className: 'text-right',
              },
            ]}
          />
        )}
      </div>

      <IctDialog
        open={Boolean(entryId)}
        onOpenChange={(open) => { if (!open) setEntryId(null) }}
        title={selected?.summary ?? 'Audit entry'}
        description="A single append-only record of who changed what, and when."
      >
        {entryId ? <AuditEntryPanel id={entryId} /> : null}
      </IctDialog>
    </IctShell>
  )
}
