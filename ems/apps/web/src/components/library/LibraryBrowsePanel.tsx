import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { CreateLibraryRequest, LibraryCatalogueItem, LibraryRequest, ResourceType } from '@stackedu/shared'
import {
  formatAppDateDdMmYyyy,
  formatLibraryFileSize,
  RESOURCE_TYPE_LABELS,
} from '@stackedu/shared'
import { Download, Inbox } from 'lucide-react'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { DataTable } from '@/components/DataTable'
import { IconActionButton } from '@/components/IconActionButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'

export function LibraryBrowsePanel({
  resources,
  requests,
  isPending,
  error,
  onSearch,
  onDownload,
  onRequest,
  requestQueryKey,
}: {
  resources: LibraryCatalogueItem[] | undefined
  requests: LibraryRequest[] | undefined
  isPending: boolean
  error: unknown
  onSearch: (query: string) => void
  onDownload: (resourceId: string, fileId?: string) => Promise<{ url: string }>
  onRequest: (input: CreateLibraryRequest) => Promise<unknown>
  requestQueryKey: readonly unknown[]
}) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [reason, setReason] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  const requestMutation = useMutation({
    mutationFn: onRequest,
    onSuccess: async () => {
      toast.success('Request sent to the librarian.')
      setTitle('')
      setAuthor('')
      setReason('')
      setRequestOpen(false)
      await queryClient.invalidateQueries({ queryKey: requestQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not send that request.')),
  })

  async function openFile(item: LibraryCatalogueItem, fileId?: string) {
    try {
      const target = await onDownload(item.id, fileId)
      window.open(target.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open that file.'))
    }
  }

  return (
    <div className="animate-fade-up" style={{ padding: '24px 16px 56px', maxWidth: 1100, margin: '0 auto' }}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>E-Library</h1>
          <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Search the published catalogue, download a file, or ask the librarian to add a title.
          </p>
        </div>
        <Button variant="outline" onClick={() => setRequestOpen((open) => !open)}>
          <Inbox className="mr-2 h-4 w-4" /> Request a title
        </Button>
      </div>

      {requestOpen ? (
        <div
          className="mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
        >
          <div className="sm:col-span-2">
            <FormInfoBox lines={formInfo.requestLibraryTitle} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="lib-req-title">Title</Label>
            <Input id="lib-req-title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="lib-req-author">Author</Label>
            <Input id="lib-req-author" value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="lib-req-reason">Why you need it</Label>
            <Textarea id="lib-req-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1" rows={3} />
          </div>
          <ConfirmAlertDialog
            tone="success"
            title="Send this request?"
            headline="Send request"
            summary={`Ask the librarian to add "${title.trim() || 'this title'}" to the e-library.`}
            confirmLabel="Send request"
            onConfirm={async () => { await requestMutation.mutateAsync({ title: title.trim(), author: author.trim() || undefined, reason: reason.trim() || undefined }) }}
            trigger={
              <Button disabled={!title.trim() || requestMutation.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
                Send request
              </Button>
            }
          />
        </div>
      ) : null}

      {(requests ?? []).length ? (
        <div
          className="mb-5 p-4"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
        >
          <h2 className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>Your requests</h2>
          <ul className="flex flex-col gap-2">
            {(requests ?? []).map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                  {item.status} · {formatAppDateDdMmYyyy(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-4">
        <Input
          value={query}
          onChange={(event) => {
            const value = event.target.value
            setQuery(value)
            if (searchTimer.current) clearTimeout(searchTimer.current)
            searchTimer.current = setTimeout(() => onSearch(value), 300)
          }}
          placeholder="Search title, author or subject"
          className="sm:max-w-sm"
        />
      </div>

      {isPending ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading catalogue…</p>
      ) : error ? (
        <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the library.')}</p>
      ) : (
        <DataTable
          rows={resources ?? []}
          rowKey={(row) => row.id}
          hideSearch
          defaultPageSize={10}
          empty={query.trim() || (resources?.length ?? 0) > 0 ? 'No resources match that search.' : 'No published resources yet.'}
          filters={[
            {
              id: 'type',
              label: 'Type',
              allLabel: 'All types',
              getValue: (row) => row.type,
              options: (Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[])
                .filter((type) => (resources ?? []).some((row) => row.type === type))
                .map((type) => ({ label: RESOURCE_TYPE_LABELS[type], value: type })),
            },
          ]}
          columns={[
            {
              id: 'type',
              header: 'Type',
              value: (row) => RESOURCE_TYPE_LABELS[row.type],
              sortable: true,
              cell: (row) => <span className="t-label whitespace-nowrap">{RESOURCE_TYPE_LABELS[row.type]}</span>,
            },
            {
              id: 'title',
              header: 'Title',
              value: (row) => row.title,
              sortable: true,
              cell: (row) => (
                <div className="min-w-0 py-1">
                  <p className="text-sm font-semibold">{row.title}</p>
                  {row.description ? (
                    <p className="t-caption mt-0.5 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{row.description}</p>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'author',
              header: 'Author',
              value: (row) => row.author,
              sortable: true,
              cell: (row) => (
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {[row.author, row.publicationYear].filter(Boolean).join(' · ') || '—'}
                </span>
              ),
            },
            {
              id: 'subjects',
              header: 'Subjects',
              value: (row) => row.subjectTags.join(' '),
              cell: (row) => row.subjectTags.length ? (
                <div className="flex flex-wrap gap-1">
                  {row.subjectTags.map((tag) => (
                    <span key={tag} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>—</span>
              ),
            },
            {
              id: 'file',
              header: '',
              className: 'text-right',
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  {row.files.length === 0 ? (
                    <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>No file</span>
                  ) : row.files.map((file) => (
                    <IconActionButton
                      key={file.id}
                      label={`Download ${file.format?.toUpperCase() ?? 'file'} · ${formatLibraryFileSize(file.fileSizeBytes)}`}
                      icon={Download}
                      onClick={() => { void openFile(row, file.id) }}
                    />
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
