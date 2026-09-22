import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  AI_PROVIDER_LABELS,
  AI_PROVIDERS,
  type AiProvider,
  type IctAnnouncement,
  type IctAuditDetail,
  type IctIntegration,
  type IctRevocation,
  type UpdateIntegrationRequest,
} from '@stackedu/shared'
import { buildAuditDetail } from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  checkIctIntegration,
  getIctAuditEntry,
  getIctRevocation,
  getIctUser,
  ictRevocationsQueryKey,
  ictUserQueryKey,
  ictUsersQueryKey,
  ictIntegrationsQueryKey,
  resetIctUserPassword,
  restoreIctRevocation,
  revokeIctUser,
  updateIctIntegration,
  updateIctUser,
} from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import {
  displayRole,
  integrationCheckFailed,
  integrationLastCheckLabel,
  integrationStatusLabel,
} from '@/lib/humanize'
import { formatDateTime } from '@/lib/utils'

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      {label ? (
        <p className="t-caption mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      ) : null}
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}

export function TableActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="text-sm font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[rgba(var(--brand-rgb),0.08)]"
      style={{ color: 'var(--success)' }}
    >
      {children}
    </button>
  )
}

export function IctDialog({
  open,
  onOpenChange,
  title,
  description,
  infoLines,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  infoLines?: readonly string[]
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] sm:max-w-xl gap-0 p-0"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>{title}</DialogTitle>
            {infoLines ? <FormInfoBox lines={infoLines} /> : null}
            {!infoLines && description ? <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription> : null}
          </DialogHeader>
        </div>
        <div className="px-6 py-5">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

export function AuditEntryBody({ data }: { data: IctAuditDetail }) {
  const detail = buildAuditDetail(data)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {detail.subheadline}
      </p>
      {detail.sections.map((section) => (
        <DetailSection key={section.title} title={section.title}>
          {section.rows.map((row, index) => (
            <DetailRow key={`${section.title}-${row.label}-${index}`} label={row.label} value={row.value} />
          ))}
        </DetailSection>
      ))}
    </div>
  )
}

export function AuditEntryPanel({ id }: { id: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['ict', 'audit', id],
    queryFn: () => getIctAuditEntry(id),
    enabled: Boolean(id),
  })

  if (isPending) return <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
  if (error) return <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that entry.')}</p>
  if (!data) return null
  return <AuditEntryBody data={data} />
}

export function UserActionsPanel({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: ictUserQueryKey(id),
    queryFn: () => getIctUser(id),
    enabled: Boolean(id),
  })
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState<string | null>(null)

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ictUserQueryKey(id) })
    await queryClient.invalidateQueries({ queryKey: ictUsersQueryKey })
    await queryClient.invalidateQueries({ queryKey: ictRevocationsQueryKey })
  }

  const reset = useMutation({
    mutationFn: () => resetIctUserPassword(id),
    onSuccess: (result) => {
      setPassword(result.temporaryPassword)
      toast.success('Password reset. Copy the temporary password.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not reset the password.')),
  })

  const revoke = useMutation({
    mutationFn: () => revokeIctUser(id, reason),
    onSuccess: async () => {
      toast.success('Access revoked.')
      setReason('')
      await invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not revoke access.')),
  })

  const restore = useMutation({
    mutationFn: () => updateIctUser(id, { isActive: true }),
    onSuccess: async () => {
      toast.success('Account reactivated.')
      await invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not restore the account.')),
  })

  if (isPending) return <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading user…</p>
  if (error) return <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that user.')}</p>
  if (!data) return null

  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="Account">
        <DetailRow label="Email" value={data.email} />
        <DetailRow label="Role" value={displayRole(data.role)} />
        <DetailRow label="Status" value={data.isActive ? 'Active' : 'Revoked'} />
        {data.studentNumber ? <DetailRow label="Student no." value={data.studentNumber} /> : null}
        <DetailRow label="Last login" value={data.lastLoginAt ? formatDateTime(data.lastLoginAt) : 'Never'} />
      </DetailSection>

      <DetailSection title="Actions">
        <div className="flex flex-wrap gap-3 pb-2">
          <Button variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>Reset password</Button>
          {!data.isActive ? (
            <Button disabled={restore.isPending} onClick={() => restore.mutate()}>Reactivate</Button>
          ) : null}
        </div>
        {password ? (
          <p className="t-caption" style={{ color: 'var(--success)' }}>
            Temporary password: {password}
          </p>
        ) : null}
      </DetailSection>

      {data.isActive ? (
        <DetailSection title="Revoke access">
          <Label htmlFor="revoke-reason">Reason for the auditor</Label>
          <Input
            id="revoke-reason"
            className="mb-3 mt-2"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why access is being withdrawn"
          />
          <Button disabled={reason.trim().length < 4 || revoke.isPending} onClick={() => revoke.mutate()}>
            Revoke access
          </Button>
        </DetailSection>
      ) : null}
    </div>
  )
}

