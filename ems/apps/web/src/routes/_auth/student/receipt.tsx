import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { StudentShell } from '@/components/StudentShell'
import { IconActionButton } from '@/components/IconActionButton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStudentReceipt } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { downloadReceiptDocument } from '@/lib/receipt-download'

export const Route = createFileRoute('/_auth/student/receipt')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: PaymentReceiptPage,
})

function PaymentReceiptPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: ['student', 'receipt', id],
    queryFn: () => getStudentReceipt(id),
    enabled: Boolean(id),
  })

  const handleDownload = async () => {
    if (!data) return
    try {
      await downloadReceiptDocument({
        receiptNumber: data.receiptNumber,
        reference: data.reference,
        amount: data.amount,
        method: data.method,
        paidAt: data.paidAt,
        studentName: data.studentName,
        studentNumber: data.studentNumber,
        description: data.description,
        institutionName: data.institutionName,
        verificationCode: data.verificationCode,
      })
      toast.success(`Receipt ${data.receiptNumber} downloaded.`)
    } catch {
      toast.error('Could not download receipt.')
    }
  }

  return (
    <StudentShell pageTitle="Receipt" guide="Proof of a completed payment on your fee account. Download a PDF copy for your records.">
      <div className="animate-fade-up max-w-lg" style={{ padding: '24px 16px 56px' }}>
        <Link to="/student/fees" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Fees</Link>
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Payment receipt</h1>
          {data ? (
            <IconActionButton label="Download receipt PDF" icon={Download} onClick={() => void handleDownload()} />
          ) : null}
        </div>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Open a receipt from your fee statement.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading receipt…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load receipt.')}</p>
        ) : data ? (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <p className="text-2xl font-semibold mb-2">{formatCurrency(data.amount)}</p>
            <p className="text-sm mb-1">{data.description}</p>
            <p className="text-sm">{data.receiptNumber}</p>
            <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>{data.reference} · {data.method}</p>
            <p className="text-sm">{data.studentName} · {data.studentNumber}</p>
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{data.institutionName}</p>
            <p className="t-caption mt-2">{data.paidAt ? formatDateTime(data.paidAt) : 'Pending'}</p>
            {data.verificationCode ? (
              <p className="t-caption mt-2" style={{ color: 'var(--muted-foreground)' }}>Verification: {data.verificationCode}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </StudentShell>
  )
}
