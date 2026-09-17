import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LecturerShell } from '@/components/LecturerShell'
import { LibraryBrowsePanel } from '@/components/library/LibraryBrowsePanel'
import {
  createReaderLibraryRequest,
  getReaderLibrary,
  getReaderLibraryDownload,
  getReaderLibraryRequests,
  readerLibraryQueryKey,
  readerLibraryRequestsQueryKey,
} from '@/lib/api/library'

export const Route = createFileRoute('/_auth/lecturer/library')({
  component: LecturerLibraryPage,
})

function LecturerLibraryPage() {
  const [search, setSearch] = useState('')
  const resources = useQuery({
    queryKey: [...readerLibraryQueryKey('lecturer'), search],
    queryFn: () => getReaderLibrary('lecturer', search),
  })
  const requests = useQuery({
    queryKey: readerLibraryRequestsQueryKey('lecturer'),
    queryFn: () => getReaderLibraryRequests('lecturer'),
  })

  return (
    <LecturerShell pageTitle="E-Library" guide="Browse published e-books and course packs. Download a signed copy or request a title for the catalogue.">
      <LibraryBrowsePanel
        resources={resources.data}
        requests={requests.data}
        isPending={resources.isPending}
        error={resources.error}
        onSearch={setSearch}
        onDownload={(resourceId, fileId) => getReaderLibraryDownload('lecturer', resourceId, fileId)}
        onRequest={(input) => createReaderLibraryRequest('lecturer', input)}
        requestQueryKey={readerLibraryRequestsQueryKey('lecturer')}
      />
    </LecturerShell>
  )
}