export function RevocationActionsPanel({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: ['ict', 'revocation', id],
    queryFn: () => getIctRevocation(id),
    enabled: Boolean(id),
  })
  const mutation = useMutation({
    mutationFn: () => restoreIctRevocation(id),
    onSuccess: async () => {
      toast.success('Access restored.')
      await queryClient.invalidateQueries({ queryKey: ictRevocationsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ictUsersQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['ict', 'revocation', id] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not restore access.')),
  })

  if (isPending) return <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
  if (error) return <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that record.')}</p>
  if (!data) return null
  return <RevocationBody data={data} restoring={mutation.isPending} onRestore={() => mutation.mutate()} />
}

export function RevocationBody({
  data,
  restoring,
  onRestore,
}: {
  data: IctRevocation
  restoring?: boolean
  onRestore?: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="Person">
        <DetailRow label="Name" value={data.userName} />
        <DetailRow label="Email" value={data.userEmail} />
        <DetailRow label="Role" value={displayRole(data.userRole)} />
      </DetailSection>
      <DetailSection title="Revocation">
        <DetailRow label="Reason" value={data.reason} />
        <DetailRow label="Effective" value={formatDateTime(data.effectiveAt)} />
        {data.revokedByName ? <DetailRow label="Revoked by" value={data.revokedByName} /> : null}
        {data.restoredAt ? <DetailRow label="Restored" value={formatDateTime(data.restoredAt)} /> : null}
        {!data.restoredAt && onRestore ? (
          <div className="pt-3">
            <Button disabled={restoring} onClick={onRestore}>Restore access</Button>
          </div>
        ) : data.restoredAt ? (
          <p className="t-body pt-2" style={{ color: 'var(--success)' }}>This access has been restored.</p>
        ) : null}
      </DetailSection>
    </div>
  )
}

export function IntegrationActionsPanel({ item }: { item: IctIntegration }) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(item.isEnabled)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setEnabled(item.isEnabled)
    setValues(Object.fromEntries(item.fields.map((field) => [field.key, field.secret ? '' : (field.value ?? '')])))
  }, [item])

  const saveMutation = useMutation({
    mutationFn: (input: UpdateIntegrationRequest) => updateIctIntegration(item.id, input),
    onSuccess: async () => {
      toast.success('Integration saved.')
      setValues((current) => {
        const next = { ...current }
        for (const field of item.fields) {
          if (field.secret) next[field.key] = ''
        }
        return next
      })
      await queryClient.invalidateQueries({ queryKey: ictIntegrationsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save that service.')),
  })
  const checkMutation = useMutation({
    mutationFn: () => checkIctIntegration(item.id),
    onSuccess: async (result) => {
      if (result.checkOk) {
        toast.success(result.lastStatus ?? 'Connected.')
      } else {
        toast.error(result.lastStatus ?? 'Connection check failed.')
      }
      await queryClient.invalidateQueries({ queryKey: ictIntegrationsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not check that service.')),
  })

  const buildPayload = (): UpdateIntegrationRequest => {
    const credentials: Record<string, string> = {}
    for (const field of item.fields) {
      const value = (values[field.key] ?? '').trim()
      if (field.secret) {
        if (value) credentials[field.key] = value
        continue
      }
      if (value !== (field.value ?? '').trim()) credentials[field.key] = value
    }
    return {
      isEnabled: enabled,
      ...(Object.keys(credentials).length > 0 ? { credentials } : {}),
    }
  }

  const secretPlaceholder = (configured: boolean) =>
    configured ? 'Key saved — paste a new one to replace it' : 'Paste the API key'

  return (
    <div className="flex flex-col gap-5">
      <FormInfoBox lines={formInfo.ictIntegration} />
      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {item.description}
      </p>
      {item.setupSteps.length > 0 ? (
        <ol className="flex flex-col gap-2 pl-4 text-sm leading-relaxed list-decimal" style={{ color: 'var(--foreground)' }}>
          {item.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      {item.docsUrl ? (
        <a
          href={item.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium"
          style={{ color: 'var(--brand)' }}
        >
          Open setup docs
        </a>
      ) : null}

      <div>
        <p className="t-caption mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Last check</p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: integrationCheckFailed(item.lastStatus) ? 'var(--error)' : 'var(--foreground)' }}
        >
          {integrationLastCheckLabel(item.lastStatus, item.lastCheckedAt)}
        </p>
      </div>

      {item.fields.map((field) => {
        if (item.provider === 'AI' && field.key === 'provider') {
          return (
            <div key={field.key}>
              <Label htmlFor={`${item.id}-${field.key}`}>{field.label}</Label>
              {field.hint ? (
                <p className="t-caption mt-0.5 mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{field.hint}</p>
              ) : null}
              <Select
                value={values.provider || 'builtin'}
                onValueChange={(value) => setValues((current) => ({ ...current, provider: value, apiKey: '' }))}
              >
                <SelectTrigger id={`${item.id}-${field.key}`} className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((id: AiProvider) => {
                    const savedProvider = item.fields.find((row) => row.key === 'provider')?.value
                    const keySaved = id !== 'builtin' && savedProvider === id && item.fields.find((row) => row.key === 'apiKey')?.configured
                    return (
                      <SelectItem key={id} value={id}>
                        {AI_PROVIDER_LABELS[id]}{keySaved ? ' · key saved' : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )
        }
        if (item.provider === 'AI' && field.key === 'apiKey' && (values.provider || 'builtin') === 'builtin') {
          return null
        }
        return (
          <div key={field.key}>
            <Label htmlFor={`${item.id}-${field.key}`}>{field.label}</Label>
            {field.hint ? (
              <p className="t-caption mt-0.5 mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{field.hint}</p>
            ) : null}
            <Input
              id={`${item.id}-${field.key}`}
              type={field.secret ? 'password' : 'text'}
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5"
              value={values[field.key] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              placeholder={field.secret ? secretPlaceholder(field.configured) : undefined}
            />
            {field.secret && field.configured ? (
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {field.source === 'env' ? 'A key is already set in the server environment.' : 'A key is saved for this institution.'}
              </p>
            ) : null}
          </div>
        )
      })}

      <div className="flex items-center justify-between gap-4 pt-1">
        <div>
          <p className="text-sm font-medium">Turn this service on</p>
          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {integrationStatusLabel(enabled)}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={(checked) => setEnabled(Boolean(checked))} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ConfirmAlertDialog
          trigger={
            <Button type="button" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          }
          title="Save this integration?"
          tone="success"
          headlineLabel="Action"
          headline={`Update ${item.displayName}`}
          summary="The on/off setting and any keys you typed will be stored for this institution."
          notices={[
            { icon: 'lock', label: 'API secrets are never shown again after you save. Paste a new value to replace one.' },
          ]}
          confirmLabel="Save"
          confirmVariant="brand"
          loading={saveMutation.isPending}
          onConfirm={() => saveMutation.mutate(buildPayload())}
        />
        <Button type="button" variant="outline" disabled={checkMutation.isPending} onClick={() => checkMutation.mutate()}>
          Check connection
        </Button>
      </div>
    </div>
  )
}

export function AnnouncementBody({ item }: { item: IctAnnouncement }) {
  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="Delivery">
        <DetailRow label="Audience" value={item.audienceLabel} />
        <DetailRow label="Published" value={item.publishedAt ? formatDateTime(item.publishedAt) : 'Draft'} />
        {item.isPinned ? <DetailRow label="Pinned" value="Shown at the top of student dashboards" /> : null}
      </DetailSection>
      <DetailSection title="Message">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.body}</p>
      </DetailSection>
    </div>
  )
}
