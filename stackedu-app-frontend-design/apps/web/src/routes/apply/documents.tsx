import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle2, X } from 'lucide-react'
import { ApplyLayout, type ApplyStep } from '@/components/ApplyLayout'
import { Button } from '@/components/ui/button'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/documents')({
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
  id:       string
  label:    string
  required: boolean
  accept:   string
  hint:     string
  maxMB:    number
  note?:    string
}

const DOCS: DocSpec[] = [
  {
    id:       'national-id',
    label:    'National ID or Passport',
    required: true,
    accept:   '.pdf,.jpg,.jpeg,.png',
    hint:     'PDF, JPG, PNG',
    maxMB:    5,
  },
  {
    id:       'school-cert',
    label:    'Secondary School Certificate',
    required: true,
    accept:   '.pdf',
    hint:     'PDF only',
    maxMB:    10,
  },
  {
    id:       'transcripts',
    label:    'Academic Transcripts',
    required: true,
    accept:   '.pdf',
    hint:     'PDF only',
    maxMB:    10,
  },
  {
    id:       'photo',
    label:    'Passport Photo',
    required: true,
    accept:   '.jpg,.jpeg,.png',
    hint:     'JPG, PNG',
    maxMB:    2,
    note:     'Square format preferred',
  },
  {
    id:       'birth-cert',
    label:    'Birth Certificate',
    required: false,
    accept:   '.pdf,.jpg,.jpeg',
    hint:     'PDF, JPG',
    maxMB:    5,
  },
]

type Uploads = Record<string, { file: File; uploadedAt: string } | null>

// ─────────────────────────────────────────────────────────────────────────────

function ApplyDocumentsPage() {
  const navigate = useNavigate()
  const [uploads, setUploads] = useState<Uploads>(
    Object.fromEntries(DOCS.map((d) => [d.id, null])),
  )

  const requiredDocs   = DOCS.filter((d) => d.required)
  const uploadedCount  = Object.values(uploads).filter(Boolean).length
  const allRequiredMet = requiredDocs.every((d) => uploads[d.id] !== null)
  const progressPct    = Math.round((uploadedCount / DOCS.length) * 100)

  const setUpload = (id: string, file: File | null) => {
    setUploads((prev) => ({
      ...prev,
      [id]: file
        ? { file, uploadedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
        : null,
    }))
  }

  return (
    <ApplyLayout
      steps={STEPS}
      currentStep={6}
      completedSteps={[1, 2, 3, 4, 5]}
      progressPercent={100}
      showBanner
    >
      {/* Heading */}
      <div className="mb-6">
        <h2
          className="t-h2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}
        >
          Upload your documents
        </h2>
        <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Upload clear, readable copies. Accepted formats are PDF, JPG, and PNG.
        </p>
      </div>

      {/* Progress indicator card */}
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
            {uploadedCount} of {DOCS.length} documents uploaded
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

      {/* Document cards */}
      <div className="flex flex-col gap-4">
        {DOCS.map((doc) => (
          <DocCard
            key={doc.id}
            spec={doc}
            upload={uploads[doc.id] ?? null}
            onUpload={(f) => setUpload(doc.id, f)}
            onRemove={() => setUpload(doc.id, null)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate({ to: '/apply/form' })}>
            ← Back
          </Button>
          <Button
            onClick={() => navigate({ to: '/apply/payment' })}
            disabled={!allRequiredMet}
            title={!allRequiredMet ? 'Please upload all required documents' : undefined}
            className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          >
            Continue to payment
          </Button>
        </div>
        <div className="flex justify-center mt-3">
          <button
            type="button"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: '#0D7A28', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Save progress
          </button>
        </div>
      </div>
    </ApplyLayout>
  )
}

// ── Document upload card ──────────────────────────────────────────────────────

function DocCard({
  spec,
  upload,
  onUpload,
  onRemove,
}: {
  spec:     DocSpec
  upload:   { file: File; uploadedAt: string } | null
  onUpload: (f: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0]
    if (f) onUpload(f)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024)       return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
      {/* Header row */}
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
            backgroundColor: upload ? 'var(--success-bg)' : spec.required ? 'var(--error-bg)' : 'var(--muted)',
            color:           upload ? 'var(--success)'    : spec.required ? 'var(--error)'    : 'var(--muted-foreground)',
          }}
        >
          {upload ? 'Uploaded' : spec.required ? 'Required' : 'Optional'}
        </span>
      </div>

      {upload ? (
        /* Uploaded state */
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}
        >
          <FileText size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--success)' }}>
              {upload.file.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {formatSize(upload.file.size)} · Uploaded at {upload.uploadedAt}
            </p>
          </div>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <button
            onClick={onRemove}
            className="text-xs font-medium transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      ) : (
        /* Upload area */
        <>
          <div
            className="flex flex-col items-center justify-center py-6 px-4 rounded-lg cursor-pointer transition-colors duration-150"
            style={{
              border:          `2px dashed ${dragging ? '#0D7A28' : 'var(--border)'}`,
              backgroundColor: dragging ? 'rgba(13,122,40,0.04)' : 'transparent',
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFiles(e.dataTransfer.files)
            }}
          >
            <Upload size={20} style={{ color: 'var(--muted-foreground)', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Drag and drop or click to browse
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={spec.accept}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}
    </div>
  )
}
