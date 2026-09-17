import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  INTEGRATION_CATEGORY_META,
  type IctIntegration,
  type IntegrationCategory,
} from '@stackedu/shared'
import {
  ChevronRight,
  CreditCard,
  Mail,
  MessageSquare,
  Sparkles,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { IctShell } from '@/components/IctShell'
import { IntegrationActionsPanel } from '@/components/ict/IctPanels'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getIctIntegrations, ictIntegrationsQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { integrationStatusLabel } from '@/lib/humanize'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/ict/integrations')({
  component: IntegrationsPage,
})

const CATEGORY_ICONS: Record<IntegrationCategory, LucideIcon> = {
  payments: CreditCard,
  email: Mail,
  sms: MessageSquare,
  classroom: Video,
  ai: Sparkles,
}

function IntegrationsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ictIntegrationsQueryKey,
    queryFn: getIctIntegrations,
  })
  const [selected, setSelected] = useState<IctIntegration | null>(null)
  const [category, setCategory] = useState<IntegrationCategory | 'all'>('all')
  const current = data?.find((item) => item.id === selected?.id) ?? selected

  const items = useMemo(() => {
    const list = data ?? []
    if (category === 'all') return list
    return list.filter((item) => item.category === category)
  }, [data, category])

  const counts = useMemo(() => {
    const list = data ?? []
    const byCategory = Object.fromEntries(
      INTEGRATION_CATEGORY_META.map((section) => [
        section.id,
        list.filter((item) => item.category === section.id).length,
      ]),
    ) as Record<IntegrationCategory, number>
    return { all: list.length, ...byCategory }
  }, [data])

  return (
    <IctShell
      pageTitle="Integrations"
      guide="Connect payments, email, SMS, live classroom and AI. Keys already set in the server environment are recognised here. Anything you add is stored for this institution only and is never shown again after you save. Check connection talks to the vendor — it does not succeed just because this is a local machine."
    >
      <div className="animate-fade-up" style={{ padding: '20px 16px 40px', maxWidth: 720, margin: '0 auto' }}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Integrations</h1>
            <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Open a service to add keys, turn it on, and check the live connection.
            </p>
          </div>
          {data ? (
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              {data.filter((item) => item.isEnabled).length} of {data.length} on
            </p>
          ) : null}
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading integrations…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load integrations.')}</p>
        ) : (
          <>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <CategoryChip
                label="All"
                active={category === 'all'}
                count={counts.all}
                onClick={() => setCategory('all')}
              />
              {INTEGRATION_CATEGORY_META.map((section) => (
                <CategoryChip
                  key={section.id}
                  label={section.title}
                  active={category === section.id}
                  count={counts[section.id]}
                  onClick={() => setCategory(section.id)}
                />
              ))}
            </div>

            <div
              className="overflow-hidden"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              {items.map((item, index) => (
                <IntegrationRow
                  key={item.id}
                  item={item}
                  last={index === items.length - 1}
                  onOpen={() => setSelected(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet open={Boolean(current)} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <SheetContent
          side="right"
          className="p-0 border-l overflow-hidden flex flex-col sheet-md"
        >
          {current ? (
            <>
              <div className="px-6 pt-6 pb-4 pr-12" style={{ borderBottom: '1px solid var(--border)' }}>
                <SheetHeader className="space-y-1 text-left">
                  <SheetTitle className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                    {current.displayName}
                  </SheetTitle>
                  <SheetDescription className="text-sm leading-relaxed">
                    {current.description}
                  </SheetDescription>
                </SheetHeader>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <IntegrationActionsPanel item={current} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </IctShell>
  )
}

function CategoryChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string
  active: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        backgroundColor: active ? 'var(--brand)' : 'var(--card)',
        color: active ? 'var(--brand-ink)' : 'var(--foreground)',
        border: active ? '1px solid transparent' : '1px solid var(--border)',
      }}
    >
      {label}
      <span className="ml-1.5 opacity-70">{count}</span>
    </button>
  )
}

function IntegrationRow({
  item,
  last,
  onOpen,
}: {
  item: IctIntegration
  last: boolean
  onOpen: () => void
}) {
  const Icon = CATEGORY_ICONS[item.category]
  const hasSecrets = item.fields.some((field) => field.secret)
  const aiProvider = item.provider === 'AI' ? item.fields.find((field) => field.key === 'provider')?.value : null
  const configured = item.provider === 'AI'
    ? aiProvider === 'builtin' || item.fields.some((field) => field.secret && field.configured)
    : item.fields.some((field) => field.secret && field.configured)
  const keyLabel = !hasSecrets
    ? 'Uses PawaPay'
    : item.provider === 'AI' && aiProvider === 'builtin'
      ? 'In-built'
      : configured
        ? 'Key saved'
        : 'Key needed'

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[rgba(var(--brand-rgb),0.05)]',
      )}
      style={{ borderBottom: last ? undefined : '1px solid var(--border)' }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)' }}
      >
        <Icon style={{ width: 15, height: 15 }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{item.displayName}</p>
        <p
          className="truncate text-xs leading-tight"
          style={{ color: configured || !hasSecrets ? 'var(--success)' : 'var(--muted-foreground)' }}
        >
          {keyLabel}
        </p>
      </div>
      <span className="flex items-center gap-1.5 shrink-0">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: item.isEnabled ? 'var(--success)' : 'var(--muted-foreground)' }}
          aria-hidden
        />
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {item.isEnabled ? 'On' : 'Off'}
        </span>
        <span className="sr-only">{integrationStatusLabel(item.isEnabled)}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
    </button>
  )
}
