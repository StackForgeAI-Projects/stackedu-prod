import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { StudyAssistantResponse } from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import { askStudentStudyAssistant } from '@/lib/api/student'
import { toast } from 'sonner'

export function StudyAssistantPanel({ offeringId }: { offeringId: string }) {
  const [message, setMessage] = useState('')
  const [answer, setAnswer] = useState<StudyAssistantResponse | null>(null)

  const mutation = useMutation({
    mutationFn: () => askStudentStudyAssistant({ offeringId, message: message.trim() }),
    onSuccess: (payload) => {
      setAnswer(payload)
      if (payload.refused) toast.message('That question was refused.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not ask the study assistant.')),
  })

  return (
    <section className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
      <h2 className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Study assistant</h2>
      <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
        Ask about published materials and library titles. Graded quizzes and assignments are refused.
      </p>
      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Remind me what an algorithm is from the notes."
        rows={3}
      />
      <div className="mt-3">
        <ConfirmAlertDialog
          trigger={
            <Button
              disabled={message.trim().length < 2 || mutation.isPending}
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              {mutation.isPending ? 'Asking…' : 'Ask'}
            </Button>
          }
          title="Ask the study assistant?"
          tone="info"
          headlineLabel="Action"
          headline="Ask from course materials"
          summary="The assistant only uses published readings and library titles for this course."
          notices={[
            { icon: 'lock', label: 'It will not answer graded quizzes or write your assignments.' },
            { icon: 'file', label: 'Citations point back to the materials it used.' },
          ]}
          confirmLabel="Ask"
          confirmVariant="brand"
          loading={mutation.isPending}
          onConfirm={async () => { await mutation.mutateAsync() }}
        />
      </div>
      {answer ? (
        <div className="mt-4">
          <p className="t-body whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{answer.reply}</p>
          {answer.citations.length > 0 ? (
            <p className="t-caption mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Sources: {answer.citations.map((item) => item.title).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
