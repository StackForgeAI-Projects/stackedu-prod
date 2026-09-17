import { IctShell } from '@/components/IctShell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { getIctRoles, ictRolesQueryKey, updateIctRolePermissions } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { roleLabel } from '@/lib/auth/portals'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { UserRole } from '@stackedu/shared'

export const Route = createFileRoute('/_auth/ict/access-levels')({
  component: AccessLevelsPage,
})

function AccessLevelsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: ictRolesQueryKey, queryFn: getIctRoles })
  const [selected, setSelected] = useState<UserRole>('ICTManager')
  const [keys, setKeys] = useState<string[]>([])

  useEffect(() => {
    const role = data?.roles.find((row) => row.key === selected)
    if (role) setKeys(role.permissions)
  }, [data, selected])

  const mutation = useMutation({
    mutationFn: () => updateIctRolePermissions(selected, keys),
    onSuccess: async () => {
      toast.success('Access levels saved.')
      await queryClient.invalidateQueries({ queryKey: ictRolesQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save those permissions.')),
  })

  const modules = [...new Set((data?.catalogue ?? []).map((item) => item.module))]
  const enabledCount = keys.length

  return (
    <IctShell
      pageTitle="Access levels"
      guide="Each switch is one action a role may take. Semester, fees, teaching and the library stay with their owning roles unless you turn a switch on. Timetable write lets lecturers set class times; a room or lecturer still cannot be booked twice."
    >
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Access levels</h1>
        <p className="t-body mb-5" style={{ color: 'var(--muted-foreground)' }}>
          Choose a role, then turn permissions on or off. {enabledCount} {enabledCount === 1 ? 'permission is' : 'permissions are'} on for {roleLabel(selected)}.
        </p>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading roles…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load access levels.')}</p>
        ) : data ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5 p-1 rounded-full w-fit" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
              {data.roles.map((role) => (
                <button
                  key={role.key}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: selected === role.key ? 'var(--card)' : 'transparent',
                    color: 'var(--foreground)',
                    boxShadow: selected === role.key ? 'var(--shadow-sm)' : 'none',
                  }}
                  onClick={() => setSelected(role.key)}
                >
                  {roleLabel(role.key)}
                </button>
              ))}
            </div>
            {modules.map((module) => (
              <section
                key={module}
                className="mb-5 p-5 sm:p-6"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h2 className="t-h3 mb-1">{module}</h2>
                <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  {data.catalogue.filter((item) => item.module === module).length} actions in this area
                </p>
                {data.catalogue.filter((item) => item.module === module).map((item) => {
                  const on = keys.includes(item.key)
                  return (
                    <label
                      key={item.key}
                      className="flex items-start justify-between gap-4 py-3"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span className="min-w-0">
                        <span className="text-sm font-medium block">{item.description ?? 'This permission'}</span>
                      </span>
                      <Switch
                        checked={on}
                        onCheckedChange={(checked) => {
                          setKeys((prev) => checked ? [...prev, item.key] : prev.filter((key) => key !== item.key))
                        }}
                        aria-label={item.description ?? 'This permission'}
                      />
                    </label>
                  )
                })}
              </section>
            ))}
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>Save {roleLabel(selected)}</Button>
          </>
        ) : null}
      </div>
    </IctShell>
  )
}
