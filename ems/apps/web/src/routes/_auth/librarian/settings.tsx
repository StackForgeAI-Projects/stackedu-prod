import { createFileRoute } from '@tanstack/react-router'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'
import { LibrarianShell } from '@/components/LibrarianShell'

export const Route = createFileRoute('/_auth/librarian/settings')({
  component: LibrarianSettingsPage,
})

function LibrarianSettingsPage() {
  return (
    <LibrarianShell pageTitle="Account Settings">
      <AccountSettingsView
        breadcrumb="Librarian"
        notificationPrefs={[
          { key: 'requests', label: 'New resource requests', email: true, sms: false, inapp: true },
          { key: 'system', label: 'System announcements', email: true, sms: false, inapp: true },
        ]}
      />
    </LibrarianShell>
  )
}
