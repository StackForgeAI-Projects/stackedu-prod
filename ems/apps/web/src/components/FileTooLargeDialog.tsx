import { useEffect, useRef, useState } from 'react'
import {
  EXTREME_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  formatUploadBytes,
  isExtremelyLargeUpload,
  isOverUploadLimit,
} from '@stackedu/shared'
import { isCompressibleImage, reduceUploadFile } from '@/lib/prepare-upload-file'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Phase = 'ready' | 'compressing' | 'accepted' | 'refused'

/**
 * Opens as soon as the user picks a file over 14 MB. Shows the original size
 * first so an extremely large file is flagged before any compression starts.
 */
export function FileTooLargeDialog({
  file,
  onAccept,
  onClose,
}: {
  file: File | null
  onAccept: (file: File) => void
  onClose: () => void
}) {
  if (!file) return null
  return (
    <FileTooLargeDialogBody
      key={`${file.name}:${file.size}:${file.lastModified}`}
      file={file}
      onAccept={onAccept}
      onClose={onClose}
    />
  )
}

function FileTooLargeDialogBody({
  file,
  onAccept,
  onClose,
}: {
  file: File
  onAccept: (file: File) => void
  onClose: () => void
}) {
  const extreme = isExtremelyLargeUpload(file.size)
  const canCompress = !extreme && isCompressibleImage(file)
  const [phase, setPhase] = useState<Phase>(canCompress ? 'compressing' : 'ready')
  const [resultSize, setResultSize] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const onAcceptRef = useRef(onAccept)

  useEffect(() => {
    onAcceptRef.current = onAccept
  }, [onAccept])

  useEffect(() => {
    if (!canCompress) return

    let cancelled = false
    void reduceUploadFile(file)
      .then((reduced) => {
        if (cancelled) return
        setResultSize(reduced.size)
        if (isOverUploadLimit(reduced.size)) {
          setPhase('refused')
          return
        }
        setPhase('accepted')
        onAcceptRef.current(reduced)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'Could not reduce that file.')
        setPhase('refused')
      })

    return () => {
      cancelled = true
    }
  }, [file, canCompress])

  const original = formatUploadBytes(file.size)
  const title = extreme
    ? 'This file is extremely large'
    : 'This file is too large'

  const body = extreme
    ? `The file you picked is ${original}. That is over ${formatUploadBytes(EXTREME_UPLOAD_BYTES)}, so we will not try to reduce it. Pick a file of ${MAX_UPLOAD_LABEL} or less.`
    : canCompress
      ? `The file you picked is ${original}. The maximum is ${MAX_UPLOAD_LABEL}. We are reducing it automatically.`
      : `The file you picked is ${original}. The maximum is ${MAX_UPLOAD_LABEL}. This file type cannot be reduced here. Pick a file of ${MAX_UPLOAD_LABEL} or less.`

  return (
    <AlertDialog open={Boolean(file)} onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialogContent
        className="max-w-md"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {body}
            {phase === 'compressing' ? ' Please wait…' : null}
            {phase === 'accepted' && resultSize != null
              ? ` Reduced to ${formatUploadBytes(resultSize)}. You can use this file.`
              : null}
            {phase === 'refused' && !error
              ? ` After reducing, the file is still ${formatUploadBytes(resultSize ?? file.size)}. Pick a smaller file.`
              : null}
            {error ? ` ${error}` : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {phase === 'accepted' ? 'Done' : 'Choose another file'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function useOversizeUpload() {
  const [oversizeFile, setOversizeFile] = useState<File | null>(null)

  const takeFile = (file: File | null, onReady: (next: File) => void) => {
    if (!file) return
    if (!isOverUploadLimit(file.size)) {
      onReady(file)
      return
    }
    setOversizeFile(file)
  }

  return { oversizeFile, setOversizeFile, takeFile }
}
