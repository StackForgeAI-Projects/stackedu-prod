import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { StudentShell } from '@/components/StudentShell'
import { LibraryBrowsePanel } from '@/components/library/LibraryBrowsePanel'
import {
  createReaderLibraryRequest,
  getReaderLibrary,
  getReaderLibraryDownload,
  getReaderLibraryRequests,
  readerLibraryQueryKey,
  readerLibraryRequestsQueryKey,
} from '@/lib/api/library'

export const Route = createFileRoute('/_auth/student/library')({
  component: ELibraryPage,
})

function ELibraryPage() {
  const [search, setSearch] = useState('')
  const resources = useQuery({
    queryKey: [...readerLibraryQueryKey('student'), search],
    queryFn: () => getReaderLibrary('student', search),
  })
  const requests = useQuery({
    queryKey: readerLibraryRequestsQueryKey('student'),
    queryFn: () => getReaderLibraryRequests('student'),
  })

  return (
    <StudentShell pageTitle="E-Library" guide="Published catalogue items from the Librarian. Search, download a signed copy, or request a title the library does not hold.">
      <LibraryBrowsePanel
        resources={resources.data}
        requests={requests.data}
        isPending={resources.isPending}
        error={resources.error}
        onSearch={setSearch}
        onDownload={(resourceId, fileId) => getReaderLibraryDownload('student', resourceId, fileId)}
        onRequest={(input) => createReaderLibraryRequest('student', input)}
        requestQueryKey={readerLibraryRequestsQueryKey('student')}
      />
    </StudentShell>
  )
}
