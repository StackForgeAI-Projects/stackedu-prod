import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Activity, UserPlus, Users, UserX } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { IctShell } from '@/components/IctShell'
import { AuditEntryPanel, IctDialog, TableActionButton } from '@/components/ict/IctPanels'
import { StatTile } from '@/components/StatTile'
import { getIctDashboard, ictDashboardQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { roleLabel } from '@/lib/auth/portals'
import { formatDateTime } from '@/lib/utils'

export const Route = createFileRoute('/_auth/ict/dashboard')({
  component: IctDashboardPage,
})

function IctDashboardPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ictDashboardQueryKey,
    queryFn: getIctDashboard,
  })
  const today = new Date()
  const hours = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const [entryId, setEntryId] = useState<string | null>(null)
  const selectedAudit = data?.recentAudit.find((row) => row.id === entryId)

  return (
    <IctShell
      pageTitle="Dashboard"
      guide="This is the institution control room. Create staff and student logins, set what each role may do, and review the audit trail. Opening a semester stays with Academic Admin."
    >
      {isPending ? (
        <p className="t-body p-8" style={{ color: 'var(--muted-foreground)' }}>Loading dashboard…</p>
      ) : error ? (
        <p className="t-body p-8" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the ICT dashboard.')}</p>
      ) : data ? (
        <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {greeting}, {data.profile.firstName}
          </h1>
          <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
            {data.profile.institutionName}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatTile icon={Users} iconColor="var(--brand)" iconBg="rgba(var(--brand-rgb),0.08)" label="PLATFORM USERS" value={String(data.totalUsers)} />
            <StatTile icon={Activity} iconColor="var(--success)" iconBg="var(--success-bg)" label="ACTIVE ACCOUNTS" value={String(data.activeUsers)} />
            <StatTile icon={UserPlus} iconColor="var(--info)" iconBg="var(--info-bg)" label="OPEN SESSIONS" value={String(data.activeSessions)} />
            <StatTile icon={UserX} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="ACTIVE REVOCATIONS" value={String(data.pendingRevocations)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section>
              <h2 className="t-h3 mb-3">Users by role</h2>
              <DataTable
                rows={data.usersByRole}
                rowKey={(row) => row.role}
                searchPlaceholder="Filter roles…"
                defaultPageSize={10}
                columns={[
                  { id: 'role', header: 'Role', value: (row) => roleLabel(row.role), sortable: true, cell: (row) => roleLabel(row.role) },
                  { id: 'count', header: 'Accounts', value: (row) => row.count, sortable: true, sortValue: (row) => row.count, cell: (row) => <span className="t-mono">{row.count}</span> },
                ]}
              />
            </section>
            <section>
              <div className="flex justify-between mb-3">
                <h2 className="t-h3">Recent audit</h2>
                <Link to="/ict/audit-log" className="text-sm" style={{ color: 'var(--success)' }}>View all →</Link>
              </div>
              <DataTable
                rows={data.recentAudit}
                rowKey={(row) => row.id}
                searchPlaceholder="Search audit…"
                defaultPageSize={10}
                empty="No audited actions yet."
                columns={[
                  { id: 'action', header: 'Action', value: (row) => row.summary, cell: (row) => <span className="leading-snug">{row.summary}</span> },
                  { id: 'who', header: 'Who', value: (row) => row.actorEmail ?? 'System', cell: (row) => row.actorEmail ?? 'System' },
                  {
                    id: 'when',
                    header: 'When',
                    value: (row) => row.createdAt,
                    sortable: true,
                    cell: (row) => formatDateTime(row.createdAt),
                  },
                  {
                    id: 'open',
                    header: '',
                    cell: (row) => <TableActionButton onClick={() => setEntryId(row.id)}>View</TableActionButton>,
                    className: 'text-right',
                  },
                ]}
              />
            </section>
          </div>
        </div>
      ) : null}

      <IctDialog
        open={Boolean(entryId)}
        onOpenChange={(open) => { if (!open) setEntryId(null) }}
        title={selectedAudit?.summary ?? 'Audit entry'}
        description="A single append-only record of who changed what, and when."
      >
        {entryId ? <AuditEntryPanel id={entryId} /> : null}
      </IctDialog>
    </IctShell>
  )
}
