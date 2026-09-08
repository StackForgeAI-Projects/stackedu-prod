import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Building2, IdCard } from 'lucide-react'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { getBursarProfile, bursarProfileQueryKey } from '@/lib/api/bursar'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'

export const Route = createFileRoute('/_auth/bursar/profile')({
  component: BursarProfilePage,
})

function BursarProfilePage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: bursarProfileQueryKey,
    queryFn: getBursarProfile,
  })

  return (
    <BursarShell pageTitle="My Profile" guide={BURSAR_GUIDES.profile}>
      {isPending ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading profile…</p>
      ) : error ? (
        <PortalErrorPanel error={error} onRetry={() => refetch()} />
      ) : (
        <AccountProfileView
          breadcrumb="Bursar"
          subtitle={data ? `Bursar · ${data.institutionShortName}` : 'Bursar'}
          extraFields={[
            { icon: IdCard, label: 'Staff ID', value: data?.staffId ?? '—', mono: true },
            { icon: Building2, label: 'Institution', value: data?.institutionName ?? '—' },
          ]}
        />
      )}
    </BursarShell>
  )
}
