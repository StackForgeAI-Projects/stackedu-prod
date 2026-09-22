import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import type { CreateIctUserRequest, UserRole } from '@stackedu/shared'
import { DataTable } from '@/components/DataTable'
import { IctShell } from '@/components/IctShell'
import { IctDialog, TableActionButton, UserActionsPanel } from '@/components/ict/IctPanels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createIctUser,
  getIctProgrammes,
  getIctUsers,
  ictDashboardQueryKey,
  ictProgrammesQueryKey,
  ictUsersQueryKey,
} from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { roleLabel } from '@/lib/auth/portals'
import { formInfo } from '@/lib/form-info-copy'

export const Route = createFileRoute('/_auth/ict/users')({
  component: UserManagementPage,
})

const CREATE_ROLES: CreateIctUserRequest['role'][] = ['Student', 'Lecturer', 'Bursar', 'AcademicAdmin', 'Librarian', 'ICTManager']
const FILTER_ROLES: UserRole[] = CREATE_ROLES

function UserManagementPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: ictUsersQueryKey, queryFn: getIctUsers })
  const programmes = useQuery({ queryKey: ictProgrammesQueryKey, queryFn: getIctProgrammes })
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'Lecturer' as CreateIctUserRequest['role'],
    programmeId: '',
    yearOfStudy: 1,
  })
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createIctUser,
    onSuccess: async (result) => {
      setCreatedPassword(result.temporaryPassword)
      toast.success('Account created. Copy the temporary password.')
      await queryClient.invalidateQueries({ queryKey: ictUsersQueryKey })
      await queryClient.invalidateQueries({ queryKey: ictDashboardQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create that account.')),
  })

  const selected = data?.find((user) => user.id === selectedId)

  return (
    <IctShell
      pageTitle="Users"
      guide="Create logins for staff and students. A student account also creates their student record so they can open the student portal. Academic Admin still owns programmes and the semester."
    >
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <div className="flex flex-wrap justify-between gap-3 mb-5">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>User management</h1>
          <Button onClick={() => { setCreating(true); setCreatedPassword(null) }}>Add user</Button>
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading users…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load users.')}</p>
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(user) => user.id}
            searchPlaceholder="Search name, email or student number"
            searchFilter={(user, query) => `${user.fullName} ${user.email} ${user.studentNumber ?? ''}`.toLowerCase().includes(query)}
            filters={[
              { id: 'role', label: 'roles', getValue: (user) => roleLabel(user.role), options: FILTER_ROLES.map((item) => ({ label: roleLabel(item), value: roleLabel(item) })) },
              { id: 'status', label: 'statuses', getValue: (user) => user.isActive ? 'Active' : 'Revoked' },
            ]}
            empty="No users match those filters."
            columns={[
              {
                id: 'name',
                header: 'Name',
                value: (user) => user.fullName,
                sortable: true,
                cell: (user) => (
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    {user.studentNumber ? <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{user.studentNumber}</p> : null}
                  </div>
                ),
              },
              { id: 'email', header: 'Email', value: (user) => user.email, sortable: true, cell: (user) => user.email },
              { id: 'role', header: 'Role', value: (user) => roleLabel(user.role), cell: (user) => roleLabel(user.role) },
              { id: 'status', header: 'Status', value: (user) => user.isActive ? 'Active' : 'Revoked', cell: (user) => user.isActive ? 'Active' : 'Revoked' },
              {
                id: 'open',
                header: '',
                cell: (user) => <TableActionButton onClick={() => setSelectedId(user.id)}>Manage</TableActionButton>,
                className: 'text-right',
              },
            ]}
          />
        )}
      </div>

      <IctDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add user"
        infoLines={formInfo.addIctUser}
      >
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate({
              fullName: form.fullName,
              email: form.email,
              phone: form.phone || undefined,
              role: form.role,
              programmeId: form.role === 'Student' ? form.programmeId || undefined : undefined,
              yearOfStudy: form.role === 'Student' ? form.yearOfStudy : undefined,
            })
          }}
        >
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2507…" />
          </div>
          <div>
            <Label>Role</Label>
            <select className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: '1px solid var(--border)' }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as CreateIctUserRequest['role'] })}>
              {CREATE_ROLES.map((item) => <option key={item} value={item}>{roleLabel(item)}</option>)}
            </select>
          </div>
          {form.role === 'Student' ? (
            <>
              <div>
                <Label>Programme</Label>
                <select className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: '1px solid var(--border)' }} value={form.programmeId} onChange={(e) => setForm({ ...form, programmeId: e.target.value })} required>
                  <option value="">Select programme</option>
                  {(programmes.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>{item.code} · {item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="year">Year of study</Label>
                <Input id="year" type="number" min={1} max={8} value={form.yearOfStudy} onChange={(e) => setForm({ ...form, yearOfStudy: Number(e.target.value) })} />
              </div>
            </>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>Create account</Button>
            {createdPassword ? (
              <p className="t-caption mt-3" style={{ color: 'var(--success)' }}>
                Temporary password: {createdPassword}
              </p>
            ) : null}
          </div>
        </form>
      </IctDialog>

      <IctDialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
        title={selected?.fullName ?? 'User'}
        description="Reset a password, revoke access, or reactivate this account."
      >
        {selectedId ? <UserActionsPanel id={selectedId} /> : null}
      </IctDialog>
    </IctShell>
  )
}
