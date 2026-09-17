import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AcademicShell } from '@/components/AcademicShell'
import { LibraryBrowsePanel } from '@/components/library/LibraryBrowsePanel'
import {
  createReaderLibraryRequest,
  getReaderLibrary,
  getReaderLibraryDownload,
  getReaderLibraryRequests,
  readerLibraryQueryKey,
  readerLibraryRequestsQueryKey,
} from '@/lib/api/library'

export const Route = createFileRoute('/_auth/academic/library')({
  component: AcademicLibraryPage,
})

function AcademicLibraryPage() {
  const [search, setSearch] = useState('')
  const resources = useQuery({
    queryKey: [...readerLibraryQueryKey('academic'), search],
    queryFn: () => getReaderLibrary('academic', search),
  })
  const requests = useQuery({
    queryKey: readerLibraryRequestsQueryKey('academic'),
    queryFn: () => getReaderLibraryRequests('academic'),
  })

  return (
    <AcademicShell pageTitle="E-Library" guide="Browse published titles, download a signed copy, or request a title the librarian should add.">
      <LibraryBrowsePanel
        resources={resources.data}
        requests={requests.data}
        isPending={resources.isPending}
        error={resources.error}
        onSearch={setSearch}
        onDownload={(resourceId, fileId) => getReaderLibraryDownload('academic', resourceId, fileId)}
        onRequest={(input) => createReaderLibraryRequest('academic', input)}
        requestQueryKey={readerLibraryRequestsQueryKey('academic')}
      />
    </AcademicShell>
  )
}
