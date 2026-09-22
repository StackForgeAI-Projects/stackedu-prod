import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'
import type { ApplicationDocument, ApplicationDocumentType } from '@stackedu/shared'
import {
  MAX_UPLOAD_MB,
  REQUIRED_APPLICATION_DOCUMENT_TYPES,
  buildCustomDocumentType,
  formatRequestedDocumentsList,
  formatUploadBytes,
} from '@stackedu/shared'
import { ApplyLayout, type ApplyStep } from '@/components/ApplyLayout'
import { FileTooLargeDialog, useOversizeUpload } from '@/components/FileTooLargeDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { useApplication } from '@/hooks/useApplication'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { requireVerifiedApplicant } from '@/lib/auth/guards'
import { notifyError, notifySuccess } from '@/lib/notify'
import { Button } from '@/components/ui/button'
import {
  applicationQueryKeyFor,
  deleteDocument,
  listDocuments,
  submitDocumentResponse,
  uploadApplicationDocument,
} from '@/lib/api/admissions'
import { apiErrorMessage } from '@/lib/api/client'
import { queryClient } from '@/lib/query-client'
import { APPLY_PROGRESS_BY_STEP } from '@/lib/apply/progress'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/documents')({
  beforeLoad: requireVerifiedApplicant,
  component: ApplyDocumentsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const STEPS: ApplyStep[] = [
  { id: 1, label: 'Personal Details'    },
  { id: 2, label: 'Academic History'    },
  { id: 3, label: 'Programme Selection' },
  { id: 4, label: 'Parent / Guardian'   },
  { id: 5, label: 'Additional Info'     },
  { id: 6, label: 'Documents'           },
  { id: 7, label: 'Application Fee'     },
]

interface DocSpec {
  id:           string
  label:        string
  required:     boolean
  accept:       string
  hint:         string
  maxMB:        number
  note?:        string
}

const DOCS: DocSpec[] = [
  {
    id:       'NationalId',
    label:    'National ID or Passport',
    required: true,
    accept:   '.pdf,.jpg,.jpeg,.png',
    hint:     'PDF, JPG, PNG',
    maxMB:    MAX_UPLOAD_MB,
    note:     'Clear copy of both sides for National ID',
  },
  {
    id:       'SchoolCertificate',
    label:    'Senior 6 / A-Level Certificate',
    required: true,
    accept:   '.pdf',
    hint:     'PDF only',
    maxMB:    MAX_UPLOAD_MB,
    note:     'REB / NESA certificate or REB equivalence for foreign results',
  },
  {
    id:       'Transcript',
    label:    'Academic Transcripts / Results slip',
    required: true,
    accept:   '.pdf',
    hint:     'PDF only',
    maxMB:    MAX_UPLOAD_MB,
  },
  {
    id:       'Photo',
    label:    'Passport-size Photo',
    required: true,
    accept:   '.jpg,.jpeg,.png',
    hint:     'JPG, PNG',
    maxMB:    MAX_UPLOAD_MB,
    note:     'Recent colour photo, square format preferred',
  },
  {
    id:       'MedicalInsurance',
    label:    'Medical Insurance Proof',
    required: true,
    accept:   '.pdf,.jpg,.jpeg,.png',
    hint:     'PDF, JPG, PNG',
    maxMB:    MAX_UPLOAD_MB,
    note:     'Student or parent/guardian medical insurance',
  },
  {
    id:       'BirthCertificate',
    label:    'Birth Certificate',
    required: false,
    accept:   '.pdf,.jpg,.jpeg',
    hint:     'PDF, JPG',
    maxMB:    MAX_UPLOAD_MB,
  },
]

const documentsQueryKeyFor = (userId: string | undefined) =>
  [...applicationQueryKeyFor(userId), 'documents'] as const

function formatSize(bytes: number) {
  return formatUploadBytes(bytes)
}

// ─────────────────────────────────────────────────────────────────────────────

