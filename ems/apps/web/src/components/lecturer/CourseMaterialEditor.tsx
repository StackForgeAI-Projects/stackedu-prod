import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, Pencil, Sparkles, Trash2, Upload } from 'lucide-react'
import type { LecturerCourseMaterial, LecturerCourseModule } from '@stackedu/shared'
import {
  COURSE_MATERIAL_ACCEPT,
  COURSE_MATERIAL_MAX_BYTES,
} from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { IconActionButton } from '@/components/IconActionButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import {
  createLecturerMaterial,
  describeLecturerMaterial,
  getLecturerMaterialDownloadUrl,
  deleteLecturerMaterial,
  updateLecturerMaterial,
  uploadLecturerMaterialFile,
} from '@/lib/api/lecturer'
import { toast } from 'sonner'

const UNASSIGNED_MODULE = 'none'

export function TableIconButton({
  label,
  onClick,
  icon,
  danger,
}: {
  label: string
  onClick?: () => void
  icon: typeof Pencil
  danger?: boolean
}) {
  return (
    <span className="inline-flex">
      <IconActionButton label={label} icon={icon} onClick={onClick} danger={danger} />
    </span>
  )
}

export function MaterialRowActions({
  material,
  onEdit,
  onChanged,
}: {
  material: LecturerCourseMaterial
  onEdit: () => void
  onChanged: () => Promise<void>
}) {
  const deleteMutation = useMutation({
    mutationFn: () => deleteLecturerMaterial(material.id),
    onSuccess: async () => {
      toast.success(`"${material.title}" removed.`)
      await onChanged()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that material.')),
  })

  const download = async () => {
    try {
      const target = await getLecturerMaterialDownloadUrl(material.id)
      window.open(target.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open that file.'))
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 flex-nowrap">
      {material.fileKey ? (
        <TableIconButton label="Open file" icon={Download} onClick={download} />
      ) : null}
      <TableIconButton label="Edit" icon={Pencil} onClick={onEdit} />
      <ConfirmAlertDialog
        trigger={<TableIconButton label="Delete" icon={Trash2} danger />}
        title="Delete this material?"
        tone="destructive"
        headlineLabel="Action"
        headline="Delete course material"
        summary={`"${material.title}" will be removed from the course content list.`}
        notices={[
          { icon: 'trash', label: 'Students will no longer see this material in the portal.' },
          { icon: 'file', label: material.fileKey ? 'Any uploaded file will also be removed from storage.' : 'This action cannot be undone.' },
        ]}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}

export function MaterialForm({
  offeringId,
  material,
  modules,
  onClose,
  onSuccess,
}: {
  offeringId: string
  material: LecturerCourseMaterial | null
  modules?: LecturerCourseModule[]
  onClose: () => void
  onSuccess: () => Promise<void>
}) {
  const isEdit = material !== null
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(material?.title ?? '')
  const [moduleId, setModuleId] = useState(material?.moduleId ?? UNASSIGNED_MODULE)
  const [moduleName, setModuleName] = useState(material?.moduleName ?? '')
  const [description, setDescription] = useState(material?.description ?? '')
  const [bodyText, setBodyText] = useState(material?.bodyText ?? '')
  const [externalUrl, setExternalUrl] = useState(material?.externalUrl ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    fileKey: string
    mimeType: string
    fileSizeBytes: number
    fileName: string
  } | null>(null)
  const [removeFile, setRemoveFile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [describing, setDescribing] = useState(false)

  useEffect(() => {
    setTitle(material?.title ?? '')
    setModuleId(material?.moduleId ?? UNASSIGNED_MODULE)
    setModuleName(material?.moduleName ?? '')
    setDescription(material?.description ?? '')
    setBodyText(material?.bodyText ?? '')
    setExternalUrl(material?.externalUrl ?? '')
    setSelectedFile(null)
    setUploadedFile(null)
    setRemoveFile(false)
  }, [material])

  const currentFileLabel = selectedFile?.name ?? (removeFile ? null : material?.fileName ?? null)
  const usesModuleSelect = Boolean(modules && modules.length > 0)

  const ensureUploadedFile = async () => {
    if (selectedFile && selectedFile.size > COURSE_MATERIAL_MAX_BYTES) {
      toast.error('The file must be 10 MB or smaller.')
      return null
    }
    if (selectedFile) {
      if (uploadedFile && uploadedFile.fileName === selectedFile.name && uploadedFile.fileSizeBytes === selectedFile.size) {
        return uploadedFile
      }
      const payload = await uploadLecturerMaterialFile({ offeringId, file: selectedFile })
      const next = { ...payload, fileName: selectedFile.name }
      setUploadedFile(next)
      return next
    }
    if (material?.fileKey && !removeFile) {
      return {
        fileKey: material.fileKey,
        mimeType: material.mimeType ?? '',
        fileSizeBytes: material.fileSizeBytes ?? 0,
        fileName: material.fileName ?? '',
      }
    }
    return null
  }

  const generateDescription = async () => {
    const url = externalUrl.trim()
    if (!url && !selectedFile && !(material?.fileKey && !removeFile)) {
      toast.error('Add a file or a link first.')
      return
    }
    setDescribing(true)
    try {
      const file = url ? null : await ensureUploadedFile()
      const text = await describeLecturerMaterial({
        title: title.trim() || undefined,
        externalUrl: url || undefined,
        fileKey: file?.fileKey,
        fileName: file?.fileName || selectedFile?.name,
        mimeType: file?.mimeType,
      })
      setDescription(text)
      toast.success('Description drafted. Review it before publishing.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not generate a description.'))
    } finally {
      setDescribing(false)
    }
  }

  const saveMaterial = async () => {
    if (title.trim().length < 2) return
    if (selectedFile && selectedFile.size > COURSE_MATERIAL_MAX_BYTES) {
      toast.error('The file must be 10 MB or smaller.')
      return
    }

    setSaving(true)
    try {
      const filePayload = selectedFile ? await ensureUploadedFile() : undefined
      if (selectedFile && !filePayload) return

      const moduleFields = usesModuleSelect
        ? { moduleId: moduleId === UNASSIGNED_MODULE ? null : moduleId }
        : { moduleName: moduleName.trim() || undefined }

      if (isEdit && material) {
        await updateLecturerMaterial(material.id, {
          title: title.trim(),
          ...moduleFields,
          description: description.trim() || undefined,
          bodyText: bodyText.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
          ...(filePayload
            ? {
                fileKey: filePayload.fileKey,
                fileName: selectedFile!.name,
                mimeType: filePayload.mimeType,
                fileSizeBytes: filePayload.fileSizeBytes,
              }
            : {}),
          ...(removeFile && !selectedFile ? { clearFile: true } : {}),
          publish: true,
        })
        toast.success(`Material "${title.trim()}" updated.`)
      } else {
        await createLecturerMaterial({
          offeringId,
          title: title.trim(),
          ...moduleFields,
          description: description.trim() || undefined,
          bodyText: bodyText.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
          ...(filePayload
            ? {
                fileKey: filePayload.fileKey,
                fileName: selectedFile!.name,
                mimeType: filePayload.mimeType,
                fileSizeBytes: filePayload.fileSizeBytes,
              }
            : {}),
          publish: true,
        })
        toast.success(`Material "${title.trim()}" published.`)
      }
      await onSuccess()
    } catch (err) {
      toast.error(apiErrorMessage(err, isEdit ? 'Could not update that material.' : 'Could not publish that material.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {isEdit ? 'Edit course material' : 'Add course material'}
        </h3>
        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Publish a page, a file, a link, or any mix of the three. Students see published items only.
        </p>
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 1 lecture slides" />
        </div>
        {usesModuleSelect ? (
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Module (optional)</label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger><SelectValue placeholder="Ungrouped" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_MODULE}>Ungrouped</SelectItem>
                {modules!.map((module) => (
                  <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Module / week (optional)</label>
            <Input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="e.g. Week 1" />
          </div>
        )}
        <div>
          <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="t-label" style={{ color: 'var(--foreground)' }}>Description (optional)</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 self-start"
              disabled={describing || saving}
              onClick={generateDescription}
            >
              <Sparkles style={{ width: 13, height: 13 }} />
              {describing ? 'Generating…' : 'Generate from file or link'}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief note for students…" rows={3} />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Page text (optional)</label>
          <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Write a page students can read in the portal…" rows={6} />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Link URL (optional)</label>
          <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" type="url" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>File (optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={COURSE_MATERIAL_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setSelectedFile(file)
              setUploadedFile(null)
              if (file) setRemoveFile(false)
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed px-4 py-5 text-left transition-colors hover:bg-[var(--muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, backgroundColor: 'rgba(var(--brand-rgb), 0.08)' }}>
                <Upload style={{ width: 16, height: 16, color: 'var(--brand)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {currentFileLabel ?? 'Upload PDF, Word document, or image'}
                </p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Max 10 MB · PDF, DOCX, DOC, PNG, JPG, WEBP, GIF
                </p>
              </div>
            </div>
          </button>
          {material?.fileKey && !selectedFile && !removeFile ? (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setRemoveFile(true)}>
              Remove current file
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <ConfirmAlertDialog
            trigger={
              <Button
                type="button"
                disabled={title.trim().length < 2 || saving}
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
              >
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish material'}
              </Button>
            }
            title={isEdit ? 'Save these changes?' : 'Publish this material?'}
            tone="success"
            headlineLabel="Action"
            headline={isEdit ? 'Update course material' : 'Publish course material'}
            summary={isEdit
              ? `Students will see the updated version of "${title.trim() || material?.title}".`
              : `"${title.trim()}" will be published to this course.`}
            notices={[
              { icon: 'user', label: 'Enrolled students can access published materials in their portal.' },
              { icon: 'file', label: selectedFile ? `File "${selectedFile.name}" will be uploaded.` : 'Only the details you entered will be published.' },
            ]}
            confirmLabel={isEdit ? 'Save changes' : 'Publish'}
            confirmVariant="brand"
            loading={saving}
            onConfirm={saveMaterial}
          />
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
