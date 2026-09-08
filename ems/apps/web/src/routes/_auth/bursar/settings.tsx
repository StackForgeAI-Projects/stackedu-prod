import { createFileRoute } from '@tanstack/react-router'
import { BursarShell } from '@/components/BursarShell'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'

export const Route = createFileRoute('/_auth/bursar/settings')({
  component: BursarSettingsPage,
})

function BursarSettingsPage() {
  return (
    <BursarShell pageTitle="Account Settings" guide={BURSAR_GUIDES.settings}>
      <AccountSettingsView
        breadcrumb="Bursar"
        notificationPrefs={[
          { key: 'payments', label: 'Payment notifications', email: true, sms: false, inapp: true },
          { key: 'holds', label: 'Fee hold changes', email: true, sms: false, inapp: true },
          { key: 'reconciliation', label: 'Reconciliation mismatches', email: true, sms: true, inapp: true },
          { key: 'system', label: 'System announcements', email: true, sms: false, inapp: false },
        ]}
      />
    </BursarShell>
  )
}