function ApplyDocumentsPage() {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const { application } = useApplication()
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [pendingSpec, setPendingSpec] = useState<DocSpec | null>(null)
  const { oversizeFile, setOversizeFile, takeFile } = useOversizeUpload()
  const documentsQueryKey = documentsQueryKeyFor(user?.id)

  const respondMode =
    application?.status === 'DocumentsRequested' && Boolean(application.documentRequest)

  const responseSubmitted = Boolean(application?.documentRequest?.responseSubmittedAt)

  const respondDocs = respondMode && application?.documentRequest
    ? buildRespondDocSpecs(application.documentRequest.requestedDocuments)
    : []

  const visibleDocs = respondMode ? respondDocs : DOCS

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: listDocuments,
  })

  const documents = documentsQuery.data ?? []
  const byType = new Map(documents.map((doc) => [doc.documentType, doc]))

  const uploadMutation = useMutation({
    mutationFn: uploadApplicationDocument,
    onSuccess: async (docs) => {
      queryClient.setQueryData(documentsQueryKey, docs)
      await queryClient.invalidateQueries({ queryKey: applicationQueryKeyFor(user?.id) })
      notifySuccess('Document uploaded.')
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'We could not upload that file. Please try again.'))
    },
    onSettled: () => setUploadingType(null),
  })

  const removeMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: async (docs) => {
      queryClient.setQueryData(documentsQueryKey, docs)
      await queryClient.invalidateQueries({ queryKey: applicationQueryKeyFor(user?.id) })
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'We could not remove that file.'))
    },
  })

  const submitMutation = useMutation({
    mutationFn: submitDocumentResponse,
    onSuccess: async (updated) => {
      queryClient.setQueryData(applicationQueryKeyFor(user?.id), updated)
      await queryClient.invalidateQueries({ queryKey: applicationQueryKeyFor(user?.id) })
      notifySuccess('Your documents have been submitted for review.')
      void navigate({ to: '/apply/track' })
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'We could not submit your documents. Please try again.'))
    },
  })

  const requiredDocs = visibleDocs.filter((d) => d.required)
  const uploadedCount = visibleDocs.filter((spec) => byType.has(spec.id)).length
  const allRequiredMet = respondMode
    ? visibleDocs.every((spec) => byType.has(spec.id))
    : REQUIRED_APPLICATION_DOCUMENT_TYPES.every((type) => byType.has(type))
  const progressPct = visibleDocs.length
    ? Math.round((uploadedCount / visibleDocs.length) * 100)
    : 0

  const startUpload = (spec: DocSpec, file: File) => {
    setUploadingType(spec.id)
    uploadMutation.mutate({ documentType: spec.id, file })
  }

  const handleUpload = (spec: DocSpec, file: File) => {
    if (responseSubmitted) return
    takeFile(file, (next) => startUpload(spec, next))
    setPendingSpec(spec)
  }

  return (
    <ApplyLayout
      steps={STEPS}
      currentStep={respondMode ? 6 : 6}
      completedSteps={respondMode ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5]}
      progressPercent={respondMode ? 100 : APPLY_PROGRESS_BY_STEP[6]}
      showBanner={!respondMode}
    >
      <div className="mb-6">
        <h2
          className="t-h2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}
        >
          {respondMode ? 'Upload requested documents' : 'Upload your documents'}
        </h2>
        <FormInfoBox lines={respondMode ? formInfo.applyDocumentsRequested : formInfo.applyDocuments} />
      </div>

      {respondMode && application?.documentRequest ? (
        <div
          className="mb-6 p-4 rounded-xl"
          style={{
            backgroundColor: responseSubmitted ? 'var(--info-bg, #eff6ff)' : 'var(--warning-bg)',
            border: `1px solid ${responseSubmitted ? 'var(--info, #2563eb)' : 'var(--warning)'}`,
          }}
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: responseSubmitted ? 'var(--info, #2563eb)' : 'var(--warning)' }}
          >
            {responseSubmitted ? 'Documents submitted for review' : 'Documents requested'}
          </p>
          {!responseSubmitted ? (
            <>
              <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                {formatRequestedDocumentsList(application.documentRequest.requestedDocuments).join(' · ')}
              </p>
              {application.documentRequest.comments ? (
                <p className="text-sm mt-2" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                  Note: {application.documentRequest.comments}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
              Admissions has your updated documents. You will hear back once the review is complete.
            </p>
          )}
        </div>
      ) : null}

      <div
        className="flex items-center gap-4 mb-6 px-5 py-4 rounded-xl"
        style={{
          backgroundColor: 'var(--card)',
          border:          '1px solid var(--border)',
          boxShadow:       'var(--shadow-sm)',
        }}
      >
        <div className="flex-1">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            {uploadedCount} of {visibleDocs.length} documents uploaded
          </p>
          <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'var(--muted)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progressPct}%`, backgroundColor: '#0D7A28', transition: 'width 300ms ease-out' }}
            />
          </div>
        </div>
        <span
          className="text-sm font-bold flex-shrink-0"
          style={{ color: uploadedCount === DOCS.length ? 'var(--success)' : 'var(--muted-foreground)' }}
        >
          {progressPct}%
        </span>
      </div>

      {documentsQuery.isLoading && (
        <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Loading your uploads…</p>
      )}

      <div className="flex flex-col gap-4">
        {visibleDocs.map((doc) => (
          <DocCard
            key={doc.id}
            spec={doc}
            document={byType.get(doc.id) ?? null}
            busy={uploadingType === doc.id || removeMutation.isPending || submitMutation.isPending}
            readOnly={responseSubmitted}
            onUpload={(f) => handleUpload(doc, f)}
            onRemove={() => {
              const existing = byType.get(doc.id)
              if (existing) removeMutation.mutate(existing.id)
            }}
          />
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          {respondMode ? (
            responseSubmitted ? (
              <Button
                onClick={() => navigate({ to: '/apply/track' })}
                className="w-full sm:w-auto ml-auto font-semibold"
              >
                Back to track
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate({ to: '/apply/track' })}>
                  ← Back to track
                </Button>
                <Button
                  onClick={() => {
                    if (!allRequiredMet) {
                      notifyError('Upload every requested document before submitting.')
                      return
                    }
                    submitMutation.mutate()
                  }}
                  disabled={!allRequiredMet || submitMutation.isPending}
                  className="font-semibold"
                >
                  {submitMutation.isPending ? 'Submitting…' : 'Submit documents'}
                </Button>
              </>
            )
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate({ to: '/apply/form', search: { step: 5 } })}>
                ← Back
              </Button>
              <Button
                onClick={() => {
                  if (!allRequiredMet) {
                    notifyError('Upload all required documents before continuing.')
                    return
                  }
                  void navigate({ to: '/apply/payment' })
                }}
                disabled={!allRequiredMet || requiredDocs.length === 0}
                title={!allRequiredMet ? 'Upload all required documents' : undefined}
                className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
              >
                Continue to payment
              </Button>
            </>
          )}
        </div>
        {!respondMode ? (
          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={() => {
                void documentsQuery.refetch()
                notifySuccess('Progress saved.')
              }}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: '#0D7A28', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Save progress
            </button>
          </div>
        ) : null}
      </div>
      <FileTooLargeDialog
        file={oversizeFile}
        onAccept={(next) => {
          if (pendingSpec) startUpload(pendingSpec, next)
          setPendingSpec(null)
          setOversizeFile(null)
        }}
        onClose={() => {
          setPendingSpec(null)
          setOversizeFile(null)
        }}
      />
    </ApplyLayout>
  )
}

