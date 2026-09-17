import { createFileRoute } from '@tanstack/react-router'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { LibrarianShell } from '@/components/LibrarianShell'

export const Route = createFileRoute('/_auth/librarian/profile')({
  component: LibrarianProfilePage,
})

function LibrarianProfilePage() {
  return (
    <LibrarianShell pageTitle="My Profile">
      <AccountProfileView breadcrumb="Librarian" subtitle="Librarian" />
    </LibrarianShell>
  )
}
