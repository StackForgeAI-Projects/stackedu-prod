import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CreateLibraryRequest, LibraryCatalogueItem, LibraryRequest, ResourceType } from '@stackedu/shared'
import {
  formatAppDateDdMmYyyy,
  formatLibraryFileSize,
  RESOURCE_TYPE_LABELS,
} from '@stackedu/shared'
import { Download, Inbox } from 'lucide-react'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
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
  const [type, setType] = useState<ResourceType | 'all'>('all')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [reason, setReason] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)

  const types = useMemo(() => {
    const seen = new Set<ResourceType>()
    for (const item of resources ?? []) seen.add(item.type)
    return [...seen]
  }, [resources])

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  const filtered = (resources ?? []).filter((item) => type === 'all' || item.type === type)

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

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
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
        <select
          className="text-sm px-3 py-2 rounded-lg"
          style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
          value={type}
          onChange={(event) => setType(event.target.value as ResourceType | 'all')}
        >
          <option value="all">All types</option>
          {types.map((value) => (
            <option key={value} value={value}>{RESOURCE_TYPE_LABELS[value]}</option>
          ))}
        </select>
      </div>

      {isPending ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading catalogue…</p>
      ) : error ? (
        <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the library.')}</p>
      ) : filtered.length === 0 ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
          {query.trim() || type !== 'all' || resources?.length ? 'No resources match that search.' : 'No published resources yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col p-5"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
            >
              <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>{RESOURCE_TYPE_LABELS[item.type]}</p>
              <h2 className="text-sm font-semibold mb-1">{item.title}</h2>
              <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {[item.author, item.publicationYear].filter(Boolean).join(' · ')}
              </p>
              {item.description ? (
                <p className="text-sm mb-3 line-clamp-3">{item.description}</p>
              ) : null}
              {item.subjectTags.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {item.subjectTags.map((tag) => (
                    <span key={tag} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2">
                {item.files.length === 0 ? (
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No file attached yet.</p>
                ) : (
                  item.files.map((file) => (
                    <Button
                      key={file.id}
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const target = await onDownload(item.id, file.id)
                          window.open(target.url, '_blank', 'noopener,noreferrer')
                        } catch (err) {
                          toast.error(apiErrorMessage(err, 'Could not open that file.'))
                        }
                      }}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      {file.format?.toUpperCase() ?? 'File'} · {formatLibraryFileSize(file.fileSizeBytes)}
                    </Button>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