function buildRespondDocSpecs(request: {
  types: ApplicationDocumentType[]
  custom: string[]
}): DocSpec[] {
  const standard = DOCS.filter((doc) => request.types.includes(doc.id as ApplicationDocumentType))
  const custom = request.custom.map((name) => ({
    id: buildCustomDocumentType(name),
    label: name,
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'PDF, JPG, PNG',
    maxMB: MAX_UPLOAD_MB,
  }))
  return [...standard, ...custom]
}

function DocCard({
  spec,
  document,
  busy,
  readOnly = false,
  onUpload,
  onRemove,
}: {
  spec:     DocSpec
  document: ApplicationDocument | null
  busy:     boolean
  readOnly?: boolean
  onUpload: (f: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0]
    if (f) onUpload(f)
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius:    'var(--radius-lg)',
        border:          '1px solid var(--border)',
        boxShadow:       'var(--shadow-sm)',
        padding:         '1.25rem',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {spec.label}
            {spec.required && (
              <span className="ml-1" style={{ color: 'var(--error)' }}>*</span>
            )}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {spec.hint} · Max {spec.maxMB} MB
            {spec.note && <span> · {spec.note}</span>}
          </p>
        </div>
        <span
          className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: document ? 'var(--success-bg)' : spec.required ? 'var(--error-bg)' : 'var(--muted)',
            color:           document ? 'var(--success)'    : spec.required ? 'var(--error)'    : 'var(--muted-foreground)',
          }}
        >
          {busy ? 'Working…' : document ? 'Uploaded' : spec.required ? 'Required' : 'Optional'}
        </span>
      </div>

      {document ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}
        >
          <FileText size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--success)' }}>
              {document.fileName}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {document.fileSizeBytes != null ? formatSize(document.fileSizeBytes) : 'Uploaded'}
            </p>
          </div>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          {!readOnly ? (
            <button
              onClick={onRemove}
              disabled={busy}
              className="text-xs font-medium transition-opacity hover:opacity-70 flex-shrink-0"
              style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : readOnly ? (
        <p className="text-sm px-4 py-3 rounded-lg" style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}>
          No file uploaded.
        </p>
      ) : (
        <>
          <div
            className="flex flex-col items-center justify-center py-6 px-4 rounded-lg cursor-pointer transition-colors duration-150"
            style={{
              border:          `2px dashed ${dragging ? '#0D7A28' : 'var(--border)'}`,
              backgroundColor: dragging ? 'rgba(13,122,40,0.04)' : 'transparent',
              opacity: busy ? 0.6 : 1,
            }}
            onClick={() => !busy && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              if (!busy) handleFiles(e.dataTransfer.files)
            }}
          >
            <Upload size={20} style={{ color: 'var(--muted-foreground)', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {busy ? 'Uploading…' : 'Drag and drop or click to browse'}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={spec.accept}
            disabled={busy}
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </>
      )}
    </div>
  )
}
