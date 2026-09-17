import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type {
  CreateLibraryResourceRequest,
  LibraryAccessOptions,
  LibraryAccessRule,
  LibraryResource,
  ResourceType,
  UpdateLibraryAccessRequest,
  UserRole,
} from '@stackedu/shared'
import {
  displayRole,
  formatLibraryFileSize,
  LIBRARY_RESOURCE_ACCEPT,
  LIBRARY_RESOURCE_MAX_BYTES,
  RESOURCE_TYPE_LABELS,
  resourceTypeSchema,
} from '@stackedu/shared'
import { Sparkles, Upload } from 'lucide-react'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import {
  attachLibrarianFile,
  createLibrarianResource,
  deleteLibrarianFile,
  describeLibrarianResource,
  updateLibrarianAccess,
  updateLibrarianResource,
  uploadLibraryFile,
} from '@/lib/api/library'
import { toast } from 'sonner'

const TYPES = resourceTypeSchema.options
const ACCESS_ROLES: UserRole[] = ['Student', 'Lecturer', 'AcademicAdmin']

export function LibraryResourceForm({
  resource,
  accessOptions,
  onSaved,
}: {
  resource?: LibraryResource | null
  accessOptions?: LibraryAccessOptions
  onSaved: () => Promise<void> | void
}) {
  const [title, setTitle] = useState(resource?.title ?? '')
  const [author, setAuthor] = useState(resource?.author ?? '')
  const [publisher, setPublisher] = useState(resource?.publisher ?? '')
  const [isbn, setIsbn] = useState(resource?.isbn ?? '')
  const [type, setType] = useState<ResourceType>(resource?.type ?? 'Ebook')
  const [year, setYear] = useState(String(resource?.publicationYear ?? ''))
  const [tags, setTags] = useState((resource?.subjectTags ?? []).join(', '))
  const [description, setDescription] = useState(resource?.description ?? '')
  const [publish, setPublish] = useState(resource?.isPublished ?? false)
  const [file, setFile] = useState<File | null>(null)
  const [files, setFiles] = useState(resource?.files ?? [])
  const [feeClearance, setFeeClearance] = useState(resource?.access.requiresFeeClearance ?? false)
  const [programmeIds, setProgrammeIds] = useState<string[]>(resource?.access.programmeIds ?? [])
  const [yearGroups, setYearGroups] = useState<number[]>(resource?.access.yearGroups ?? [])
  const [roles, setRoles] = useState<UserRole[]>(resource?.access.roles ?? [])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateLibraryResourceRequest = {
        title: title.trim(),
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        isbn: isbn.trim() || undefined,
        type,
        description: description.trim() || undefined,
        subjectTags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        publicationYear: year ? Number(year) : null,
        publish: resource ? undefined : publish,
      }
      const saved = resource
        ? await updateLibrarianResource(resource.id, { ...payload, isPublished: publish })
        : await createLibrarianResource(payload)
      if (file) {
        if (file.size > LIBRARY_RESOURCE_MAX_BYTES) throw new Error('The file is too large.')
        const uploaded = await uploadLibraryFile(saved.id, file)
        await attachLibrarianFile(saved.id, uploaded)
      }
      const access: UpdateLibraryAccessRequest = {
        programmeIds,
        departmentIds: resource?.access.departmentIds ?? [],
        yearGroups,
        roles,
        requiresFeeClearance: feeClearance,
      }
      const accessChanged = accessDiffers(saved.access, access)
      if (accessChanged) await updateLibrarianAccess(saved.id, access)
      return saved
    },
    onSuccess: async () => {
      toast.success(resource ? 'Resource updated.' : 'Resource added to the catalogue.')
      await onSaved()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save that resource.')),
  })

  const describeMutation = useMutation({
    mutationFn: async () => {
      let fileKey: string | undefined
      let mimeType: string | undefined
      let fileName: string | undefined
      if (file && resource) {
        const uploaded = await uploadLibraryFile(resource.id, file)
        fileKey = uploaded.fileKey
        mimeType = uploaded.mimeType
        fileName = uploaded.fileName
      } else if (resource?.files[0]) {
        fileName = resource.files[0].fileName
        mimeType = resource.files[0].mimeType ?? undefined
      }
      return describeLibrarianResource({ title: title.trim() || undefined, fileKey, fileName, mimeType })
    },
    onSuccess: (result) => {
      setDescription(result.description)
      if (result.subjectTags.length && !tags.trim()) setTags(result.subjectTags.join(', '))
      toast.success('Draft description ready. Review it, then save.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not draft a description.')),
  })

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => deleteLibrarianFile(resource!.id, fileId),
    onSuccess: (saved) => {
      setFiles(saved.files)
      toast.success('File removed.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not remove that file.')),
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="lib-title">Title</Label>
        <Input id="lib-title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="lib-author">Author</Label>
          <Input id="lib-author" value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="lib-type">Type</Label>
          <select
            id="lib-type"
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
            value={type}
            onChange={(event) => setType(event.target.value as ResourceType)}
          >
            {TYPES.map((value) => (
              <option key={value} value={value}>{RESOURCE_TYPE_LABELS[value]}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="lib-publisher">Publisher</Label>
          <Input id="lib-publisher" value={publisher} onChange={(event) => setPublisher(event.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="lib-year">Year</Label>
          <Input id="lib-year" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lib-isbn">ISBN</Label>
          <Input id="lib-isbn" value={isbn} onChange={(event) => setIsbn(event.target.value)} className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="lib-tags">Subject tags</Label>
        <Input id="lib-tags" value={tags} onChange={(event) => setTags(event.target.value)} className="mt-1" placeholder="Algorithms, Computer Science" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <Label htmlFor="lib-desc">Description</Label>
          <Button type="button" variant="ghost" size="sm" onClick={() => describeMutation.mutate()} disabled={describeMutation.isPending}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Draft with AI
          </Button>
        </div>
        <Textarea id="lib-desc" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
      </div>
      <div>
        <Label htmlFor="lib-file">E-book file (PDF, Word, EPUB, office or video)</Label>
        <Input
          id="lib-file"
          type="file"
          accept={LIBRARY_RESOURCE_ACCEPT}
          className="mt-1"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
            <Upload className="mr-1 inline h-3 w-3" />{file.name}
          </p>
        ) : null}
        {files.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {files.map((attached) => (
              <li key={attached.id} className="flex flex-wrap items-center justify-between gap-2">
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                  {attached.fileName} · {formatLibraryFileSize(attached.fileSizeBytes)}
                </p>
                <ConfirmAlertDialog
                  tone="destructive"
                  title="Remove this file?"
                  headline="Remove file"
                  summary={`"${attached.fileName}" will be deleted from storage. The catalogue record stays.`}
                  confirmVariant="destructive"
                  confirmLabel="Remove file"
                  onConfirm={async () => { await deleteFileMutation.mutateAsync(attached.id) }}
                  trigger={
                    <Button type="button" variant="outline" size="sm" disabled={deleteFileMutation.isPending}>
                      Remove
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
        Publish to students and lecturers
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={feeClearance} onChange={(event) => setFeeClearance(event.target.checked)} />
        Withhold while the student is on fee hold
      </label>
      {accessOptions?.programmes.length ? (
        <div>
          <Label>Limit to programmes (leave empty for everyone)</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {accessOptions.programmes.map((programme) => {
              const active = programmeIds.includes(programme.id)
              return (
                <button
                  key={programme.id}
                  type="button"
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    backgroundColor: active ? 'rgba(var(--brand-rgb), 0.12)' : 'var(--muted)',
                    color: active ? 'var(--brand)' : 'var(--muted-foreground)',
                  }}
                  onClick={() => setProgrammeIds((current) => (
                    current.includes(programme.id)
                      ? current.filter((id) => id !== programme.id)
                      : [...current, programme.id]
                  ))}
                >
                  {programme.code}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      <div>
        <Label>Limit to roles (leave empty for everyone who may use the library)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCESS_ROLES.map((role) => {
            const active = roles.includes(role)
            return (
              <button
                key={role}
                type="button"
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  backgroundColor: active ? 'rgba(var(--brand-rgb), 0.12)' : 'var(--muted)',
                  color: active ? 'var(--brand)' : 'var(--muted-foreground)',
                }}
                onClick={() => setRoles((current) => (
                  current.includes(role)
                    ? current.filter((item) => item !== role)
                    : [...current, role]
                ))}
              >
                {displayRole(role)}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <Label>Year groups</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((yearGroup) => {
            const active = yearGroups.includes(yearGroup)
            return (
              <button
                key={yearGroup}
                type="button"
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  backgroundColor: active ? 'rgba(var(--brand-rgb), 0.12)' : 'var(--muted)',
                  color: active ? 'var(--brand)' : 'var(--muted-foreground)',
                }}
                onClick={() => setYearGroups((current) => (
                  current.includes(yearGroup)
                    ? current.filter((item) => item !== yearGroup)
                    : [...current, yearGroup]
                ))}
              >
                Year {yearGroup}
              </button>
            )
          })}
        </div>
      </div>
      <ConfirmAlertDialog
        tone={resource ? 'info' : 'success'}
        title={resource ? 'Save these catalogue changes?' : 'Add this resource to the catalogue?'}
        headline={resource ? 'Save resource' : 'Add resource'}
        summary={
          publish
            ? `"${title.trim() || 'This title'}" will be visible in the e-library.`
            : `"${title.trim() || 'This title'}" will stay unpublished until you release it.`
        }
        confirmLabel={resource ? 'Save changes' : 'Add resource'}
        onConfirm={async () => { await saveMutation.mutateAsync() }}
        trigger={
          <Button disabled={!title.trim() || saveMutation.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
            {resource ? 'Save changes' : 'Add resource'}
          </Button>
        }
      />
    </div>
  )
}

function accessDiffers(current: LibraryAccessRule, next: UpdateLibraryAccessRequest): boolean {
  return (
    current.requiresFeeClearance !== next.requiresFeeClearance
    || current.programmeIds.join() !== next.programmeIds.join()
    || current.yearGroups.join() !== next.yearGroups.join()
    || current.roles.join() !== next.roles.join()
  )
}
