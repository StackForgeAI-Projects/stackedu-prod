import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { IctShell } from '@/components/IctShell'
import { IntegrationActionsPanel } from '@/components/ict/IctPanels'
import { getIctIntegrations, ictIntegrationsQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/ict/integration-detail')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: IntegrationDetailPage,
})

function IntegrationDetailPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: ictIntegrationsQueryKey,
    queryFn: getIctIntegrations,
  })
  const item = data?.find((row) => row.id === id)

  return (
    <IctShell pageTitle="Integration" guide="Save keys for this institution, then turn the service on. Secrets are hidden after save.">
      <div className="animate-fade-up" style={{ padding: '32px 16px 48px', maxWidth: 760, margin: '0 auto' }}>
        <Link to="/ict/integrations" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Integrations</Link>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load integrations.')}</p>
        ) : !item ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose an integration from the list.</p>
        ) : (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <h1 className="t-h1 mb-4" style={{ fontFamily: 'var(--font-display)' }}>{item.displayName}</h1>
            <IntegrationActionsPanel item={item} />
          </div>
        )}
      </div>
    </IctShell>
  )
}
